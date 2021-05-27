import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { Flex, Box } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { usePoolPair, usePoolData, usePool } from 'store/pool/hooks';
import { useRatio } from 'store/ratio/hooks';
import { formatBigNumber } from 'utils';

const descriptions = {
  1: 'Supply ICX to earn Balance Tokens. Your ICX will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards. This pool works like a queue, so you can withdraw your sICX from the liquidity details section as your order is filled.',
  2: 'Supply an equal amount of sICX and bnUSD to earn BALN. Your assets will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards.',
  3: 'Supply an equal amount of BALN and bnUSD to earn Balance Tokens. Your assets will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards. All BALN in the pool accrues network fees.',
  4: 'Supply an equal amount of BALN and sICX to earn Balance Tokens. Your assets will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards. All BALN in the pool accrues network fees.',
};

interface ILPDescriptionProps {
  baseSuplying: BigNumber;
  quoteSupplying: BigNumber;
}

export default function LPDescription({ baseSuplying, quoteSupplying }: ILPDescriptionProps) {
  const selectedPair = usePoolPair();

  const pool = usePool(selectedPair.poolId);

  const ratio = useRatio();

  const ratioByPoolId = useMemo(
    () => ({
      1: ratio.sICXICXratio,
      2: ratio.sICXbnUSDratio,
      3: ratio.BALNbnUSDratio,
    }),
    [ratio.BALNbnUSDratio, ratio.sICXICXratio, ratio.sICXbnUSDratio],
  );

  const data = usePoolData(selectedPair.poolId) || {
    totalBase: new BigNumber(0),
    totalQuote: new BigNumber(0),
    totalReward: new BigNumber(0),
    suppliedBase: new BigNumber(0),
    suppliedQuote: new BigNumber(0),
    suppliedReward: new BigNumber(0),
    poolShare: new BigNumber(0),
  };

  const totalPool = useMemo(() => pool.total || new BigNumber(1), [pool.total]);
  const newSuppliedAmount = useMemo(() => baseSuplying.times(ratioByPoolId[selectedPair.poolId]).plus(quoteSupplying), [
    baseSuplying,
    selectedPair.poolId,
    quoteSupplying,
    ratioByPoolId,
  ]);
  const poolShare = useMemo(() => newSuppliedAmount.div(totalPool) || new BigNumber(0), [newSuppliedAmount, totalPool]);

  const supplyBase = useMemo(
    () =>
      data.suppliedBase?.isZero() || baseSuplying.isGreaterThan(0)
        ? data?.suppliedBase?.plus(baseSuplying)
        : data?.suppliedBase,
    [baseSuplying, data.suppliedBase],
  );
  const supplyQuote = useMemo(
    () =>
      data.suppliedQuote?.isZero() || quoteSupplying.isGreaterThan(0)
        ? data?.suppliedQuote?.plus(quoteSupplying)
        : data?.suppliedQuote,
    [data.suppliedQuote, quoteSupplying],
  );

  const dailyReward = useMemo(
    () =>
      data?.totalReward.isZero() || baseSuplying.isGreaterThan(0) || quoteSupplying.isGreaterThan(0)
        ? data?.totalReward.times(poolShare)
        : data?.totalReward,
    [data.totalReward, poolShare, baseSuplying, quoteSupplying],
  );

  return (
    <Box bg="bg2" flex={1} padding={[5, 7]}>
      <Typography variant="h3" mb={2}>
        {selectedPair.pair} liquidity pool
      </Typography>

      <Typography mb={5} lineHeight={'25px'}>
        {descriptions[selectedPair.poolId]}
      </Typography>

      <Flex flexWrap="wrap">
        <Box
          width={[1, 1 / 2]} //
          sx={{
            borderBottom: ['1px solid rgba(255, 255, 255, 0.15)', 0], //
            borderRight: [0, '1px solid rgba(255, 255, 255, 0.15)'],
          }}
        >
          <Box sx={{ margin: '15px 0 25px 0' }}>
            <Typography textAlign="center" marginBottom="5px" color="text1">
              Your supply
            </Typography>
            <Typography textAlign="center" variant="p">
              {selectedPair.poolId !== BalancedJs.utils.POOL_IDS.sICXICX ? (
                <>
                  {formatBigNumber(supplyBase, 'currency')} {selectedPair.baseCurrencyKey} <br />
                  {formatBigNumber(supplyQuote, 'currency')} {selectedPair.quoteCurrencyKey}
                </>
              ) : (
                `${formatBigNumber(supplyQuote, 'currency')} ${selectedPair.quoteCurrencyKey}`
              )}
            </Typography>
          </Box>

          <Box sx={{ margin: '15px 0 25px 0' }}>
            <Typography textAlign="center" marginBottom="5px" color="text1">
              Your daily rewards
            </Typography>
            <Typography textAlign="center" variant="p">
              ~ {formatBigNumber(dailyReward, 'currency')} BALN
            </Typography>
          </Box>
        </Box>
        <Box width={[1, 1 / 2]}>
          <Box sx={{ margin: '15px 0 25px 0' }}>
            <Typography textAlign="center" marginBottom="5px" color="text1">
              Total supply
            </Typography>
            <Typography textAlign="center" variant="p">
              {selectedPair.poolId !== BalancedJs.utils.POOL_IDS.sICXICX ? (
                <>
                  {formatBigNumber(data?.totalBase, 'currency')} {selectedPair.baseCurrencyKey} <br />
                  {formatBigNumber(data?.totalQuote, 'currency')} {selectedPair.quoteCurrencyKey}
                </>
              ) : (
                `${formatBigNumber(data?.totalQuote, 'currency')} ${selectedPair.quoteCurrencyKey}`
              )}
            </Typography>
          </Box>

          <Box sx={{ margin: '15px 0 25px 0' }}>
            <Typography textAlign="center" marginBottom="5px" color="text1">
              Total daily rewards
            </Typography>
            <Typography textAlign="center" variant="p">
              {formatBigNumber(data?.totalReward, 'currency')} BALN
            </Typography>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
