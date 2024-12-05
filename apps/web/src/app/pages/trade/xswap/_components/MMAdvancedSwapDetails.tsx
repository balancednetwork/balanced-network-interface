import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';

import { Typography } from '@/app/theme';
import { useDerivedMMTradeInfo, useDerivedSwapInfo } from '@/store/swap/hooks';
import TradePrice from './TradePrice';

export default function MMAdvancedSwapDetails() {
  const { trade: trade1 } = useDerivedSwapInfo();
  const { trade } = useDerivedMMTradeInfo(trade1);

  const [showInverted, setShowInverted] = React.useState<boolean>(false);

  if (!trade) return null;

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

        <Typography textAlign="right">
          <Trans>Balanced Intent</Trans>
        </Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Swap fee</Trans>
        </Typography>

        <Typography textAlign="right">
          {trade.fee.toFixed(4)} {trade?.fee.currency.symbol}
        </Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Swap time</Trans>
        </Typography>

        <Typography textAlign="right">~ 3s</Typography>
      </Flex>
    </Box>
  );
}
