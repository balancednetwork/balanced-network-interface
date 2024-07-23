import React, { useMemo } from 'react';

import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { XChainId, XToken } from 'app/pages/trade/bridge/types';
import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useSwapSlippageTolerance } from 'store/application/hooks';
import { Field } from 'store/swap/reducer';
import { formatBigNumber, shortenAddress } from 'utils';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import ModalContent from 'app/components/ModalContent';
import useXCallFee from 'app/pages/trade/bridge/_hooks/useXCallFee';
import { showMessageOnBeforeUnload } from 'utils/messages';
import { ApprovalState, useApproveCallback } from 'app/pages/trade/bridge/_hooks/useApproveCallback';
import { xChainMap } from '../../bridge/_config/xChains';
import { useModalStore, modalActions, MODAL_ID } from '../../bridge/_zustand/useModalStore';
import { XTransactionType, XTransactionInput } from '../../bridge/_zustand/types';
import useXCallGasChecker from '../../bridge/_hooks/useXCallGasChecker';
import {
  useXTransactionStore,
  xTransactionActions,
  XTransactionUpdater,
} from '../../bridge/_zustand/useXTransactionStore';
import XTransactionState from '../../bridge/_components/XTransactionState';
import { useCreateWalletXService } from '../../bridge/_zustand/useXServiceStore';
import useWallets from '../../bridge/_hooks/useWallets';
import { useSwitchChain } from 'wagmi';
import { StyledButton } from './shared';
import { SLIPPAGE_MODAL_WARNING_THRESHOLD } from 'constants/misc';

type XSwapModalProps = {
  account: string | undefined;
  currencies: { [field in Field]?: Currency };
  executionTrade?: Trade<Currency, Currency, TradeType>;
  clearInputs: () => void;
  direction: {
    from: XChainId;
    to: XChainId;
  };
  recipient?: string | null;
};

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XSwapModal = ({ account, currencies, executionTrade, direction, recipient, clearInputs }: XSwapModalProps) => {
  useModalStore();
  const { currentId } = useXTransactionStore();
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;

  useCreateWalletXService(direction.from);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const slippageTolerance = useSwapSlippageTolerance();
  const showWarning = executionTrade?.priceImpact.greaterThan(SLIPPAGE_MODAL_WARNING_THRESHOLD);

  const { xCallFee, formattedXCallFee } = useXCallFee(direction.from, direction.to);

  const xChain = xChainMap[direction.from];

  // convert executionTrade.inputAmount in currencies[Field.INPUT]
  const _inputAmount = useMemo(() => {
    return executionTrade?.inputAmount && currencies[Field.INPUT]
      ? CurrencyAmount.fromRawAmount(
          XToken.getXToken(direction.from, currencies[Field.INPUT].wrapped),
          new BigNumber(executionTrade.inputAmount.toFixed())
            .times((10n ** BigInt(currencies[Field.INPUT].decimals)).toString())
            .toFixed(0),
        )
      : undefined;
  }, [executionTrade, direction.from, currencies]);
  const { approvalState, approveCallback } = useApproveCallback(_inputAmount, xChain.contracts.assetManager);

  const cleanupSwap = () => {
    clearInputs();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    changeShouldLedgerSign(false);
  };

  const handleDismiss = () => {
    modalActions.closeModal(MODAL_ID.XSWAP_CONFIRM_MODAL);
    setTimeout(() => {
      xTransactionActions.reset();
    }, 500);
  };

  const handleXCallSwap = async () => {
    if (!executionTrade) return;
    if (!account) return;
    if (!recipient) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;

    const xTransactionInput: XTransactionInput = {
      type: XTransactionType.SWAP,
      direction,
      executionTrade,
      account,
      recipient,
      inputAmount: _inputAmount,
      slippageTolerance,
      xCallFee,
      callback: cleanupSwap,
    };

    await xTransactionActions.executeTransfer(xTransactionInput);
  };

  const gasChecker = useXCallGasChecker(direction.from);

  // switch chain between evm chains
  const wallets = useWallets();
  const walletType = xChainMap[direction.from].xWalletType;
  const isWrongChain = wallets[walletType].xChainId !== direction.from;
  const { switchChain } = useSwitchChain();
  const handleSwitchChain = () => {
    switchChain({ chainId: xChainMap[direction.from].id as number });
  };

  return (
    <>
      {currentXTransaction && <XTransactionUpdater xTransaction={currentXTransaction} />}
      <Modal isOpen={modalActions.isModalOpen(MODAL_ID.XSWAP_CONFIRM_MODAL)} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            <Trans>
              Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
            </Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" color={showWarning ? 'alert' : 'text'}>
            <Trans>
              {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
                executionTrade?.executionPrice.quoteCurrency.symbol
              } 
              per ${executionTrade?.executionPrice.baseCurrency.symbol}`}
            </Trans>
          </Typography>

          <Flex my={4}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Pay</Trans>
              </Typography>
              <Typography variant="p" textAlign="center" py="5px">
                {formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency')}{' '}
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
                {formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency')}{' '}
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

          <Typography
            textAlign="center"
            hidden={currencies[Field.INPUT]?.symbol === 'ICX' && currencies[Field.OUTPUT]?.symbol === 'sICX'}
          >
            <Trans>Includes a fee of</Trans>{' '}
            <strong>
              {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.INPUT]?.symbol}
            </strong>
            .
          </Typography>

          <Typography textAlign="center">
            <Trans>You'll also pay</Trans> <strong>{formattedXCallFee}</strong> <Trans>to transfer cross-chain.</Trans>
          </Typography>

          {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
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
                      <Trans>Swapping...</Trans>
                    </StyledButton>
                  </>
                ) : (
                  <>
                    {approvalState !== ApprovalState.APPROVED ? (
                      <Button onClick={approveCallback} disabled={approvalState === ApprovalState.PENDING}>
                        {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve transfer'}
                      </Button>
                    ) : (
                      <StyledButton onClick={handleXCallSwap} disabled={!gasChecker.hasEnoughGas}>
                        <Trans>Swap</Trans>
                      </StyledButton>
                    )}
                  </>
                )}
              </>
            )}
          </Flex>

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

export default XSwapModal;
