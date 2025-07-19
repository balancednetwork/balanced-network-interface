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
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useIntentProvider from '@/hooks/useIntentProvider';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useWalletPrompting } from '@/hooks/useWalletPrompting';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { intentService, intentServiceConfig } from '@/lib/intent';
import { MMTrade, tryParseAmount, useDerivedTradeInfo, useSwapActionHandlers } from '@/store/swap/hooks';
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
import { ChainName } from 'icon-intents-sdk';
import { logError, logMessage } from '@/sentry';
import { CreateIntentParams, encodeAddress, SpokeChainId, Token } from '@sodax/sdk';
import { useCreateIntentOrder, useSwapAllowance, useSwapApprove } from '@sodax/dapp-kit';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { scaleTokenAmount } from '@/lib/sodax/utils';
import { useMemo } from 'react';
import { ApprovalState } from '@/hooks/useApproveCallback';

type OrderModalProps = {
  modalId?: MODAL_ID;
  recipient?: string | null;
  setOrders: (orders: any) => void;
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

const OrderModal = ({ modalId = MODAL_ID.ORDER_CONFIRM_MODAL, recipient, setOrders }: OrderModalProps) => {
  const modalOpen = useModalOpen(modalId);
  const { quote, formattedAmounts, minOutputAmount, sourceAddress, direction, currencies, inputError, exchangeRate } =
    useDerivedTradeInfo();
  const { track } = useAnalytics();
  const [intentId, setIntentId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<IntentOrderStatus>(IntentOrderStatus.None);
  const [error, setError] = useState<string | null>(null);
  const { onUserInput } = useSwapActionHandlers();
  const { isWalletPrompting, setWalletPrompting } = useWalletPrompting();

  const intentFromChainName: ChainName | undefined = xChainMap[currencies[Field.INPUT]?.xChainId || '']?.intentChainId;
  const intentToChainName: ChainName | undefined = xChainMap[currencies[Field.OUTPUT]?.xChainId || '']?.intentChainId;

  const currentMMTransaction = useMMTransactionStore(state => state.get(intentId));

  //!! SODAX start

  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const sourceToken = currencies[Field.INPUT] as Token;
  const destToken = currencies[Field.OUTPUT] as Token;
  const sourceChain = direction.from as SpokeChainId;
  const destChain = direction.to as SpokeChainId;
  const sourceAmount = formattedAmounts[Field.INPUT];
  const spokeProvider = useSpokeProvider(sourceChain);
  const { mutateAsync: createIntentOrder } = useCreateIntentOrder(spokeProvider);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(intentOrderPayload, spokeProvider);
  const { approve, isLoading: isApproving } = useSwapApprove(sourceToken, spokeProvider);

  //old
  const gasChecker = useXCallGasChecker(direction.from, tryParseAmount(sourceAmount, sourceToken as XToken));

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  const isProcessing = orderStatus === IntentOrderStatus.Executing;
  //end old

  const approvalState = useMemo(() => {
    if (!intentOrderPayload || isAllowanceLoading) return ApprovalState.UNKNOWN;
    if (isApproving) return ApprovalState.PENDING;
    if (hasAllowed) return ApprovalState.APPROVED;
    return ApprovalState.NOT_APPROVED;
  }, [intentOrderPayload, isAllowanceLoading, hasAllowed, isApproving]);

  const shouldApprove = approvalState !== ApprovalState.UNKNOWN && approvalState !== ApprovalState.APPROVED;

  const createIntentOrderPayload = useCallback(() => {
    if (!quote) {
      console.error('Quote undefined');
      return;
    }

    if (!sourceToken || !destToken) {
      console.error('sourceToken or destToken undefined');
      return;
    }

    if (!minOutputAmount) {
      console.error('minOutputAmount undefined');
      return;
    }

    if (!sourceAddress) {
      console.error('sourceAccount.address undefined');
      return;
    }

    if (!recipient) {
      console.error('destAccount.address undefined');
      return;
    }

    if (!spokeProvider) {
      console.error('sourceProvider or destProvider undefined');
      return;
    }

    const createIntentParams = {
      inputToken: sourceToken.address, // The address of the input token on hub chain
      outputToken: destToken.address, // The address of the output token on hub chain
      inputAmount: scaleTokenAmount(sourceAmount, sourceToken.decimals), // The amount of input tokens
      minOutputAmount: BigInt(minOutputAmount.toFixed(0)), // The minimum amount of output tokens to accept
      deadline: BigInt(0), // Optional timestamp after which intent expires (0 = no deadline)
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChain: sourceChain, // Chain ID where input tokens originate
      dstChain: destChain, // Chain ID where output tokens should be delivered
      srcAddress: sourceAddress as `0x${string}`, // Source address in bytes (original address on spoke chain)
      dstAddress: recipient as `0x${string}`, // Destination address in bytes (original address on spoke chain)
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateIntentParams;

    setIntentOrderPayload(createIntentParams);
  }, [
    quote,
    sourceToken,
    destToken,
    sourceAmount,
    minOutputAmount,
    sourceChain,
    destChain,
    sourceAddress,
    recipient,
    spokeProvider,
  ]);

  useEffect(() => {
    if (modalOpen) {
      createIntentOrderPayload();
    } else {
      setIntentOrderPayload(undefined);
    }
  }, [modalOpen, createIntentOrderPayload]);

  const handleIntent = async () => {};
  //!! SODAX end

  //todo: transaction status
  useEffect(() => {
    if (currentMMTransaction) {
      currentMMTransaction.status === MMTransactionStatus.success && setOrderStatus(IntentOrderStatus.Filled);
      currentMMTransaction.status === MMTransactionStatus.failure && setOrderStatus(IntentOrderStatus.Failure);
    }
  }, [currentMMTransaction]);

  const isFilled = orderStatus === IntentOrderStatus.Filled;

  const clearInputs = useCallback((): void => {
    onUserInput(Field.INPUT, '');
    onUserInput(Field.OUTPUT, '');
  }, [onUserInput]);

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setWalletPrompting(false);
    setTimeout(() => {
      setIntentId(null);
      setOrderStatus(IntentOrderStatus.None);
      setError(null);
    }, 500);
  }, [modalId, setWalletPrompting]);

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

  const handleApprove = async () => {
    await approve({ amount: sourceAmount });
  };

  const handleOrder = async () => {
    if (
      !sourceAddress ||
      !recipient ||
      !currencies[Field.INPUT] ||
      !currencies[Field.OUTPUT] ||
      !intentFromChainName ||
      !intentToChainName
    ) {
      return;
    }

    setOrderStatus(IntentOrderStatus.SigningAndCreating);

    try {
      if (!spokeProvider) {
        setOrderStatus(IntentOrderStatus.None);
        console.error('Invalid provider');
        return;
      }

      if (intentOrderPayload) {
        setWalletPrompting(true);
        setOrderStatus(IntentOrderStatus.Executing);
        clearInputs();
        const result = await createIntentOrder(intentOrderPayload);
        console.log('result gogo', result);

        if (result.ok) {
          const [response, intent, packet] = result.value;
          setOrderStatus(IntentOrderStatus.Filled);

          setOrders(prev => [...prev, { intentHash: response.intent_hash, intent, packet }]);
        } else {
          console.error('Error creating and submitting intent:', result.error);
          setOrderStatus(IntentOrderStatus.Failure);
          setError('Error creating intent order');
          return;
        }
      }
    } catch (e) {
      logError(new Error('Caught intent error'), { error: e });
      console.error('OrderCommitButton error', e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      setOrderStatus(IntentOrderStatus.None);
    }
  };

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
            {`${new BigNumber(1).div(exchangeRate).toPrecision(6)} ${formatSymbol(sourceToken.symbol)} 
              per ${formatSymbol(destToken.symbol)}`}
          </Trans>
        </Typography>

        <Flex my={4}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">
              <Trans>Pay</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBigNumber(new BigNumber(sourceAmount), 'currency')} {sourceToken.symbol}
            </Typography>
            <Typography textAlign="center">
              <Trans>{getNetworkDisplayName(direction.from)}</Trans>
            </Typography>
            <Typography textAlign="center">
              <Trans>{recipient && sourceAddress && shortenAddress(sourceAddress, 5)}</Trans>
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">
              <Trans>Receive</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formattedAmounts[Field.OUTPUT]} {destToken.symbol}
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
          {/* <strong>
            {formatBigNumber(new BigNumber(trade?.fee.toFixed() || 0), 'currency')}{' '}
            {formatSymbol(trade?.fee.currency.symbol)}
          </strong> */}
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
                      {shouldApprove ? (
                        <StyledButton onClick={handleApprove} disabled={approvalState === ApprovalState.PENDING}>
                          {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
                        </StyledButton>
                      ) : (
                        <StyledButton onClick={handleOrder} disabled={!gasChecker.hasEnoughGas || isWalletPrompting}>
                          <Trans>{isWalletPrompting ? 'Waiting for wallet...' : 'Swap'}</Trans>
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

export default OrderModal;
