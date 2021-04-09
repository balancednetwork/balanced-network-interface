import React from 'react';

import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { usePoolPair, usePoolData } from 'store/pool/hooks';
import { formatBigNumber } from 'utils';

export default function LPDescription() {
  const selectedPair = usePoolPair();
  const data = usePoolData(selectedPair.poolId);

  return (
    <Box bg="bg2" flex={1} padding={7}>
      <Typography variant="h3" mb={2}>
        {selectedPair.pair} liquidity pool
      </Typography>
      <Typography mb={5} lineHeight={'25px'}>
        {selectedPair.baseCurrencyKey.toLowerCase() === 'icx'
          ? 'Earn Balance Tokens every day you supply liquidity. Your assets will be locked for the first 24 hours, and your supply ratio will fluctuate with the price.'
          : selectedPair.baseCurrencyKey.toLowerCase() === 'baln'
          ? 'Earn Balance Tokens every day you supply liquidity, and start accruing dividends. Your supply ratio will fluctuate with the price.'
          : selectedPair.baseCurrencyKey.toLowerCase() === 'sicx'
          ? 'Earn Balance Tokens every day you supply liquidity. Your supply ratio will fluctuate with the price.'
          : ''}
      </Typography>

      <Flex flexWrap="wrap">
        <Box
          width={[1, 1 / 2]} //
          sx={{
            borderBottom: ['1px solid rgba(255, 255, 255, 0.15)', 0], //
            borderRight: [0, '1px solid rgba(255, 255, 255, 0.15)'],
          }}
        >
          <StyledDL>
            <dt>Your supply</dt>
            <dd>
              {selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx'
                ? formatBigNumber(data?.suppliedBase, 'currency') + ' ICX'
                : formatBigNumber(data?.suppliedBase, 'currency') +
                  ' ' +
                  selectedPair.baseCurrencyKey +
                  ' / ' +
                  formatBigNumber(data?.suppliedQuote, 'currency') +
                  ' ' +
                  selectedPair.quoteCurrencyKey}
            </dd>
          </StyledDL>
          <StyledDL>
            <dt>Your daily rewards</dt>
            <dd>~ {formatBigNumber(data?.suppliedReward, 'currency')} BALN</dd>
          </StyledDL>
        </Box>
        <Box width={[1, 1 / 2]}>
          <StyledDL>
            <dt>Total supply</dt>
            <dd>
              {' '}
              {selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx'
                ? formatBigNumber(data?.totalBase, 'currency') + ' ICX'
                : formatBigNumber(data?.totalBase, 'currency') +
                  ' ' +
                  selectedPair.baseCurrencyKey +
                  ' / ' +
                  formatBigNumber(data?.totalQuote, 'currency') +
                  ' ' +
                  selectedPair.quoteCurrencyKey}
            </dd>
          </StyledDL>
          <StyledDL>
            <dt>Total daily rewards</dt>
            <dd>{formatBigNumber(data?.totalReward, 'currency')} BALN</dd>
          </StyledDL>
        </Box>
      </Flex>
    </Box>
  );
}

const StyledDL = styled.dl`
  margin: 15px 0 15px 0;
  text-align: center;

  > dd {
    margin-left: 0;
  }
`;
