import React from 'react';

import { Currency, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { useARCH } from 'app/pages/trade/bridge-v2/_config/tokens';
import { XChainId } from 'app/pages/trade/bridge-v2/types';
import { getNetworkDisplayName } from 'app/pages/trade/bridge-v2/utils';
import { Typography } from 'app/theme';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useSwapSlippageTolerance } from 'store/application/hooks';
import { Field } from 'store/swap/reducer';
import { useSignedInWallets } from 'store/wallet/hooks';
import { formatBigNumber, shortenAddress } from 'utils';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import ModalContent from 'app/components/ModalContent';
import useXCallFee from 'app/pages/trade/bridge-v2/_hooks/useXCallFee';
import useXCallGasChecker from 'app/pages/trade/bridge-v2/_hooks/useXCallGasChecker';
import { useXCallSwapModalStore, xCallSwapModalActions } from '../_zustand/useXCallSwapModalStore';
import { XCallSwapStatusUpdater, useXCallSwapStore, xCallSwapActions } from '../_zustand/useXCallSwapStore';
import { showMessageOnBeforeUnload } from 'utils/messages';
import { ApprovalState, useApproveCallback } from 'app/pages/trade/bridge-v2/_hooks/useApproveCallback';
import XCallSwapState from './XCallSwapState';

type XCallSwapModalProps = {
  isOpen: boolean;
  currencies: { [field in Field]?: Currency };
  executionTrade?: Trade<Currency, Currency, TradeType>;
  clearInputs: () => void;
  originChain: XChainId;
  destinationChain: XChainId;
  destinationAddress?: string;
  onClose: () => void;
};

export const StyledButton = styled(Button)`
  position: relative;

  &:after,
  &:before {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    left: 0;
    border-radius: 5px;
    background: ${({ theme }) => theme.colors.primaryBright};
  }

  &:after {
    bottom: 0;
  }

  &:before {
    top: 0;
  }

  @keyframes expand {
    0% {
      width: 0;
      left: 50%;
      opacity: 0;
    }
    50% {
      width: 28%;
      left: 36%;
      opacity: 1;
    }
    100% {
      width: 100%;
      left: 0%;
      opacity: 0;
    }
  }

  &:disabled {
    &:after {
      animation: expand 2s infinite;
    }
  }
`;

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XCallSwapModal = ({
  isOpen,
  currencies,
  executionTrade,
  originChain,
  destinationChain,
  destinationAddress,
  clearInputs,
  onClose,
}: XCallSwapModalProps) => {
  const { modalOpen } = useXCallSwapModalStore();
  const { isProcessing } = useXCallSwapStore();

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const slippageTolerance = useSwapSlippageTolerance();

  const signedInWallets = useSignedInWallets();
  const { xCallFee: archwayXCallFees } = useXCallFee('archway-1', '0x1.icon');
  const { data: gasChecker } = useXCallGasChecker(originChain, destinationChain);
  const ARCH = useARCH();
  const originAddress = signedInWallets.find(wallet => wallet.chainId === originChain)?.address;

  const approvalState = ApprovalState.APPROVED;
  // const { approvalState, approveCallback } = useApproveCallback(
  //   executionTrade?.inputAmount,
  //   xChain.contracts.assetManager,
  // );

  const cleanupSwap = () => {
    clearInputs();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    changeShouldLedgerSign(false);
  };

  const receivingNetworkAddress: string | undefined = React.useMemo(() => {
    if (destinationAddress) {
      return `${destinationChain}/${destinationAddress}`;
    }
  }, [destinationChain, destinationAddress]);

  const handleDismiss = () => {
    xCallSwapModalActions.closeModal();
    setTimeout(() => {
      xCallSwapActions.reset();
    }, 500);
  };

  const handleXCallSwap = async () => {
    if (!executionTrade) {
      return;
    }

    const account = signedInWallets.find(w => w.chainId === originChain)?.address;

    const swapInfo = {
      sourceChainId: originChain,
      destinationChainId: destinationChain,
      executionTrade,
      cleanupSwap,
      receivingNetworkAddress,
      account,
      slippageTolerance,
      archwayXCallFees,
    };
    await xCallSwapActions.executeSwap(swapInfo);

    console.log('handleXCallSwap');
  };

  return (
    <>
      <XCallSwapStatusUpdater />
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing}>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            <Trans>
              Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
            </Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
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
                <Trans>{getNetworkDisplayName(originChain)}</Trans>
              </Typography>
              <Typography textAlign="center">
                <Trans>{destinationAddress && originAddress && shortenAddress(originAddress, 5)}</Trans>
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
                <Trans>{getNetworkDisplayName(destinationChain)}</Trans>
              </Typography>
              <Typography textAlign="center">
                <Trans>{destinationAddress && shortenAddress(destinationAddress, 5)}</Trans>
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

          {originChain === 'archway-1' && archwayXCallFees && (
            <Typography textAlign="center">
              <Trans>You'll also pay</Trans>{' '}
              <strong>{(Number(archwayXCallFees.rollback) / 10 ** ARCH.decimals).toPrecision(3)} ARCH</strong>{' '}
              <Trans>to transfer cross-chain.</Trans>
            </Typography>
          )}

          {isProcessing && <XCallSwapState />}

          {gasChecker && !gasChecker.hasEnoughGas && (
            <Typography mt={4} mb={-1} textAlign="center" color="alert">
              {gasChecker.errorMessage || t`Not enough gas to complete the swap.`}
            </Typography>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleDismiss}>
                  <Trans>Cancel</Trans>
                </TextButton>
                {/* {approvalState !== ApprovalState.APPROVED && !isTransferring && (
                <>
                  <Button onClick={handleApprove} disabled={approvalState === ApprovalState.PENDING}>
                    {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve'}
                  </Button>
                </>
              )} */}
                {approvalState === ApprovalState.APPROVED && (
                  <>
                    <StyledButton onClick={handleXCallSwap} disabled={isProcessing}>
                      {!isProcessing ? <Trans>Swap</Trans> : <Trans>xCall in progress</Trans>}
                    </StyledButton>
                  </>
                )}
                {/* {allowanceIncreaseNeeded && !isProcessing ? (
                <Button disabled={true}>Swap</Button>
              ) : gasChecker && !gasChecker.hasEnoughGas ? (
                <Button disabled={true}>Swap</Button>
              ) : (
                <StyledButton onClick={handleXCallSwap} disabled={isProcessing}>
                  {!isProcessing ? <Trans>Swap</Trans> : <Trans>xCall in progress</Trans>}
                </StyledButton>
              )} */}
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default XCallSwapModal;
