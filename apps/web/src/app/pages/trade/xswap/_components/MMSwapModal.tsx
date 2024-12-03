import React, { memo, useCallback, useEffect, useState } from 'react';

import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { MMTrade } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import {
  MMTransactionActions,
  MMTransactionStatus,
  useMMTransactionStore,
} from '@/store/transactions/useXTransactionStore';
import { formatBigNumber, shortenAddress } from '@/utils';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXService } from '@/xwagmi/hooks';
import { XToken } from '@/xwagmi/types';
import { EvmXService } from '@/xwagmi/xchains/evm';
import { CreateIntentOrderPayload, EvmProvider, IntentService, SuiProvider } from '@balancednetwork/intents-sdk';
import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<IntentOrderStatus>(IntentOrderStatus.None);

  const currentMMTransaction = useMMTransactionStore(state => state.get(currentId));

  useEffect(() => {
    if (currentMMTransaction) {
      currentMMTransaction.status === MMTransactionStatus.success && setOrderStatus(IntentOrderStatus.Filled);
      currentMMTransaction.status === MMTransactionStatus.failure && setOrderStatus(IntentOrderStatus.Failure);
    }
  }, [currentMMTransaction]);

  // const isProcessing: boolean = currentId !== null;
  const isFilled = orderStatus === IntentOrderStatus.Filled;

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
      setCurrentId(null);
      setOrderStatus(IntentOrderStatus.None);
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
  const xService = useXService('EVM') as EvmXService;
  // end arb part

  // sui part
  const suiClient = useSuiClient();
  const { currentWallet: suiWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  // end sui part

  const handleMMSwap = async () => {
    if (!account || !recipient || !currencies[Field.INPUT] || !currencies[Field.OUTPUT] || !trade) {
      return;
    }
    setOrderStatus(IntentOrderStatus.SigningAndCreating);
    const walletClient = await xService.getWalletClient(xChainMap[currencies[Field.INPUT]?.chainId]);
    const publicClient = xService.getPublicClient(xChainMap[currencies[Field.INPUT]?.chainId]);

    const order: CreateIntentOrderPayload = {
      quote_uuid: trade.uuid,
      fromAddress: account, // address we are sending funds from (fromChain)
      toAddress: recipient, // destination address where funds are transfered to (toChain)
      // fromChain: currencies[Field.INPUT]?.xChainId, // ChainName
      // toChain: currencies[Field.OUTPUT]?.xChainId, // ChainName
      fromChain: currencies[Field.INPUT].xChainId === '0xa4b1.arbitrum' ? 'arb' : 'sui',
      toChain: currencies[Field.OUTPUT].xChainId === 'sui' ? 'sui' : 'arb',
      token: currencies[Field.INPUT]?.address,
      toToken: currencies[Field.OUTPUT]?.address,
      amount: trade.inputAmount.quotient,
      toAmount: trade.outputAmount.quotient,
    };
    try {
      const executionResult = await IntentService.executeIntentOrder(
        order,
        currencies[Field.INPUT].xChainId === '0xa4b1.arbitrum'
          ? // @ts-ignore
            new EvmProvider({ walletClient: walletClient, publicClient: publicClient })
          : // @ts-ignore
            new SuiProvider({ client: suiClient, wallet: suiWallet, account: suiAccount }),
      );

      if (executionResult.ok) {
        // an intent order was successfully created on the source chain.
        setOrderStatus(IntentOrderStatus.Executing);

        setCurrentId(executionResult.value.task_id);
        MMTransactionActions.add({
          id: executionResult.value.task_id,
          status: MMTransactionStatus.pending,
        });
      } else {
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

  const isProcessing =
    orderStatus === IntentOrderStatus.SigningAndCreating || orderStatus === IntentOrderStatus.Executing;

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

          <Typography textAlign="center">
            <Trans>Swap fee:</Trans>{' '}
            <strong>
              {formatBigNumber(new BigNumber(trade?.fee.toFixed() || 0), 'currency')} {trade?.fee.currency.symbol}
            </strong>
          </Typography>

          <Typography textAlign="center">(deducted from receive amount)</Typography>

          <AnimatePresence>
            {((!isFilled && isProcessing) || !isProcessing) && (
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
                    <StyledButton disabled $loading>
                      <Trans>Swapping</Trans>
                    </StyledButton>
                  ) : (
                    <StyledButton onClick={handleMMSwap} disabled={!gasChecker.hasEnoughGas}>
                      <Trans>Swap</Trans>
                    </StyledButton>
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

export default memo(MMSwapModal);
