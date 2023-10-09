import React from 'react';

import { Currency, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { t, Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass';

import { useICONEventListener } from 'app/_xcall/_icon/eventHandlers';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { useArchwayEventListener } from 'app/_xcall/archway/eventHandler';
import { DestinationXCallData, SupportedXCallChains, XCallEvent } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useIsICONTxPending, useTransactionAdder } from 'store/transactions/hooks';
import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';
import {
  useAddOriginEvent,
  useXCallDestinationEvents,
  useXCallListeningTo,
  useRemoveEvent,
  useSetListeningTo,
} from 'store/xCall/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Button } from '../Button';
import Spinner from '../Spinner';

type XCallEventManagerProps = {
  xCallReset: () => void;
  clearInputs?: () => void;
  executionTrade?: Trade<Currency, Currency, TradeType>;
  msgs: {
    txMsgs: {
      [key in SupportedXCallChains]: {
        pending: string;
        summary: string;
      };
    };
    managerMsgs: {
      [key in SupportedXCallChains]: {
        awaiting: string;
        actionRequired: string;
      };
    };
  };
};

const XCallEventManager = ({ xCallReset, clearInputs, executionTrade, msgs }: XCallEventManagerProps) => {
  const { account } = useIconReact();
  const { signingClient, address: accountArch } = useArchwayContext();
  const iconDestinationEvents = useXCallDestinationEvents('icon');
  // const archwayOriginEvents = useXCallOriginEvents('archway');
  const archwayDestinationEvents = useXCallDestinationEvents('archway');
  const addOriginEvent = useAddOriginEvent();
  const listeningTo = useXCallListeningTo();
  // const stopListening = useStopListening();
  const removeEvent = useRemoveEvent();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  const { isTxPending } = useArchwayTransactionsState();
  const setListeningTo = useSetListeningTo();
  const addTransaction = useTransactionAdder();
  // const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const isICONTxPending = useIsICONTxPending();

  useArchwayEventListener(listeningTo?.chain === 'archway' ? listeningTo.event : null);
  useICONEventListener(listeningTo?.chain === 'icon' ? listeningTo.event : null);

  const handleArchwayExecuteXCall = (data: DestinationXCallData) => async () => {
    if (signingClient && accountArch) {
      const msg = {
        execute_call: {
          request_id: `${data.reqId}`,
          data: JSON.parse(data.data),
        },
      };

      // {
      //   amount: [{ amount: '1', denom: 'aconst' }],
      //   gas: '600000',
      // }

      try {
        initTransaction('archway', msgs.txMsgs.archway.pending);
        const res: ExecuteResult = await signingClient.execute(accountArch, ARCHWAY_CONTRACTS.xcall, msg, 'auto');

        console.log('xCall debug - Archway executeCall complete', res);

        const callExecuted = res.events.some(
          e => e.type === 'wasm-CallExecuted' && e.attributes.some(a => a.key === 'code' && a.value === '1'),
        );

        if (callExecuted) {
          removeEvent(data.sn, true);
          console.log('xCall debug - Archway executeCall - success');
          xCallReset();
          addTransactionResult('archway', res, msgs.txMsgs.archway.summary);
        } else {
          console.log('xCall debug - Archway executeCall - fail');
          addTransactionResult('archway', res || null, t`Transfer failed.`);
          //TODO: check for RollbackMessage on ICON
        }
      } catch (e) {
        console.error(e);
        addTransactionResult('archway', null, t`Execution failed`);
      }
    }
  };

  const handleICONExecuteXCall = async (data: DestinationXCallData) => {
    if (account) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }

      // addTransaction

      bnJs.inject({ account });
      const { result: hash } = await bnJs.XCall.executeCall(`0x${data.reqId.toString(16)}`, data.data);
      addTransaction({ hash }, { pending: msgs.txMsgs.icon.pending, summary: msgs.txMsgs.icon.summary });
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
        );
        console.log('xCall debug - ICON executeCall tx result: ', txResult);

        //TODO: move to handle ICON tx result together with CallMessage
        if (callExecutedEvent) {
          const sn = iconDestinationEvents.find(event => event.reqId === data.reqId)?.sn;
          sn && removeEvent(sn, true);
        }

        if (callExecutedEvent?.data[0] === '0x1') {
          console.log('xCall debug - xCall executed successfully');
          clearInputs && clearInputs();
          //has xCall emitted CallMessageSent event?
          const callMessageSentEvent = txResult.eventLogs.find(event =>
            event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
          );

          if (callMessageSentEvent) {
            console.log('xCall debug - CallMessageSent event detected', callMessageSentEvent);
            const originEventData = getXCallOriginEventDataFromICON(callMessageSentEvent);
            originEventData && addOriginEvent('icon', originEventData);
          } else {
            xCallReset();
          }
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          console.log('xCall debug - xCall executed with error');
          if (callExecutedEvent?.data[1].toLocaleLowerCase().includes('revert')) {
            //TODO: test response messages
            console.log('xCall debug - xCALL rollback needed');
            setListeningTo('archway', XCallEvent.RollbackMessage);
          }
        }
      }
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      changeShouldLedgerSign(false);
    }
  };

  const SpinnerControl = () => {
    if (listeningTo?.chain === 'archway') {
      return archwayDestinationEvents.length === 0 ? <Spinner /> : null;
    } else if (listeningTo?.chain === 'icon') {
      return iconDestinationEvents.length === 0 ? <Spinner /> : null;
    }
    return null;
  };

  const MemoizedSpinnerControl = React.memo(SpinnerControl);

  return (
    <AnimatePresence>
      {listeningTo?.event === XCallEvent.CallMessage && (
        <motion.div
          key="event-wrap-CallMessage"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Box pt={3}>
            <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
              <Typography mb={4}>{t`Listening on ${getNetworkDisplayName(
                listeningTo.chain,
              )} network for confirmation.`}</Typography>
              <MemoizedSpinnerControl />
            </Flex>
          </Box>
        </motion.div>
      )}

      {archwayDestinationEvents.length > 0 && (
        <motion.div
          key="event-wrap-awaiting-arch-confirmation"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Box pt={3}>
            <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
              <Typography mb={4}>
                <Trans>{msgs.managerMsgs.archway.actionRequired}</Trans>
              </Typography>
              {archwayDestinationEvents.map(event => (
                <Flex alignItems="center" key={event.reqId}>
                  <Button onClick={handleArchwayExecuteXCall(event)} disabled={isTxPending}>
                    {isTxPending ? <Trans>Confirming...</Trans> : <Trans>Confirm</Trans>}
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Box>
        </motion.div>
      )}

      {iconDestinationEvents.length > 0 && (
        <motion.div
          key="event-wrap-awaiting-icon-confirmation"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Box pt={3}>
            <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
              <Typography mb={4}>
                <Trans>{msgs.managerMsgs.icon.actionRequired}</Trans>
              </Typography>
              {iconDestinationEvents.map(event => (
                <Flex alignItems="center" key={event.reqId}>
                  <Button onClick={() => handleICONExecuteXCall(event)} disabled={isICONTxPending}>
                    {isICONTxPending ? <Trans>Confirming...</Trans> : <Trans>Confirm</Trans>}
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default XCallEventManager;
