import React from 'react';

import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass';

import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { getFeeParam } from 'app/_xcall/archway/utils';
import { DestinationXCallData, OriginXCallData, SupportedXCallChains, XCallEvent } from 'app/_xcall/types';
import { getOriginEvent } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { ICONTxEventLog } from 'store/transactions/actions';
import { useIsICONTxPending, useTransactionAdder } from 'store/transactions/hooks';
import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';
import {
  useAddOriginEvent,
  useRemoveEvent,
  useRollBackFromOrigin,
  useSetListeningTo,
  useXCallState,
} from 'store/xCall/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Button } from '../Button';
import Spinner from '../Spinner';

type XCallExecutionHandlerProps = {
  event: DestinationXCallData;
  xCallReset: () => void;
  clearInputs?: () => void;
  callback?: (success: boolean) => void;
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

const XCallExecutionHandlerICON = ({ event, msgs, clearInputs, xCallReset, callback }: XCallExecutionHandlerProps) => {
  const xCallState = useXCallState();
  const { account } = useIconReact();
  const { signingClient, address: accountArch } = useArchwayContext();
  const addTransaction = useTransactionAdder();
  // const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const removeEvent = useRemoveEvent();
  const addOriginEvent = useAddOriginEvent();
  const rollBackFromOrigin = useRollBackFromOrigin();
  const setListeningTo = useSetListeningTo();
  const isICONTxPending = useIsICONTxPending();
  const originEvent = React.useMemo(() => getOriginEvent(event.sn, xCallState), [event.sn, xCallState]);
  const addTransactionResult = useAddTransactionResult();
  const initTransaction = useInitTransaction();
  const { isTxPending } = useArchwayTransactionsState();

  const handleArchwayRollbackXCall = async (data: OriginXCallData) => {
    if (signingClient && accountArch) {
      const msg = {
        execute_rollback: {
          sequence_no: `${data.sn}`,
        },
      };

      try {
        initTransaction('archway', 'Executing rollback...');
        const res = await signingClient.execute(accountArch, ARCHWAY_CONTRACTS.xcall, msg, getFeeParam(600000));

        const rollbackExecuted = res.events.some(e => e.type === 'wasm-RollbackExecuted');

        if (rollbackExecuted) {
          callback && callback(true);
          removeEvent(data.sn, true);

          addTransactionResult('archway', res, 'Rollback executed');
          xCallReset();
        } else {
          addTransactionResult('archway', res || null, t`Rollback failed.`);
        }
      } catch (e) {
        console.error(e);
        addTransactionResult('archway', null, t`Execution failed`);
      }
    }
  };

  const xCallSwapSuccessPredicate = (eventLogs: ICONTxEventLog[]) => {
    const callExecutedEvent = eventLogs.find(log =>
      log.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
    );
    return callExecutedEvent ? callExecutedEvent.data[0] === '0x1' : false;
  };

  const handleICONExecuteXCall = async (data: DestinationXCallData) => {
    if (account) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }

      bnJs.inject({ account });
      const { result: hash } = await bnJs.XCall.executeCall(`0x${data.reqId.toString(16)}`, data.data);
      addTransaction(
        { hash },
        {
          pending: msgs.txMsgs.icon.pending,
          summary: msgs.txMsgs.icon.summary,
          isTxSuccessfulBasedOnEvents: xCallSwapSuccessPredicate,
        },
      );
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
        );

        if (callExecutedEvent?.data[0] === '0x1') {
          callback && callback(true);
          const sn = xCallState.events['icon'].destination.find(event => event.reqId === data.reqId)?.sn;
          sn && removeEvent(sn, true);

          clearInputs && clearInputs();
          //has xCall emitted CallMessageSent event?
          const callMessageSentEvent = txResult.eventLogs.find(event =>
            event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
          );

          if (callMessageSentEvent) {
            //todo: find the destination event and determine destination for this new origin event
            const originEventData = getXCallOriginEventDataFromICON(
              callMessageSentEvent,
              'archway',
              'todo event manager',
              'todo event manager',
            );
            originEventData && addOriginEvent('icon', originEventData);
          } else {
            xCallReset();
          }
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          callback && callback(false);
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

  if (originEvent && !originEvent.rollbackRequired && originEvent.autoExecute) {
    return (
      <Flex alignItems="center" justifyContent="center" flexDirection="column">
        <Typography mb={4}>{t`Awaiting execution on ICON.`}</Typography>
        <Spinner />
      </Flex>
    );
  }

  if (originEvent && !originEvent.rollbackRequired && !originEvent.autoExecute) {
    return (
      <>
        <Typography mb={4}>
          <Trans>{msgs.managerMsgs.icon.actionRequired}</Trans>
        </Typography>
        <Flex alignItems="center" key={event.reqId}>
          <Button onClick={() => handleICONExecuteXCall(event)} disabled={isICONTxPending}>
            {isICONTxPending ? <Trans>Confirming...</Trans> : <Trans>Confirm</Trans>}
          </Button>
        </Flex>
      </>
    );
  }

  if (originEvent && originEvent.rollbackRequired && !originEvent.rollbackReady) {
    return (
      <>
        <Typography mb={4}>
          <Trans>Couldn't complete transaction. Revert requested.</Trans>
        </Typography>
        <Flex alignItems="center">
          <Spinner />
        </Flex>
      </>
    );
  }

  if (originEvent && originEvent.rollbackRequired && originEvent.rollbackReady) {
    return (
      <>
        <Typography mb={4}>
          <Trans>Revert transaction.</Trans>
        </Typography>
        <Flex alignItems="center">
          <Button onClick={() => handleArchwayRollbackXCall(originEvent)} disabled={isTxPending}>
            {isTxPending ? <Trans>Reverting...</Trans> : <Trans>Revert</Trans>}
          </Button>
        </Flex>
      </>
    );
  }

  return null;
};

export default XCallExecutionHandlerICON;
