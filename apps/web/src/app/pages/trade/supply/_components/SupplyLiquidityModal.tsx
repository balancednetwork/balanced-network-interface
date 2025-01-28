import React, { useEffect } from 'react';

import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import { UnderlineText } from '@/app/components/DropdownText';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useDerivedMintInfo } from '@/store/mint/hooks';
import { Field } from '@/store/mint/reducer';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import {
  ICON_XCALL_NETWORK_ID,
  XToken,
  XTransactionStatus,
  getNetworkDisplayName,
  useXAddLiquidity,
  useXCallFee,
  useXTokenDepositAmount,
  useXTransactionStore,
} from '@balancednetwork/xwagmi';
import { useQueryClient } from '@tanstack/react-query';
import { SendRemoveXToken } from './SendRemoveXToken';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  currencies: { [field in Field]?: XToken };
}

export default function SupplyLiquidityModal({ isOpen, onClose, parsedAmounts, currencies }: ModalProps) {
  const queryClient = useQueryClient();
  const { account, pair, lpXChainId } = useDerivedMintInfo();

  const [isPending, setIsPending] = React.useState(false);
  const [pendingTx, setPendingTx] = React.useState('');
  const currentXTransaction = useXTransactionStore(state => state.transactions[pendingTx]);

  useEffect(() => {
    if (currentXTransaction?.status === XTransactionStatus.success) {
      onClose();
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    }

    if (
      currentXTransaction?.status === XTransactionStatus.success ||
      currentXTransaction?.status === XTransactionStatus.failure
    ) {
      setIsPending(false);
    }
  }, [currentXTransaction, onClose, queryClient]);

  const { data: depositAmountA } = useXTokenDepositAmount(account, currencies[Field.CURRENCY_A]?.wrapped);
  const { data: depositAmountB } = useXTokenDepositAmount(account, currencies[Field.CURRENCY_B]?.wrapped);

  const xAddLiquidity = useXAddLiquidity();

  const handleSupplyConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    try {
      if (depositAmountA && depositAmountB) {
        setIsPending(true);

        const txHash = await xAddLiquidity(account, depositAmountA, depositAmountB);
        if (txHash) setPendingTx(txHash);
        else setIsPending(false);
      }
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  // refresh Modal UI
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (!isOpen) {
      setIsPending(false);
      setPendingTx('');
      setHasErrorMessage(false);
    }
  }, [isOpen, pair]);

  const isEnabled = !!depositAmountA?.greaterThan(0) && !!depositAmountB?.greaterThan(0);

  const [hasErrorMessage, setHasErrorMessage] = React.useState(false);
  const handleCancelSupply = () => {
    if (!depositAmountA?.greaterThan(0) && !depositAmountB?.greaterThan(0)) {
      onClose();
    } else {
      setHasErrorMessage(true);
    }
  };

  const { formattedXCallFee } = useXCallFee(lpXChainId, ICON_XCALL_NETWORK_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(lpXChainId);
  const gasChecker = useXCallGasChecker(lpXChainId, undefined);
  return (
    <>
      <Modal isOpen={isOpen} onDismiss={() => undefined}>
        <ModalContent noMessages>
          <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
            {pair ? t`Supply liquidity?` : t`Create liquidity pool?`}
          </Typography>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'translateX(-50%)',
              }}
            />
            <Flex alignItems="center" mb={1} hidden={false}>
              <Box width={1 / 2}>
                <StyledDL>
                  <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                    <Trans>Assets to send</Trans>
                  </Typography>
                </StyledDL>
              </Box>
              <Box width={1 / 2}>
                <StyledDL>
                  <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                    <Trans>Assets on Balanced</Trans>
                  </Typography>
                </StyledDL>
              </Box>
            </Flex>

            <SendRemoveXToken
              field={Field.CURRENCY_A}
              currencies={currencies}
              parsedAmounts={parsedAmounts}
              onResetError={() => setHasErrorMessage(false)}
            />
            <SendRemoveXToken
              field={Field.CURRENCY_B}
              currencies={currencies}
              parsedAmounts={parsedAmounts}
              onResetError={() => setHasErrorMessage(false)}
            />
          </div>
          <Typography textAlign="center" as="h3" fontWeight="normal">
            <Trans>Send your liquidity to Balanced, then click Supply.</Trans>
          </Typography>
          {lpXChainId !== ICON_XCALL_NETWORK_ID && (
            <Flex justifyContent="center" alignItems="center" mt={2} style={{ gap: 4 }}>
              <Typography textAlign="center" as="h3" fontWeight="normal">
                <Trans>Transfer fee (x3): </Trans>
              </Typography>
              <Typography fontWeight="bold">{formattedXCallFee}</Typography>
            </Flex>
          )}
          {hasErrorMessage && (
            <Typography textAlign="center" color="alert">
              <Trans>Remove your assets to cancel this transaction.</Trans>
            </Typography>
          )}
          {isWrongChain && (
            <Flex
              justifyContent="center"
              alignItems="center"
              mt={2}
              pt={2}
              pb={3}
              style={{ gap: 4, backgroundColor: '#0b385c', borderRadius: '10px' }}
            >
              <UnderlineText>
                <Typography color="primaryBright" onClick={handleSwitchChain}>
                  Switch to {getNetworkDisplayName(lpXChainId)}
                </Typography>
              </UnderlineText>
              <Typography textAlign="center" mt={'1px'}>
                <Trans> to make this transaction.</Trans>
              </Typography>
            </Flex>
          )}
          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleCancelSupply}>
              <Trans>Cancel</Trans>
            </TextButton>

            {pair ? (
              <StyledButton
                disabled={!isEnabled || !gasChecker.hasEnoughGas || isPending || isWrongChain}
                onClick={handleSupplyConfirm}
                $loading={isPending}
              >
                {isPending ? t`Supplying` : t`Supply`}
              </StyledButton>
            ) : (
              <StyledButton
                disabled={!isEnabled || !gasChecker.hasEnoughGas || isPending || isWrongChain}
                onClick={handleSupplyConfirm}
                $loading={isPending}
              >
                {isPending ? t`Creating pool` : t`Create pool`}
              </StyledButton>
            )}
          </Flex>

          {!isPending && !gasChecker.hasEnoughGas && (
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
}

const StyledDL = styled.dl`
  margin: 15px 0 15px 0;
  text-align: center;
`;
