import React, { useCallback, useEffect, useState } from 'react';

import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import CrossIcon from '@/assets/icons/failure.svg';
import TickIcon from '@/assets/icons/tick.svg';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useIntentProvider from '@/hooks/useIntentProvider';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { intentService, intentServiceConfig } from '@/lib/intent';
import { MMTrade } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import {
  MMTransactionActions,
  MMTransactionStatus,
  useMMTransactionStore,
} from '@/store/transactions/useMMTransactionStore';
import { formatBigNumber, shortenAddress } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { XToken, xChainMap } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import { ChainName, CreateIntentOrderPayload, SolverApiService } from 'icon-intents-sdk';
import { WriteContractErrorType } from 'viem';
import { retryGetOrder } from '../utils';

type MMSwapModalProps = {
  modalId?: MODAL_ID;
  account: string | undefined;
  currencies: { [field in Field]?: XToken | undefined };
  trade?: MMTrade;
  recipient?: string | null;
  clearInputs: () => void;
};

enum IntentOrderStatus {
  None,
  // Intent order is signed and broadcasted to the source chain
  SigningAndCreating,
  // Intent order is created on the source chain and waiting for execution.
  Executing,
  // Intent order is filled on the target chain.
  Filled,
  //
  Failure,
}

const MMSwapModal = ({
  modalId = MODAL_ID.MM_SWAP_CONFIRM_MODAL,
  account,
  currencies,
  trade,
  recipient,
  clearInputs,
}: MMSwapModalProps) => {
  const modalOpen = useModalOpen(modalId);
  const { track } = useAnalytics();
  const [intentId, setIntentId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<IntentOrderStatus>(IntentOrderStatus.None);
  const [error, setError] = useState<string | null>(null);

  const intentFromChainName: ChainName | undefined = xChainMap[currencies[Field.INPUT]?.xChainId || '']?.intentChainId;
  const intentToChainName: ChainName | undefined = xChainMap[currencies[Field.OUTPUT]?.xChainId || '']?.intentChainId;

  const currentMMTransaction = useMMTransactionStore(state => state.get(intentId));

  useEffect(() => {
    if (currentMMTransaction) {
      currentMMTransaction.status === MMTransactionStatus.success && setOrderStatus(IntentOrderStatus.Filled);
      currentMMTransaction.status === MMTransactionStatus.failure && setOrderStatus(IntentOrderStatus.Failure);
    }
  }, [currentMMTransaction]);

  const isFilled = orderStatus === IntentOrderStatus.Filled;

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
      setIntentId(null);
      setOrderStatus(IntentOrderStatus.None);
      setError(null);
    }, 500);
  }, [modalId]);

  //to show success or fail message in the modal
  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss]);

  useEffect(() => {
    if (isFilled) {
      slowDismiss();
    }
  }, [isFilled, slowDismiss]);

  const chainConfig = intentFromChainName ? intentService.getChainConfig(intentFromChainName) : undefined;
  const intentContract = chainConfig && 'intentContract' in chainConfig ? chainConfig.intentContract : '0x';

  const { approvalState, approveCallback } = useApproveCallback(trade?.inputAmount, intentContract);

  const { data: intentProvider } = useIntentProvider(currencies[Field.INPUT]);

  const handleMMSwap = async () => {
    if (
      !account ||
      !recipient ||
      !currencies[Field.INPUT] ||
      !currencies[Field.OUTPUT] ||
      !trade ||
      !intentFromChainName ||
      !intentToChainName
    ) {
      return;
    }

    setOrderStatus(IntentOrderStatus.SigningAndCreating);
    clearInputs();

    const order: CreateIntentOrderPayload = {
      quote_uuid: trade.uuid,
      fromAddress: account,
      toAddress: recipient,
      fromChain: intentFromChainName,
      toChain: intentToChainName,
      token: currencies[Field.INPUT]?.wrapped.address,
      toToken: currencies[Field.OUTPUT]?.wrapped.address,
      amount: trade.inputAmount.quotient,
      toAmount: trade.outputAmount.quotient,
    };

    try {
      if (!intentProvider) {
        setOrderStatus(IntentOrderStatus.None);
        console.error('Invalid provider');
        return;
      }

      const intentHash = await intentService.createIntentOrder(order, intentProvider);

      if (!intentHash.ok) {
        const e = intentHash.error as WriteContractErrorType;

        if (e.name === 'ContractFunctionExecutionError' && e.details === 'User rejected the request.') {
          setOrderStatus(IntentOrderStatus.None);
          return;
        }

        // @ts-ignore
        setError(intentHash?.error?.shortMessage || 'Error creating intent order');
        setOrderStatus(IntentOrderStatus.Failure);
        return;
      }
      console.log('intent debug creation', intentHash);
      setOrderStatus(IntentOrderStatus.Executing);

      MMTransactionActions.add({
        id: intentHash.value,
        executor: account,
        status: MMTransactionStatus.pending,
        fromAmount: trade.inputAmount,
        toAmount: trade.outputAmount,
        orderId: BigInt(0), // will be set later
        taskId: '',
      });
      setIntentId(intentHash.value);

      const executionResult = await SolverApiService.postExecution(
        {
          intent_tx_hash: intentHash.value,
          quote_uuid: trade.uuid,
        },
        intentServiceConfig,
      );
      console.log('intent debug execution', executionResult);

      if (executionResult.ok) {
        MMTransactionActions.setTaskId(intentHash.value, executionResult.value.task_id);
        MMTransactionActions.success(intentHash.value);
        track('swap_intent', {
          from: xChainMap[direction.from].name,
          to: xChainMap[direction.to].name,
        });
      } else {
        setError(executionResult.error?.detail?.message || 'Failed to execute intent order');
        console.error('IntentService.executeIntentOrder error', executionResult.error);
        setOrderStatus(IntentOrderStatus.Failure);
      }

      // Retry getOrder until successful or max attempts reached
      const intentResult = await retryGetOrder(intentHash.value, intentFromChainName, intentProvider);
      console.log('intent debug order info', intentResult);

      if (!intentResult?.ok) {
        setError(intentResult.error?.message || 'Failed to get order details after multiple attempts');
        setOrderStatus(IntentOrderStatus.None);
      }
      MMTransactionActions.setOrderId(intentHash.value, BigInt(intentResult?.value?.id || ''));
    } catch (e) {
      console.error('SwapMMCommitButton error', e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      setOrderStatus(IntentOrderStatus.None);
    }
  };

  const direction = {
    from: currencies[Field.INPUT]?.xChainId || '0x1.icon',
    to: currencies[Field.OUTPUT]?.xChainId || '0x1.icon',
  };
  const gasChecker = useXCallGasChecker(direction.from, trade?.inputAmount);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  const isProcessing = orderStatus === IntentOrderStatus.Executing;

  return (
    <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
      <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
        <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
          <Trans>
            Swap {formatSymbol(currencies[Field.INPUT]?.symbol)} for {formatSymbol(currencies[Field.OUTPUT]?.symbol)}?
          </Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center" color="text">
          <Trans>
            {`${trade?.executionPrice.toSignificant(6)} ${formatSymbol(trade?.executionPrice.quoteCurrency.symbol)} 
              per ${formatSymbol(trade?.executionPrice.baseCurrency.symbol)}`}
          </Trans>
        </Typography>

        <Flex my={4}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">
              <Trans>Pay</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBigNumber(new BigNumber(trade?.inputAmount.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.INPUT]?.symbol}
            </Typography>
            <Typography textAlign="center">
              <Trans>{getNetworkDisplayName(direction.from)}</Trans>
            </Typography>
            <Typography textAlign="center">
              <Trans>{recipient && account && shortenAddress(account, 5)}</Trans>
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">
              <Trans>Receive</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBigNumber(new BigNumber(trade?.outputAmount.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.OUTPUT]?.symbol}
            </Typography>
            <Typography textAlign="center">
              <Trans>{getNetworkDisplayName(direction.to)}</Trans>
            </Typography>
            <Typography textAlign="center">
              <Trans>{recipient && shortenAddress(recipient, 5)}</Trans>
            </Typography>
          </Box>
        </Flex>

        <Typography textAlign="center">
          <Trans>Swap fee (included):</Trans>{' '}
          <strong>
            {formatBigNumber(new BigNumber(trade?.fee.toFixed() || 0), 'currency')}{' '}
            {formatSymbol(trade?.fee.currency.symbol)}
          </strong>
        </Typography>

        <AnimatePresence>
          {orderStatus === IntentOrderStatus.Failure && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box pt={3}>
                <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                  <Typography mb={4}>
                    <Trans>Swap failed</Trans>
                  </Typography>
                  {error ? (
                    <Typography maxWidth="320px" color="alert" textAlign="center">
                      {error}
                    </Typography>
                  ) : (
                    <CrossIcon width={20} height={20} />
                  )}
                </Flex>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {orderStatus !== IntentOrderStatus.Filled && (
            <motion.div
              key={'tx-actions'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <Flex justifyContent="center" mt={4} pt={4} className="border-top">
                <TextButton onClick={handleDismiss}>
                  <Trans>{isProcessing || orderStatus === IntentOrderStatus.Failure ? 'Close' : 'Cancel'}</Trans>
                </TextButton>

                {orderStatus !== IntentOrderStatus.Failure &&
                  (isWrongChain ? (
                    <StyledButton onClick={handleSwitchChain}>
                      <Trans>Switch to {xChainMap[direction.from].name}</Trans>
                    </StyledButton>
                  ) : isProcessing ? (
                    <StyledButton disabled $loading>
                      <Trans>Swapping</Trans>
                    </StyledButton>
                  ) : (
                    <>
                      {approvalState !== ApprovalState.APPROVED ? (
                        <StyledButton onClick={approveCallback} disabled={approvalState === ApprovalState.PENDING}>
                          {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve transfer'}
                        </StyledButton>
                      ) : (
                        <StyledButton onClick={handleMMSwap} disabled={!gasChecker.hasEnoughGas}>
                          <Trans>Swap</Trans>
                        </StyledButton>
                      )}
                    </>
                  ))}
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {orderStatus === IntentOrderStatus.Filled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box pt={3}>
                <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                  <Typography mb={4}>
                    <Trans>Completed</Trans>
                  </Typography>
                  <TickIcon width={20} height={20} />
                </Flex>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {orderStatus === IntentOrderStatus.None && !gasChecker.hasEnoughGas && (
          <Flex justifyContent="center" paddingY={2}>
            <Typography maxWidth="320px" color="alert" textAlign="center">
              {gasChecker.errorMessage}
            </Typography>
          </Flex>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MMSwapModal;
