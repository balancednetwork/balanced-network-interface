import React from 'react';

import { t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import {
  fetchTxResult,
  getCallMessageSentEventFromLogs,
  getICONEventSignature,
  getXCallOriginEventDataFromICON,
} from 'app/_xcall/_icon/utils';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { getFeeParam } from 'app/_xcall/archway/utils';
import { DestinationXCallData, OriginXCallData, XCallActivityItem, XCallEvent } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import { ReactComponent as ArrowIcon } from 'assets/icons/arrow-white.svg';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useICONWalletModalToggle, useWalletModalToggle } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useAddTransactionResult, useInitTransaction } from 'store/transactionsCrosschain/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import {
  useAddOriginEvent,
  useRemoveEvent,
  useRollBackFromOrigin,
  useSetListeningTo,
  useXCallState,
} from 'store/xCall/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { UnderlineText } from '../DropdownText';
import Spinner from '../Spinner';

const Wrap = styled(Box)`
  display: grid;
  grid-template-columns: 4fr 3fr 3fr;
  grid-gap: 15px;
  width: 100%;
  padding-bottom: 20px;

  @media (min-width: 800px) and (max-width: 1049px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    * {
      text-align: center;
      align-items: center !important;
    }
  }

  @media (max-width: 580px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    * {
      text-align: center;
      align-items: center !important;
    }
  }

  @media (min-width: 1050px) {
    display: grid;
    grid-template-columns: 3fr 4fr 3fr;
  }
`;

const Status = styled(Typography)`
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-left: 10px;
`;

const FailedX = styled(Box)`
  width: 10px;
  height: 15px;
  margin-right: 10px;

  :before {
    content: 'X';
    display: block;
    font-size: 16px;
    line-height: 1.03;
    color: ${({ theme }) => theme.colors.alert};
  }
`;

const XCallItem = ({ chain, destinationData, originData, status }: XCallActivityItem) => {
  const { account } = useIconReact();
  const { signingClient, address: accountArch } = useArchwayContext();
  const xCallState = useXCallState();
  const addOriginEvent = useAddOriginEvent();
  // const listeningTo = useXCallListeningTo();
  // const stopListening = useStopListening();
  const removeEvent = useRemoveEvent();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  // const { isTxPending } = useArchwayTransactionsState();
  const setListeningTo = useSetListeningTo();
  const addTransaction = useTransactionAdder();
  // const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  // const isICONTxPending = useIsICONTxPending();
  const rollBackFromOrigin = useRollBackFromOrigin();
  const signedInWallets = useSignedInWallets();
  const toggleWalletModal = useWalletModalToggle();
  const toggleICONleWalletModal = useICONWalletModalToggle();

  const handleICONExecuteXCall = async (data: DestinationXCallData) => {
    if (account) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }

      // addTransaction

      bnJs.inject({ account });
      const { result: hash } = await bnJs.XCall.executeCall(`0x${data.reqId.toString(16)}`, data.data);
      addTransaction(
        { hash },
        { pending: 'Confirming cross-chain transaction.', summary: 'Cross-chain transaction confirmed.' },
      );
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
        );

        //TODO: move to handle ICON tx result together with CallMessage

        if (callExecutedEvent?.data[0] === '0x1') {
          const origin = xCallState.events[data.origin].origin.find(event => event.sn === data.sn);

          //has xCall emitted CallMessageSent event?
          const callMessageSentEvent = getCallMessageSentEventFromLogs(txResult.eventLogs);

          if (callMessageSentEvent) {
            //todo: find the destination event and determine destination for this new origin event
            const originEventData = getXCallOriginEventDataFromICON(
              callMessageSentEvent,
              'archway',
              origin?.descriptionAction || 'Swap',
              origin?.descriptionAmount || '',
            );
            originEventData && addOriginEvent('icon', originEventData);
          }

          removeEvent(data.sn, true);
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          if (callExecutedEvent?.data[1].toLocaleLowerCase().includes('revert')) {
            rollBackFromOrigin(data.origin, data.sn);

            setListeningTo('archway', XCallEvent.RollbackMessage);
          }
        }
      }
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      changeShouldLedgerSign(false);
    }
  };

  const handleArchwayExecuteXCall = async (data: DestinationXCallData) => {
    if (signingClient && accountArch) {
      const msg = {
        execute_call: {
          request_id: `${data.reqId}`,
          data: JSON.parse(data.data),
        },
      };

      try {
        initTransaction('archway', 'Confirming cross-chain transaction.');
        const res = await signingClient.execute(accountArch, ARCHWAY_CONTRACTS.xcall, msg, 'auto');

        const callExecuted = res.events.some(
          e => e.type === 'wasm-CallExecuted' && e.attributes.some(a => a.key === 'code' && a.value === '1'),
        );

        if (callExecuted) {
          removeEvent(data.sn, true);

          addTransactionResult('archway', res, 'Cross-chain transaction confirmed.');
        } else {
          addTransactionResult('archway', res || null, t`Transfer failed.`);
          rollBackFromOrigin(data.origin, data.sn);
        }
      } catch (e) {
        console.error(e);
        addTransactionResult('archway', null, t`Execution failed`);
      }
    }
  };

  const handleExecute = async (data: DestinationXCallData) => {
    if (data.chain === 'archway') {
      if (signedInWallets.find(w => w.chain === 'archway')?.address) {
        handleArchwayExecuteXCall(data);
      } else {
        toggleWalletModal();
      }
    } else if (data.chain === 'icon') {
      if (signedInWallets.find(w => w.chain === 'icon')?.address) {
        handleICONExecuteXCall(data);
      } else {
        toggleICONleWalletModal();
      }
    }
  };

  const handleArchwayRollbackXCall = async (data: OriginXCallData) => {
    if (signingClient && accountArch) {
      const msg = {
        execute_rollback: {
          sequence_no: `${data.sn}`,
        },
      };

      try {
        initTransaction('archway', 'Reverting cross-chain transaction...');
        const res = await signingClient.execute(accountArch, ARCHWAY_CONTRACTS.xcall, msg, getFeeParam(600000));

        //TODO: handle arch rollback response
        const rollbackExecuted = res.events.some(e => e.type === 'wasm-RollbackExecuted');

        if (rollbackExecuted) {
          removeEvent(data.sn, true);

          addTransactionResult('archway', res, 'Cross-chain transaction reverted.');
        } else {
          addTransactionResult('archway', res || null, t`Reverting failed.`);
        }
      } catch (e) {
        console.error(e);
        addTransactionResult('archway', null, t`Execution failed.`);
      }
    }
  };

  const handleICONRollbackXCall = async (data: OriginXCallData) => {
    if (account) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }

      bnJs.inject({ account });
      const { result: hash } = await bnJs.XCall.executeRollback(data.sn);
      addTransaction(
        { hash },
        { pending: 'Reverting cross-chain transaction...', summary: 'Cross-chain transaction reverted.' },
      );
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.RollbackExecuted)),
        );

        if (callExecutedEvent?.data[0] === '0x1') {
          removeEvent(data.sn, true);
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          //TODO: handle rollback error
        }
      }
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      changeShouldLedgerSign(false);
    }
  };

  const handleRollback = async (data: OriginXCallData) => {
    if (data.chain === 'archway') {
      if (signedInWallets.find(w => w.chain === 'archway')?.address) {
        handleArchwayRollbackXCall(data);
      } else {
        toggleWalletModal();
      }
    } else if (data.chain === 'icon') {
      if (signedInWallets.find(w => w.chain === 'icon')?.address) {
        handleICONRollbackXCall(data);
      } else {
        toggleICONleWalletModal();
      }
    }
  };

  const Action = () => {
    const [elapsedTime, setElapsedTime] = React.useState(0);
    const timestamp = originData.timestamp;

    React.useEffect(() => {
      if (status === 'pending') {
        const interval = setInterval(() => {
          const now = Date.now();
          const elapsed = Math.floor((now - timestamp) / 1000);
          setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(interval);
      }
    }, [timestamp]);

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    switch (status) {
      case 'pending':
        return (
          <>
            <Flex alignItems="center">
              <Spinner size={15} />
              <Status style={{ transform: 'translateY(1px)' }}>pending</Status>
            </Flex>
            <Typography opacity={0.75} fontSize={14}>
              {elapsedTime ? `${minutes ? minutes + 'm' : ''} ${seconds}s` : '...'}
            </Typography>
          </>
        );
      case 'executable':
        return (
          <>
            <Flex alignItems="center">
              <Spinner size={15} />
              <Status style={{ transform: 'translateY(1px)' }}>pending</Status>
            </Flex>
            <Box>
              {destinationData && (
                <UnderlineText onClick={e => handleExecute(destinationData)}>
                  <Typography color="primaryBright">Confirm transaction</Typography>
                </UnderlineText>
              )}
            </Box>
          </>
        );
      case 'failed':
        return (
          <>
            <Flex alignItems="center">
              <FailedX /> <Status style={{ transform: 'translateY(1px)' }}>Failed</Status>
            </Flex>
            <Box>
              <Typography opacity={0.75} fontSize={14}>
                Confirming rollback...
              </Typography>
            </Box>
          </>
        );
      case 'rollbackReady':
        return (
          <>
            <Flex alignItems="center">
              <FailedX /> <Status style={{ transform: 'translateY(1px)' }}>Failed</Status>
            </Flex>
            <Box>
              <UnderlineText onClick={e => handleRollback(originData)}>
                <Typography color="primaryBright">Revert transaction</Typography>
              </UnderlineText>
            </Box>
          </>
        );
      default:
        return <Typography color="text">Unknown</Typography>;
    }
  };

  return (
    <Wrap>
      <Flex alignItems="center">
        {getNetworkDisplayName(originData.chain)}
        <ArrowIcon width="13px" style={{ margin: '0 7px' }} />
        {getNetworkDisplayName(originData.destination)}
      </Flex>
      <Flex justifyContent="center" flexDirection="column">
        <Typography fontWeight={700} color="text">
          {originData.descriptionAction}
        </Typography>
        <Typography opacity={0.75} fontSize={14}>
          {originData.descriptionAmount}
        </Typography>
      </Flex>
      <Flex justifyContent="center" flexDirection="column" alignItems="flex-end" className="status-check">
        <Action />
      </Flex>
    </Wrap>
  );
};

export default XCallItem;
