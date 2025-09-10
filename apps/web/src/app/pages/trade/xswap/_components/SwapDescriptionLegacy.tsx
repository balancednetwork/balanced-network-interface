import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';

import { ChartContainer } from '@/app/components/ChartControl';
import { Typography } from '@/app/theme';
import useWidth from '@/hooks/useWidth';
import { useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatSymbol } from '@/utils/formatter';

export default function SwapDescription() {
  const { currencies: XCurrencies } = useDerivedSwapInfo();

  const [ref] = useWidth();

  const symbolName = `${formatSymbol(XCurrencies[Field.INPUT]?.symbol)} / ${formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)}`;

  return (
    <Flex bg="bg2" flex={1} flexDirection="column" p={[5, 7]}>
      <Flex mb={5} flexWrap="wrap">
        <Box width={[1, 1 / 2]}>
          <Typography variant="h3" mb={2}>
            {symbolName}
          </Typography>
        </Box>
      </Flex>
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width: '100%' }}>
        <ChartContainer my="auto" width="100%" ref={ref}>
          <Flex justifyContent="center" alignItems="center" height="100%">
            <Typography>
              <Trans>No price chart available for this pair.</Trans>
            </Typography>
          </Flex>
        </ChartContainer>
      </div>
    </Flex>
  );
}
