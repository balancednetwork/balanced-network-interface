import React from 'react';

import BigNumber from 'bignumber.js';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { SUPPORTED_PAIRS } from 'constants/currency';
import { useLiquiditySupply } from 'store/liquidity/hooks';
import { usePoolPair } from 'store/pool/hooks';
import { useReward } from 'store/reward/hooks';
import { formatBigNumber } from 'utils';

const useSelectedPairSuppliedAmount = () => {
  const selectedPair = usePoolPair();
  const liquiditySupply = useLiquiditySupply();
  const poolReward = useReward();

  switch (selectedPair.pair) {
    case SUPPORTED_PAIRS[0].pair: {
      let sICXbnUSDpoolDailyReward = poolReward.sICXbnUSDreward?.multipliedBy(
        poolReward.poolDailyReward || new BigNumber(0),
      );
      let sICXbnUSDSuppliedShare = liquiditySupply.sICXbnUSDBalance?.dividedBy(
        liquiditySupply.sICXbnUSDTotalSupply || new BigNumber(0),
      );
      let dailyReward = sICXbnUSDpoolDailyReward?.multipliedBy(sICXbnUSDSuppliedShare || new BigNumber(0));
      return {
        base: liquiditySupply.sICXSuppliedPoolsICXbnUSD || new BigNumber(0),
        quote: liquiditySupply.bnUSDSuppliedPoolsICXbnUSD || new BigNumber(0),
        baseSupply: liquiditySupply.sICXPoolsICXbnUSDTotal || new BigNumber(0),
        quoteSupply: liquiditySupply.bnUSDPoolsICXbnUSDTotal || new BigNumber(0),
        dailyReward: dailyReward || new BigNumber(0),
        poolTotalDailyReward: sICXbnUSDpoolDailyReward || new BigNumber(0),
      };
    }
    case SUPPORTED_PAIRS[1].pair: {
      let BALNbnUSDpoolDailyReward = poolReward.BALNbnUSDreward?.multipliedBy(
        poolReward.poolDailyReward || new BigNumber(0),
      );
      let BALNbnUSDSuppliedShare = liquiditySupply.BALNbnUSDBalance?.dividedBy(
        liquiditySupply.BALNbnUSDTotalSupply || new BigNumber(0),
      );
      let dailyReward = BALNbnUSDpoolDailyReward?.multipliedBy(BALNbnUSDSuppliedShare || new BigNumber(0));
      return {
        base: liquiditySupply.BALNSuppliedPoolBALNbnUSD || new BigNumber(0),
        quote: liquiditySupply.bnUSDSuppliedPoolBALNbnUSD || new BigNumber(0),
        baseSupply: liquiditySupply.BALNPoolBALNbnUSDTotal || new BigNumber(0),
        quoteSupply: liquiditySupply.bnUSDPoolBALNbnUSDTotal || new BigNumber(0),
        dailyReward: dailyReward || new BigNumber(0),
        poolTotalDailyReward: BALNbnUSDpoolDailyReward || new BigNumber(0),
      };
    }
    case SUPPORTED_PAIRS[2].pair: {
      let sICXICXpoolDailyReward = poolReward.sICXICXreward?.multipliedBy(
        poolReward.poolDailyReward || new BigNumber(0),
      );
      let sICXICXSuppliedShare = liquiditySupply.ICXBalance?.dividedBy(
        liquiditySupply.sICXICXTotalSupply || new BigNumber(0),
      );
      let dailyReward = sICXICXpoolDailyReward?.multipliedBy(sICXICXSuppliedShare || new BigNumber(0));
      return {
        base: new BigNumber(2),
        quote: new BigNumber(2),
        baseSupply: new BigNumber(0),
        quoteSupply: new BigNumber(0),
        dailyReward: dailyReward || new BigNumber(0),
        poolTotalDailyReward: sICXICXpoolDailyReward || new BigNumber(0),
      };
    }
    default: {
      return {
        base: new BigNumber(0),
        quote: new BigNumber(0),
        baseSupply: new BigNumber(0),
        quoteSupply: new BigNumber(0),
        dailyReward: new BigNumber(0),
        poolTotalDailyReward: new BigNumber(0),
      };
    }
  }
};

export default function LPDescription() {
  const liquiditySupply = useLiquiditySupply();

  const ICXliquiditySupply = liquiditySupply.ICXBalance || new BigNumber(0);

  const selectedPair = usePoolPair();

  const suppliedPairAmount = useSelectedPairSuppliedAmount();

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
                ? formatBigNumber(ICXliquiditySupply, 'currency') + ' ICX'
                : formatBigNumber(suppliedPairAmount.base, 'currency') +
                  ' ' +
                  selectedPair.baseCurrencyKey +
                  ' / ' +
                  formatBigNumber(suppliedPairAmount.quote, 'currency') +
                  ' ' +
                  selectedPair.quoteCurrencyKey}
            </dd>
          </StyledDL>
          <StyledDL>
            <dt>Your daily rewards</dt>
            <dd>~ {formatBigNumber(suppliedPairAmount.dailyReward, 'currency')} BALN</dd>
          </StyledDL>
        </Box>
        <Box width={[1, 1 / 2]}>
          <StyledDL>
            <dt>Total supply</dt>
            <dd>
              {' '}
              {selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx'
                ? formatBigNumber(liquiditySupply.sICXICXTotalSupply, 'currency') + ' ICX'
                : formatBigNumber(suppliedPairAmount.baseSupply, 'currency') +
                  ' ' +
                  selectedPair.baseCurrencyKey +
                  ' / ' +
                  formatBigNumber(suppliedPairAmount.quoteSupply, 'currency') +
                  ' ' +
                  selectedPair.quoteCurrencyKey}
            </dd>
          </StyledDL>
          <StyledDL>
            <dt>Total daily rewards</dt>
            <dd>{formatBigNumber(suppliedPairAmount.poolTotalDailyReward, 'currency')} BALN</dd>
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
