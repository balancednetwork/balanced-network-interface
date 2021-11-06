import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { Flex, Box } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { usePoolPair, usePoolData } from 'store/pool/hooks';
import { formatBigNumber } from 'utils';

import { Link } from '../Link';

const descriptions = {
  1: 'Supply ICX to earn Balance Tokens. Your ICX will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards. This pool works like a queue, so you can withdraw your sICX from the liquidity details section as your order is filled.',
  2: 'Supply an equal amount of sICX and bnUSD to earn BALN. Your assets will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards.',
  3: 'Supply an equal amount of BALN and bnUSD to earn Balance Tokens. Your assets will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards. All BALN in the pool accrues network fees.',
  4: 'Supply an equal amount of BALN and sICX to earn Balance Tokens. Your assets will be locked for 24 hours, and you must be in the pool at 1pm Eastern each day to receive rewards. All BALN in the pool accrues network fees.',
  7: (
    <>
      Requires an equal amount of OMM and sICX. To earn rewards from this pool, use&nbsp;
      <Link href="https://omm.finance/" target="_blank">
        Omm
      </Link>
      &nbsp;with the same wallet.
    </>
  ),
  8: (
    <>
      Requires an equal amount of OMM and USDS. To earn rewards from this pool, use&nbsp;
      <Link href="https://omm.finance/" target="_blank">
        Omm
      </Link>
      &nbsp;with the same wallet.
    </>
  ),
  6: (
    <>
      Requires an equal amount of OMM and IUSDC. To earn rewards from this pool, use&nbsp;
      <Link href="https://omm.finance/" target="_blank">
        Omm
      </Link>
      &nbsp;with the same wallet.
    </>
  ),
};

interface ILPDescriptionProps {
  baseSuplying: BigNumber;
  quoteSupplying: BigNumber;
}

export default function LPDescription({ baseSuplying, quoteSupplying }: ILPDescriptionProps) {
  const selectedPair = usePoolPair();

  const data = usePoolData(selectedPair.poolId) || {
    totalBase: new BigNumber(0),
    totalQuote: new BigNumber(0),
    totalReward: new BigNumber(0),
    suppliedBase: new BigNumber(0),
    suppliedQuote: new BigNumber(0),
    suppliedReward: new BigNumber(0),
    poolShare: new BigNumber(0),
  };

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

  const totalBase = baseSuplying.isGreaterThan(0) ? baseSuplying?.plus(data.totalBase) : data.totalBase;

  const dailyReward = useMemo(() => {
    if (totalBase) {
      const percentageSupplyBase = supplyBase?.dividedBy(totalBase);
      return percentageSupplyBase?.isGreaterThanOrEqualTo(1)
        ? data?.totalReward
        : percentageSupplyBase?.multipliedBy(data?.totalReward);
    }
  }, [data.totalReward, supplyBase, totalBase]);

  return (
    <Box bg="bg2" flex={1} padding={[5, 7]}>
      <Typography variant="h3" mb={2}>
        {selectedPair.pair} liquidity pool
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

          {selectedPair.rewards && (
            <Box sx={{ margin: '15px 0 25px 0' }}>
              <Typography textAlign="center" marginBottom="5px" color="text1">
                Your daily rewards
              </Typography>
              <Typography textAlign="center" variant="p">
                ~ {formatBigNumber(dailyReward, 'currency')} BALN
              </Typography>
            </Box>
          )}
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

          {selectedPair.rewards && (
            <Box sx={{ margin: '15px 0 25px 0' }}>
              <Typography textAlign="center" marginBottom="5px" color="text1">
                Total daily rewards
              </Typography>
              <Typography textAlign="center" variant="p">
                {formatBigNumber(data?.totalReward, 'currency')} BALN
              </Typography>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
