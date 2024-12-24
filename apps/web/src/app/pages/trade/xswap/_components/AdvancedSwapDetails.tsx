import React from 'react';

import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';

import Divider from '@/app/components/Divider';
import QuestionHelper from '@/app/components/QuestionHelper';
import SlippageSetting from '@/app/components/SlippageSetting';
import { Typography } from '@/app/theme';
import { useSetSlippageTolerance, useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatSymbol } from '@/utils/formatter';
import { useXCallFee } from '@balancednetwork/xwagmi';
import TradePrice from './TradePrice';
import TradeRoute from './TradeRoute';

export default function AdvancedSwapDetails() {
  const { trade, currencies, direction } = useDerivedSwapInfo();

  const [showInverted, setShowInverted] = React.useState<boolean>(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const setSlippageTolerance = useSetSlippageTolerance();

  const isXSwap = !(direction.from === '0x1.icon' && direction.to === '0x1.icon');

  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);

  return (
    <Box padding={5} bg="bg4" width={328}>
      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Exchange rate</Trans>
        </Typography>

        {trade && (
          <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
        )}
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Route</Trans>
        </Typography>

        <Typography textAlign="right" maxWidth="200px">
          {trade ? <TradeRoute route={trade.route} /> : '-'}
        </Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Swap fee</Trans>
        </Typography>

        <Typography textAlign="right">
          {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
        </Typography>
      </Flex>

      <Flex alignItems="baseline" justifyContent="space-between">
        <Typography as="span">
          <Trans>Slippage tolerance</Trans>
          <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} />
        </Typography>
        <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
      </Flex>

      {isXSwap && (
        <>
          <Divider my={2} />

          <Flex alignItems="center" justifyContent="space-between" mb={2}>
            <Typography>
              <Trans>Transfer fee</Trans>
            </Typography>

            <Typography>{formattedXCallFee ?? ''}</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Transfer time</Trans>
            </Typography>

            <Typography textAlign="right">~ 30s</Typography>
          </Flex>
        </>
      )}
    </Box>
  );
}
