import React from 'react';

import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { DestinationXCallData, OriginXCallData, XCallActivityItem, XCallEvent } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useAddTransactionResult, useInitTransaction } from 'store/transactionsCrosschain/hooks';
import {
  useAddOriginEvent,
  useRemoveEvent,
  useRollBackFromOrigin,
  useSetListeningTo,
  useXCallDestinationEvents,
} from 'store/xCall/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { UnderlineText } from '../DropdownText';
import Spinner from '../Spinner';

const Wrap = styled(Box)`
  display: grid;
  grid-template-columns: 3fr 4fr 3fr;
  grid-gap: 15px;
  width: 100%;
  padding-bottom: 20px;
`;

const Status = styled(Typography)`
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-left: 10px;
`;

const FailedX = styled(Box)`
  width: 15px;
  height: 15px;
  margin-right: 10px;

  :before {
    content: 'X',
    font-size: 16px;
    color: ${({ theme }) => theme.colors.alert};
  }
`;

const XCallItem = ({ chain, destinationData, originData, status }: XCallActivityItem) => {
  const { account } = useIconReact();
  const { signingClient, address: accountArch } = useArchwayContext();
  const iconDestinationEvents = useXCallDestinationEvents('icon');
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

  const handleICONExecuteXCall = async (data: DestinationXCallData) => {
    if (account) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }

      // addTransaction

      bnJs.inject({ account });
      const { result: hash } = await bnJs.XCall.executeCall(`0x${data.reqId.toString(16)}`, data.data);
      addTransaction({ hash }, { pending: 'Confirming xCall', summary: 'xCall confirmed successfully' });
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
        );
        console.log('xCall debug - ICON executeCall tx result: ', txResult);

        //TODO: move to handle ICON tx result together with CallMessage

        if (callExecutedEvent?.data[0] === '0x1') {
          console.log('xCall debug - xCall executed successfully');
          const sn = iconDestinationEvents.find(event => event.reqId === data.reqId)?.sn;
          sn && removeEvent(sn, true);

          //has xCall emitted CallMessageSent event?
          const callMessageSentEvent = txResult.eventLogs.find(event =>
            event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
          );

          if (callMessageSentEvent) {
            console.log('xCall debug - CallMessageSent event detected', callMessageSentEvent);
            const originEventData = getXCallOriginEventDataFromICON(
              callMessageSentEvent,
              'todo action manager',
              'todo action manager',
            );
            originEventData && addOriginEvent('icon', originEventData);
          }
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          console.log('xCall debug - xCall executed with error');
          if (callExecutedEvent?.data[1].toLocaleLowerCase().includes('revert')) {
            rollBackFromOrigin(data.origin, data.sn);
            console.log('xCall debug - xCALL rollback needed');
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
        initTransaction('archway', 'Confirming xCall');
        const res: ExecuteResult = await signingClient.execute(accountArch, ARCHWAY_CONTRACTS.xcall, msg, 'auto');

        console.log('xCall debug - Archway executeCall complete', res);

        const callExecuted = res.events.some(
          e => e.type === 'wasm-CallExecuted' && e.attributes.some(a => a.key === 'code' && a.value === '1'),
        );

        if (callExecuted) {
          removeEvent(data.sn, true);
          console.log('xCall debug - Archway executeCall - success');
          addTransactionResult('archway', res, 'xCall confirmed successfully');
        } else {
          console.log('xCall debug - Archway executeCall - fail');
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
      handleArchwayExecuteXCall(data);
    } else if (data.chain === 'icon') {
      handleICONExecuteXCall(data);
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
        initTransaction('archway', 'Executing xCall rollback');
        const res: ExecuteResult = await signingClient.execute(accountArch, ARCHWAY_CONTRACTS.xcall, msg, {
          amount: [{ amount: '1', denom: 'aconst' }],
          gas: '300000',
        });

        console.log('xCall debug - Archway rollbackCall complete', res);
        //TODO: handle arch rollback response
        // const callExecuted = res.events.some(
        //   e => e.type === 'wasm-CallExecuted' && e.attributes.some(a => a.key === 'code' && a.value === '1'),
        // );

        // if (callExecuted) {
        //   removeEvent(data.sn, true);
        //   console.log('xCall debug - Archway rollbackCall - success');
        //   addTransactionResult('archway', res, 'xCall rollback confirmed successfully');
        // } else {
        //   console.log('xCall debug - Archway rollbackCall - fail');
        //   addTransactionResult('archway', res || null, t`Rollback failed.`);
        // }
      } catch (e) {
        console.error(e);
        addTransactionResult('archway', null, t`Execution failed`);
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
      addTransaction({ hash }, { pending: 'Executing xCall rollback...', summary: 'Rollback executed.' });
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.RollbackExecuted)),
        );
        console.log('xCall debug - ICON execute rollback tx result: ', txResult);

        if (callExecutedEvent?.data[0] === '0x1') {
          console.log('xCall debug - xCall rollback executed successfully');
          removeEvent(data.sn, true);
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          console.log('xCall debug - xCall rollback executed with error');
          //TODO: handle rollback error
        }
      }
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      changeShouldLedgerSign(false);
    }
  };

  const handleRollback = async (data: OriginXCallData) => {
    if (data.chain === 'archway') {
      handleArchwayRollbackXCall(data);
    } else if (data.chain === 'icon') {
      handleICONRollbackXCall(data);
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
                  <Typography color="primaryBright">Confirm call</Typography>
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
              <UnderlineText onClick={e => handleRollback(originData)}>
                <Typography color="primaryBright">Revert call</Typography>
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
      <Flex alignItems="center">{`${getNetworkDisplayName(originData.chain)} -> ${
        destinationData ? getNetworkDisplayName(destinationData.chain) : '...'
      }`}</Flex>
      <Flex justifyContent="center" flexDirection="column">
        <Typography fontWeight={700} color="text">
          {originData.descriptionAction}
        </Typography>
        <Typography opacity={0.75} fontSize={14}>
          {originData.descriptionAmount}
        </Typography>
      </Flex>
      <Flex justifyContent="center" flexDirection="column" alignItems="flex-end">
        <Action />
      </Flex>
    </Wrap>
  );
};

export default XCallItem;
