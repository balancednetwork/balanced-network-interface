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
import { useArchwayTxManager } from 'app/_xcall/archway/txManager';
import { DestinationXCallData, SupportedXCallChains, XCallEvent } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
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
import { swapMessage } from './utils';

type XCallEventManagerProps = {
  xCallReset: () => void;
  executionTrade?: Trade<Currency, Currency, TradeType>;
  msgs: {
    [key in SupportedXCallChains]: {
      awaiting: string;
      actionRequired: string;
    };
  };
};

const XCallEventManager = ({ xCallReset, executionTrade, msgs }: XCallEventManagerProps) => {
  const { account } = useIconReact();
  const { signingCosmWasmClient, address: accountArch } = useArchwayContext();
  const iconDestinationEvents = useXCallDestinationEvents('icon');
  // const archwayOriginEvents = useXCallOriginEvents('archway');
  const archwayDestinationEvents = useXCallDestinationEvents('archway');
  const addOriginEvent = useAddOriginEvent();
  const listeningTo = useXCallListeningTo();
  // const stopListening = useStopListening();
  const removeEvent = useRemoveEvent();
  const archTxManager = useArchwayTxManager();
  const setListeningTo = useSetListeningTo();
  const addTransaction = useTransactionAdder();
  // const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  useArchwayEventListener(listeningTo?.chain === 'archway' ? listeningTo.event : null);
  useICONEventListener(listeningTo?.chain === 'icon' ? listeningTo.event : null);

  const swapMessages =
    executionTrade &&
    swapMessage(
      executionTrade.inputAmount.toFixed(2),
      executionTrade.inputAmount.currency.symbol || 'IN',
      executionTrade.outputAmount.toFixed(2),
      executionTrade.outputAmount.currency.symbol || 'OUT',
    );

  const handleArchwayExecuteXCall = (data: DestinationXCallData) => async () => {
    if (signingCosmWasmClient && accountArch) {
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
        archTxManager.initTransaction(t`Transferring swap result to Archway network.`);
        const res: ExecuteResult = await signingCosmWasmClient.execute(
          accountArch,
          ARCHWAY_CONTRACTS.xcall,
          msg,
          'auto',
        );

        console.log(res);
        console.log('Archway executeCall complete', res);

        const callExecuted = res.events.some(
          e => e.type === 'wasm-CallExecuted' && e.attributes.some(a => a.key === 'code' && a.value === '1'),
        );

        if (callExecuted) {
          removeEvent(data.sn, true);
          console.log('ARCHWAY executeCall - SUCCESS');
          xCallReset();
          archTxManager.addTransactionResult(res, t`Transfer complete.`);
        } else {
          console.log('ARCHWAY executeCall - FAIL');
          archTxManager.addTransactionResult(res || null, t`Transfer failed.`);
          //TODO: check for RollbackMessage on ICON
        }
      } catch (e) {
        console.error(e);
        archTxManager.setTxPending(false);
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
      addTransaction({ hash }, { pending: swapMessages?.pendingMessage, summary: swapMessages?.successMessage });
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
        );
        console.log('txResult: ', txResult);

        //TODO: move to handle ICON tx result together with CallMessage
        if (callExecutedEvent) {
          const sn = iconDestinationEvents.find(event => event.reqId === data.reqId)?.sn;
          sn && removeEvent(sn, true);
        }

        if (callExecutedEvent?.data[0] === '0x1') {
          console.log('xCALL EXECUTED SUCCESSFULLY');

          //has xCall emitted CallMessageSent event?
          const callMessageSentEvent = txResult.eventLogs.find(event =>
            event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
          );

          if (callMessageSentEvent) {
            console.log('CALL MESSAGE SENT EVENT DETECTED');
            console.log(callMessageSentEvent);
            const originEventData = getXCallOriginEventDataFromICON(callMessageSentEvent);
            originEventData && addOriginEvent('icon', originEventData);
          } else {
            xCallReset();
          }
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          console.log('xCALL EXECUTED WITH ERROR');
          if (callExecutedEvent?.data[1].toLocaleLowerCase().includes('revert')) {
            //TODO: test response messages
            console.log('xCALL EXECUTED WITH ERROR: ROLLBACK NEEDED');
            setListeningTo('archway', XCallEvent.ResponseMessage);
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
              <Typography mb={4}>Awaiting confirmation on {getNetworkDisplayName(listeningTo.chain)} </Typography>
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
                <Trans>Confirm the transfer to Archway network</Trans>
              </Typography>
              {archwayDestinationEvents.map(event => (
                <Flex alignItems="center" key={event.reqId}>
                  <Button onClick={handleArchwayExecuteXCall(event)} disabled={archTxManager.isTxPending}>
                    {archTxManager.isTxPending ? <Trans>Confirming...</Trans> : <Trans>Confirm transfer</Trans>}
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
                <Trans>Confirm the swap on ICON network</Trans>
              </Typography>
              {iconDestinationEvents.map(event => (
                <Flex alignItems="center" key={event.reqId}>
                  {/* //TODO: disabled for pending tx */}
                  <Button onClick={() => handleICONExecuteXCall(event)} disabled={false}>
                    <Trans>Confirm swap</Trans>
                    {/* {archTxManager.isTxPending ? <Trans>Confirming...</Trans> : <Trans>Confirm swap</Trans>} */}
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
