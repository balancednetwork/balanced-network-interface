import React, { useCallback, useEffect } from 'react';

import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { Pool } from '@/hooks/useV2Pairs';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { Field } from '@/store/mint/reducer';
import { formatBigNumber, multiplyCABN } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getNetworkDisplayName, getXChainType, useXAccount, useXRemoveLiquidity } from '@balancednetwork/xwagmi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  withdrawPortion: number;
  pool: Pool;
  successCallback?: () => void;
}

export default function WithdrawLiquidityModal({
  isOpen,
  onClose,
  pool,
  parsedAmounts,
  withdrawPortion,
  successCallback,
}: ModalProps) {
  const xAccount = useXAccount(getXChainType(pool.xChainId));
  const xRemoveLiquidity = useXRemoveLiquidity();

  const handleWithdraw = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const numPortion = new BigNumber(withdrawPortion / 100);
    const withdrawAmount = multiplyCABN(pool.balance, numPortion);
    await xRemoveLiquidity(xAccount.address, pool.poolId, pool.xChainId, withdrawAmount);
    onClose();
    successCallback && successCallback();

    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(pool.xChainId);
  const gasChecker = useXCallGasChecker(pool.xChainId, undefined);

  return (
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
          <Trans>Withdraw liquidity?</Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center">
          {formatBigNumber(new BigNumber(parsedAmounts[Field.CURRENCY_A]?.toFixed() || 0), 'currency')}{' '}
          {formatSymbol(parsedAmounts[Field.CURRENCY_A]?.currency.symbol) || '...'}
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center">
          {formatBigNumber(new BigNumber(parsedAmounts[Field.CURRENCY_B]?.toFixed() || 0), 'currency')}{' '}
          {formatSymbol(parsedAmounts[Field.CURRENCY_B]?.currency.symbol) || '...'}
        </Typography>

        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          <TextButton onClick={onClose}>
            <Trans>Cancel</Trans>
          </TextButton>

          {isWrongChain ? (
            <Button onClick={handleSwitchChain} fontSize={14}>
              <Trans>Switch to</Trans>
              {` ${getNetworkDisplayName(pool.xChainId)}`}
            </Button>
          ) : (
            <Button onClick={handleWithdraw} disabled={!gasChecker.hasEnoughGas}>
              <Trans>Withdraw</Trans>
            </Button>
          )}
        </Flex>

        {!gasChecker.hasEnoughGas && (
          <Flex justifyContent="center" paddingY={2}>
            <Typography maxWidth="320px" color="alert" textAlign="center">
              {gasChecker.errorMessage}
            </Typography>
          </Flex>
        )}
      </ModalContent>
    </Modal>
  );
}
