import { Price, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';

import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';

import Divider from '@/app/components/Divider';
import QuestionHelper from '@/app/components/QuestionHelper';
import SlippageSetting from '@/app/components/SlippageSetting';
import { Typography } from '@/app/theme';
import { useSetSlippageTolerance, useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedTradeInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import TradePrice from './TradePrice';

export default function AdvancedOrderDetails() {
  const { exchangeRate, currencies } = useDerivedTradeInfo();
  const [showInverted, setShowInverted] = React.useState<boolean>(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const setSlippageTolerance = useSetSlippageTolerance();

  const price = React.useMemo(() => {
    if (!exchangeRate.isZero() && currencies[Field.INPUT] && currencies[Field.OUTPUT]) {
      const rate = exchangeRate.isFinite() ? exchangeRate : new BigNumber(0);
      const inputCurrency = currencies[Field.INPUT];
      const outputCurrency = currencies[Field.OUTPUT];

      const denominator = new BigNumber(10).pow(inputCurrency.decimals).toString();
      const numerator = rate.times(new BigNumber(10).pow(outputCurrency.decimals)).toFixed(0);

      return new Price(inputCurrency as Token, outputCurrency as Token, denominator, numerator);
    }
  }, [exchangeRate, currencies]);

  return (
    <Box padding={5} bg="bg4" width={328}>
      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Exchange rate</Trans>
        </Typography>

        {price ? <TradePrice price={price} showInverted={showInverted} setShowInverted={setShowInverted} /> : '-'}
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Route</Trans>
        </Typography>

        <Typography textAlign="right" maxWidth="200px">
          <Trans>Sodax intent</Trans>
        </Typography>
      </Flex>

      <Flex alignItems="baseline" justifyContent="space-between">
        <Typography as="span">
          <Trans>Slippage tolerance</Trans>
          <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} />
        </Typography>
        <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
      </Flex>

      <Divider my={2} />

      <Flex alignItems="center" justifyContent="space-between">
        <Typography>
          <Trans>Swap time</Trans>
        </Typography>

        <Typography textAlign="right">~ 30s</Typography>
      </Flex>
    </Box>
  );
}
