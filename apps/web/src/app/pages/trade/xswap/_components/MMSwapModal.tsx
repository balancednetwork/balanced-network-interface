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
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
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
import { getNetworkDisplayName } from '@/utils/xTokens';
import { CreateIntentOrderPayload, EvmProvider, SolverApiService, SuiProvider } from '@balancednetwork/intents-sdk';
import {
  EvmXService,
  XToken,
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useXService,
  xChainMap,
} from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import { WriteContractErrorType } from 'viem';

type MMSwapModalProps = {
  modalId?: MODAL_ID;
  account: string | undefined;
  currencies: { [field in Field]?: XToken | undefined };
  trade?: MMTrade;
  recipient?: string | null;
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
}: MMSwapModalProps) => {
  const modalOpen = useModalOpen(modalId);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<IntentOrderStatus>(IntentOrderStatus.None);
  const [error, setError] = useState<string | null>(null);

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

  // arb part
  const evmXService = useXService('EVM') as unknown as EvmXService;
  // end arb part

  // sui part
  const suiClient = useSuiClient();
  const { currentWallet: suiWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  // end sui part

  const { approvalState, approveCallback } = useApproveCallback(
    trade?.inputAmount,
    trade?.inputAmount.currency.xChainId === '0xa4b1.arbitrum'
      ? intentService.getChainConfig('arb').intentContract
      : // sui doesn't need approval. '0x' is a dummy address to pass the check
        '0x',
  );

  const handleMMSwap = async () => {
    if (!account || !recipient || !currencies[Field.INPUT] || !currencies[Field.OUTPUT] || !trade) {
      return;
    }
    setOrderStatus(IntentOrderStatus.SigningAndCreating);

    const isFromArbitrum = currencies[Field.INPUT].xChainId === '0xa4b1.arbitrum';

    const order: CreateIntentOrderPayload = {
      quote_uuid: trade.uuid,
      fromAddress: account, // address we are sending funds from (fromChain)
      toAddress: recipient, // destination address where funds are transfered to (toChain)
      // fromChain: currencies[Field.INPUT]?.xChainId, // ChainName
      // toChain: currencies[Field.OUTPUT]?.xChainId, // ChainName
      fromChain: isFromArbitrum ? 'arb' : 'sui',
      toChain: currencies[Field.OUTPUT].xChainId === 'sui' ? 'sui' : 'arb',
      token: currencies[Field.INPUT]?.address,
      toToken: currencies[Field.OUTPUT]?.address,
      amount: trade.inputAmount.quotient,
      toAmount: trade.outputAmount.quotient,
    };

    try {
      let provider;
      if (isFromArbitrum) {
        const evmWalletClient = await evmXService.getWalletClient(xChainMap[currencies[Field.INPUT]?.chainId]);
        const evmPublicClient = evmXService.getPublicClient(xChainMap[currencies[Field.INPUT]?.chainId]);

        // @ts-ignore
        provider = new EvmProvider({ walletClient: evmWalletClient, publicClient: evmPublicClient });
      } else {
        // @ts-ignore
        provider = new SuiProvider({ client: suiClient, wallet: suiWallet, account: suiAccount });
      }
      const intentHash = await intentService.createIntentOrder(order, provider);

      setOrderStatus(IntentOrderStatus.Executing);

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

      const intentResult = await intentService.getOrder(intentHash.value, isFromArbitrum ? 'arb' : 'sui', provider);

      if (!intentResult.ok) {
        return;
      }

      MMTransactionActions.add({
        id: intentHash.value,
        executor: account,
        status: MMTransactionStatus.pending,
        fromAmount: trade.inputAmount,
        toAmount: trade.outputAmount,
        orderId: BigInt(intentResult.value.id),
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

      if (executionResult.ok) {
        MMTransactionActions.setTaskId(intentHash.value, executionResult.value.task_id);
      } else {
        setError(executionResult.error?.detail?.message);
        console.error('IntentService.executeIntentOrder error', executionResult.error);
        setOrderStatus(IntentOrderStatus.Failure);
      }
    } catch (e) {
      setOrderStatus(IntentOrderStatus.None);
      console.error('SwapMMCommitButton error', e);
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
            Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
          </Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center" color="text">
          <Trans>
            {`${trade?.executionPrice.toSignificant(6)} ${trade?.executionPrice.quoteCurrency.symbol} 
              per ${trade?.executionPrice.baseCurrency.symbol}`}
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
            {formatBigNumber(new BigNumber(trade?.fee.toFixed() || 0), 'currency')} {trade?.fee.currency.symbol}
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
