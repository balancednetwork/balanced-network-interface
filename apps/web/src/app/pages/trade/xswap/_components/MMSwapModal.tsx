import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import XTransactionState from '@/app/components/XTransactionState';
import { Typography } from '@/app/theme';
import { SLIPPAGE_MODAL_WARNING_THRESHOLD } from '@/constants/misc';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { MMTrade } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber, shortenAddress } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXService } from '@/xwagmi/hooks';
import { XChainId, XToken } from '@/xwagmi/types';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@/xwagmi/xcall/types';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import { EvmXService } from '@/xwagmi/xchains/evm';
import { CreateIntentOrderPayload, EvmProvider, IntentService } from '@balancednetwork/intents-sdk';
import { AnimatePresence, motion } from 'framer-motion';

type MMSwapModalProps = {
  modalId?: MODAL_ID;
  account: string | undefined;
  currencies: { [field in Field]?: XToken | undefined };
  trade?: MMTrade;
  recipient?: string | null;
};

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const MMSwapModal = ({
  modalId = MODAL_ID.MM_SWAP_CONFIRM_MODAL,
  account,
  currencies,
  trade,
  recipient,
}: MMSwapModalProps) => {
  const modalOpen = useModalOpen(modalId);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;
  const isExecuted =
    currentXTransaction?.status === XTransactionStatus.success ||
    currentXTransaction?.status === XTransactionStatus.failure;

  // const { approvalState, approveCallback } = useApproveCallback(_inputAmount, xChain.contracts.assetManager);

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
      setCurrentId(null);
    }, 500);
  }, [modalId]);

  //to show success or fail message in the modal
  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss]);

  useEffect(() => {
    if (
      currentXTransaction &&
      (currentXTransaction.status === XTransactionStatus.success ||
        currentXTransaction.status === XTransactionStatus.failure)
    ) {
      slowDismiss();
    }
  }, [currentXTransaction, slowDismiss]);

  const xService = useXService('EVM') as EvmXService;

  const { sendXTransaction } = useSendXTransaction();
  const handleXCallSwap = async () => {
    if (!account || !recipient || !currencies[Field.INPUT] || !currencies[Field.OUTPUT] || !trade) {
      return;
    }
    const walletClient = await xService.getWalletClient(xChainMap[currencies[Field.INPUT]?.chainId]);
    const publicClient = await xService.getPublicClient(xChainMap[currencies[Field.INPUT]?.chainId]);

    console.log('SwapMMCommitButton123', account, recipient, currencies, trade);
    const order: CreateIntentOrderPayload = {
      quote_uuid: trade.uuid,
      fromAddress: account, // address we are sending funds from (fromChain)
      toAddress: recipient, // destination address where funds are transfered to (toChain)
      // fromChain: currencies[Field.INPUT]?.xChainId, // ChainName
      // toChain: currencies[Field.OUTPUT]?.xChainId, // ChainName
      fromChain: 'arb',
      toChain: 'sui',
      token: currencies[Field.INPUT]?.address,
      toToken: '0x2::sui::SUI',
      amount: trade.inputAmount.quotient,
      toAmount: trade.outputAmount.quotient,
    };
    try {
      const executionResult = await IntentService.executeIntentOrder(
        order,
        // @ts-ignore
        new EvmProvider({ walletClient: walletClient, publicClient: publicClient }),
      );
      console.log('SwapMMCommitButton', executionResult);
    } catch (e) {
      console.error('SwapMMCommitButton error', e);
    }
  };

  const from = trade?.inputAmount.currency.xChainId || '0x1.icon';

  const direction = {
    from: currencies[Field.INPUT]?.xChainId || '0x1.icon',
    to: currencies[Field.OUTPUT]?.xChainId || '0x1.icon',
  };
  const gasChecker = useXCallGasChecker(direction.from, trade?.inputAmount);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  return (
    <>
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            <Trans>
              Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
            </Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" color="text">
            <Trans>
              {`${formatBigNumber(new BigNumber(trade?.executionPrice.toFixed() || 0), 'ratio')} ${
                trade?.executionPrice.quoteCurrency.symbol
              } 
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

          {/* <Typography
            textAlign="center"
            hidden={currencies[Field.INPUT]?.symbol === 'ICX' && currencies[Field.OUTPUT]?.symbol === 'sICX'}
          >
            <Trans>Swap fee (included):</Trans>{' '}
            <strong>
              {formatBigNumber(new BigNumber(trade?.fee.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.INPUT]?.symbol}
            </strong>
          </Typography> */}

          {/* <Typography textAlign="center">
            <Trans>Transfer fee:</Trans> <strong>{formattedXCallFee}</strong>
          </Typography> */}

          {/* {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />} */}

          <AnimatePresence>
            {((!isExecuted && isProcessing) || !isProcessing) && (
              <motion.div
                key={'tx-actions'}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <Flex justifyContent="center" mt={4} pt={4} className="border-top">
                  <TextButton onClick={handleDismiss}>
                    <Trans>{isProcessing ? 'Close' : 'Cancel'}</Trans>
                  </TextButton>

                  {isWrongChain ? (
                    <StyledButton onClick={handleSwitchChain}>
                      <Trans>Switch to {xChainMap[direction.from].name}</Trans>
                    </StyledButton>
                  ) : isProcessing ? (
                    <>
                      <StyledButton disabled $loading>
                        <Trans>Swapping</Trans>
                      </StyledButton>
                    </>
                  ) : (
                    <>
                      <StyledButton onClick={handleXCallSwap} disabled={!gasChecker.hasEnoughGas}>
                        <Trans>Swap</Trans>
                      </StyledButton>

                      {/* {approvalState !== ApprovalState.APPROVED ? (
                        <Button onClick={approveCallback} disabled={approvalState === ApprovalState.PENDING}>
                          {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve transfer'}
                        </Button>
                      ) : (
                        <StyledButton onClick={handleXCallSwap} disabled={!gasChecker.hasEnoughGas}>
                          <Trans>Swap</Trans>
                        </StyledButton>
                      )} */}
                    </>
                  )}
                </Flex>
              </motion.div>
            )}
          </AnimatePresence>

          {!isProcessing && !gasChecker.hasEnoughGas && (
            <Flex justifyContent="center" paddingY={2}>
              <Typography maxWidth="320px" color="alert" textAlign="center">
                {gasChecker.errorMessage}
              </Typography>
            </Flex>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default MMSwapModal;
