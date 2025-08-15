import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { ApprovalState } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
// removed wallet prompting UX
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { scaleTokenAmount } from '@/lib/sodax/utils';
import { logError } from '@/sentry';
import { useOrderStore } from '@/store/order/useOrderStore';
import { tryParseAmount, useDerivedTradeInfo, useSwapActionHandlers } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber, shortenAddress } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { XToken, xChainMap } from '@balancednetwork/xwagmi';
import { useSwap, useSwapAllowance, useSwapApprove } from '@sodax/dapp-kit';
import { CreateIntentParams, SpokeChainId, Token, encodeAddress } from '@sodax/sdk';
import { AnimatePresence, motion } from 'framer-motion';

type OrderModalProps = {
  modalId?: MODAL_ID;
  recipient?: string | null;
};

type DerivedTradeInfo = ReturnType<typeof useDerivedTradeInfo>;

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

const OrderModal = ({ modalId = MODAL_ID.ORDER_CONFIRM_MODAL, recipient }: OrderModalProps) => {
  const modalOpen = useModalOpen(modalId);
  const derivedTradeInfo = useDerivedTradeInfo();
  const derivedTradeInfoRef = useRef<DerivedTradeInfo>(derivedTradeInfo);
  const [cachedTradeInfo, setCachedTradeInfo] = useState<DerivedTradeInfo | null>(null);

  // Keep latest derivedTradeInfo in a ref without triggering this component's effects
  useEffect(() => {
    derivedTradeInfoRef.current = derivedTradeInfo;
  }, [derivedTradeInfo]);

  // Only snapshot on modal open/close transitions
  useEffect(() => {
    if (modalOpen) {
      setCachedTradeInfo(derivedTradeInfoRef.current);
    } else {
      setCachedTradeInfo(null);
    }
  }, [modalOpen]);

  const { quote, formattedAmounts, minOutputAmount, sourceAddress, direction, currencies, exchangeRate, formattedFee } =
    cachedTradeInfo || derivedTradeInfo;
  const { track } = useAnalytics();
  const [orderStatus, setOrderStatus] = useState<IntentOrderStatus>(IntentOrderStatus.None);
  const [error, setError] = useState<string | null>(null);
  const { onUserInput } = useSwapActionHandlers();
  const addOrder = useOrderStore(state => state.addOrder);

  //!! SODAX start

  const sourceToken = currencies[Field.INPUT] as Token;
  const destToken = currencies[Field.OUTPUT] as Token;
  const sourceChain = direction.from as SpokeChainId;
  const destChain = direction.to as SpokeChainId;
  const sourceAmount = formattedAmounts[Field.INPUT];
  const spokeProvider = useSpokeProvider(sourceChain);

  // Build payload once inputs are valid and modal is open
  const intentOrderPayload: CreateIntentParams | undefined = useMemo(() => {
    if (!modalOpen) return undefined;

    if (!quote) {
      console.error('Quote undefined');
      return undefined;
    }

    if (!sourceToken || !destToken) {
      console.error('sourceToken or destToken undefined');
      return undefined;
    }

    if (!minOutputAmount) {
      console.error('minOutputAmount undefined');
      return undefined;
    }

    if (!sourceAddress) {
      console.error('sourceAccount.address undefined');
      return undefined;
    }

    if (!recipient) {
      console.error('destAccount.address undefined');
      return undefined;
    }

    if (!spokeProvider) {
      console.error('sourceProvider or destProvider undefined');
      return undefined;
    }

    return {
      inputToken: sourceToken.address,
      outputToken: destToken.address,
      inputAmount: scaleTokenAmount(sourceAmount, sourceToken.decimals),
      minOutputAmount: BigInt(minOutputAmount.toFixed(0)),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: sourceChain,
      dstChain: destChain,
      srcAddress: sourceAddress as `0x${string}`,
      dstAddress: recipient as `0x${string}`,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;
  }, [
    modalOpen,
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

  const { mutateAsync: swap } = useSwap(spokeProvider);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(intentOrderPayload, spokeProvider);

  const { approve, isLoading: isApproving } = useSwapApprove(intentOrderPayload, spokeProvider);

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

  // intentOrderPayload is defined above

  const hasHandledSuccessRef = useRef(false);
  const currentOrderTxRef = useRef<string | null>(null);

  const clearInputs = useCallback((): void => {
    onUserInput(Field.INPUT, '');
    onUserInput(Field.OUTPUT, '');
  }, [onUserInput]);

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
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

  // Removed effect that reacted to "isCreated" to avoid repeated state updates when dependencies change identities

  useEffect(() => {
    if (modalOpen) {
      hasHandledSuccessRef.current = false;
      currentOrderTxRef.current = null;
    }
  }, [modalOpen]);

  // No external transaction watcher; success is handled in handleOrder

  const handleApprove = async () => {
    if (!intentOrderPayload) {
      return;
    }
    await approve({ params: intentOrderPayload });
  };

  const handleOrder = async () => {
    if (!sourceAddress || !recipient || !currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
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
        setOrderStatus(IntentOrderStatus.Executing);
        const result = await swap(intentOrderPayload);

        if (result.ok) {
          const [response, intent, packet] = result.value;
          setOrderStatus(IntentOrderStatus.Filled);
          addOrder({
            intentHash: response.intent_hash,
            intent,
            packet,
          });
          hasHandledSuccessRef.current = true;
          currentOrderTxRef.current = response.intent_hash;
          clearInputs();
          slowDismiss();
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

        {formattedFee && (
          <Typography textAlign="center">
            <Trans>Swap fee (included):</Trans> {formattedFee}
          </Typography>
        )}

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
                      <Trans>Creating order...</Trans>
                    </StyledButton>
                  ) : (
                    <>
                      {shouldApprove ? (
                        <StyledButton onClick={handleApprove} disabled={approvalState === ApprovalState.PENDING}>
                          {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
                        </StyledButton>
                      ) : (
                        <StyledButton onClick={handleOrder} disabled={!gasChecker.hasEnoughGas}>
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
                    <Trans>Order created</Trans>
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
