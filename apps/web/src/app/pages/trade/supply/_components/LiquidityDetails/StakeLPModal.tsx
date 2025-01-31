import React from 'react';

import {
  getNetworkDisplayName,
  getXChainType,
  useXAccount,
  useXStakeLPToken,
  useXUnstakeLPToken,
} from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { ZERO } from '@/constants/index';
import { Pool } from '@/hooks/useV2Pairs';
import { showMessageOnBeforeUnload } from '@/utils/messages';

import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';

export default function StakeLPModal({
  open,
  toggleOpen,
  pool,
  beforeAmount,
  afterAmount,
  handleCancel,
}: {
  open: boolean;
  toggleOpen: () => void;
  pool: Pool;
  beforeAmount: BigNumber;
  afterAmount: BigNumber;
  handleCancel: () => void;
}) {
  const { pair } = pool;
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(pool.xChainId);
  const gasChecker = useXCallGasChecker(pool.xChainId, undefined);
  const xStakeLPToken = useXStakeLPToken();
  const xUnstakeLPToken = useXUnstakeLPToken();
  const xAccount = useXAccount(getXChainType(pool.xChainId));

  const differenceAmount = afterAmount.minus(beforeAmount?.toFixed() || ZERO);
  const shouldStake = differenceAmount.isPositive();

  const handleConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    try {
      const decimals = Math.ceil((pair.token0.decimals + pair.token1.decimals) / 2);
      if (shouldStake) {
        await xStakeLPToken(xAccount.address, pool.poolId, pool.xChainId, differenceAmount.toFixed(), decimals);
      } else {
        await xUnstakeLPToken(xAccount.address, pool.poolId, pool.xChainId, differenceAmount.abs().toFixed(), decimals);
      }

      toggleOpen();
      handleCancel();
    } catch (e) {
      console.error(e);
    }

    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  return (
    <Modal isOpen={open} onDismiss={toggleOpen}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb="5px">
          {shouldStake ? 'Stake LP tokens?' : 'Unstake LP tokens?'}
        </Typography>
        <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
          {differenceAmount.abs().dp(2).toFormat()}
        </Typography>
        <Flex my={5}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">Before</Typography>
            <Typography variant="p" textAlign="center">
              {beforeAmount.dp(2).toFormat()}
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">After</Typography>
            <Typography variant="p" textAlign="center">
              {afterAmount.dp(2).toFormat()}
            </Typography>
          </Box>
        </Flex>
        <Typography textAlign="center">
          {shouldStake ? "You'll earn BALN until you unstake them." : "You'll stop earning BALN from them."}
        </Typography>
        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          <TextButton onClick={toggleOpen} fontSize={14}>
            Cancel
          </TextButton>
          {isWrongChain ? (
            <Button onClick={handleSwitchChain} fontSize={14}>
              <Trans>Switch to</Trans>
              {` ${getNetworkDisplayName(pool.xChainId)}`}
            </Button>
          ) : (
            <Button onClick={handleConfirm} fontSize={14} disabled={!gasChecker.hasEnoughGas}>
              {shouldStake ? 'Stake' : 'Unstake'}
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
