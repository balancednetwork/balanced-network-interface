import React from 'react';

import { Currency, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t, Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { archway } from 'app/pages/trade/bridge-v2/_config/xChains';
import { getFeeParam } from 'app/_xcall/archway/utils';
import { DestinationXCallData, XChainId, XCallEventType } from 'app/pages/trade/bridge-v2/types';
import { getNetworkDisplayName } from 'app/pages/trade/bridge-v2/utils';
import { Typography } from 'app/theme';
import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';
import {
  useXCallDestinationEvents,
  useXCallListeningTo,
  useRemoveEvent,
  useRollBackFromOrigin,
  useXCallState,
} from 'store/xCall/hooks';

import { Button } from '../Button';
import Spinner from '../Spinner';
import XCallExecutionHandlerICON from './XCallExecutionHandlerICON';

type XCallEventManagerProps = {
  xCallReset: () => void;
  clearInputs?: () => void;
  executionTrade?: Trade<Currency, Currency, TradeType>;
  callback?: (success: boolean) => void;
  msgs: {
    txMsgs: {
      [key in XChainId]?: {
        pending: string;
        summary: string;
      };
    };
    managerMsgs: {
      [key in XChainId]?: {
        awaiting: string;
        actionRequired: string;
      };
    };
  };
};

const XCallEventManager = ({ xCallReset, clearInputs, msgs, callback }: XCallEventManagerProps) => {
  const { signingClient, address: accountArch } = useArchwayContext();
  const iconDestinationEvents = useXCallDestinationEvents('0x1.icon');
  const archwayDestinationEvents = useXCallDestinationEvents('archway-1');
  const listeningTo = useXCallListeningTo();
  const removeEvent = useRemoveEvent();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  const { isTxPending } = useArchwayTransactionsState();
  const rollBackFromOrigin = useRollBackFromOrigin();
  const xCallState = useXCallState();

  const anyPristineEvents = React.useMemo(() => {
    return Object.keys(xCallState.events).reduce(
      (pristineEvents, chain) => {
        let hasPristineEvents = false;
        xCallState.events[chain].origin.forEach(event => {
          if (event.isPristine) {
            hasPristineEvents = true;
          }
        });
        xCallState.events[chain].destination.forEach(event => {
          if (event.isPristine) {
            hasPristineEvents = true;
          }
        });
        pristineEvents[chain] = hasPristineEvents;
        return pristineEvents;
      },
      {} as { [key in XChainId]: boolean },
    );
  }, [xCallState.events]);

  const handleArchwayExecuteXCall = async (data: DestinationXCallData) => {
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
        initTransaction('archway-1', msgs.txMsgs['archway-1']!.pending);
        const res = await signingClient.execute(accountArch, archway.contracts.xCall, msg, getFeeParam(600000));

        const callExecuted = res.events.some(
          e => e.type === 'wasm-CallExecuted' && e.attributes.some(a => a.key === 'code' && a.value === '1'),
        );

        if (callExecuted) {
          removeEvent(data.sn, true);

          callback && callback(true);
          xCallReset();
          addTransactionResult('archway-1', res, msgs.txMsgs['archway-1']!.summary);
        } else {
          callback && callback(false);
          addTransactionResult('archway-1', res || null, t`Transfer failed.`);
          rollBackFromOrigin(data.origin, data.sn);
        }
      } catch (e) {
        console.error(e);
        addTransactionResult('archway-1', null, t`Execution failed`);
      }
    }
  };

  const SpinnerControl = () => {
    if (listeningTo?.chain === 'archway-1') {
      return archwayDestinationEvents.length === 0 ? <Spinner /> : null;
    } else if (listeningTo?.chain === '0x1.icon') {
      return iconDestinationEvents.length === 0 ? <Spinner /> : null;
    }
    return null;
  };

  const MemoizedSpinnerControl = React.memo(SpinnerControl);

  return (
    <AnimatePresence>
      {listeningTo?.event === XCallEventType.CallMessage &&
        Object.values(anyPristineEvents).some(pristine => pristine) && (
          <motion.div
            key="event-wrap-CallMessage"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box pt={3}>
              <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                <Typography mb={4}>{t`Awaiting confirmation on ${getNetworkDisplayName(
                  listeningTo.chain,
                )}.`}</Typography>
                <MemoizedSpinnerControl />
              </Flex>
            </Box>
          </motion.div>
        )}

      {archwayDestinationEvents.length > 0 && anyPristineEvents.archway && (
        <motion.div
          key="event-wrap-awaiting-arch-confirmation"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Box pt={3}>
            {archwayDestinationEvents.map(event => (
              <Flex
                key={event.sn}
                pt={3}
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
                className="border-top"
              >
                {event.autoExecute ? (
                  <>
                    <Typography mb={4}>
                      <Trans>Awaiting execution on Archway.</Trans>
                    </Typography>
                    <Spinner />
                  </>
                ) : (
                  <>
                    <Typography mb={4}>
                      <Trans>{msgs.managerMsgs['archway-1']!.actionRequired}</Trans>
                    </Typography>
                    <Flex alignItems="center">
                      <Button onClick={e => handleArchwayExecuteXCall(event)} disabled={isTxPending}>
                        {isTxPending ? <Trans>Confirming...</Trans> : <Trans>Confirm</Trans>}
                      </Button>
                    </Flex>
                  </>
                )}
              </Flex>
            ))}
          </Box>
        </motion.div>
      )}

      {iconDestinationEvents.length > 0 && anyPristineEvents['0x1.icon'] && (
        <motion.div
          key="event-wrap-awaiting-icon-confirmation"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Box pt={3}>
            <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
              {iconDestinationEvents.map(event => (
                <XCallExecutionHandlerICON
                  key={event.sn}
                  event={event}
                  msgs={msgs}
                  clearInputs={clearInputs}
                  xCallReset={xCallReset}
                  callback={callback}
                />
              ))}
            </Flex>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default XCallEventManager;
