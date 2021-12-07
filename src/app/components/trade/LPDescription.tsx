import React from 'react';

import JSBI from 'jsbi';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { useLiquidityTokenBalance } from 'store/wallet/hooks';

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

export default function LPDescription() {
  const { currencies, pair } = useDerivedMintInfo();
  const { account } = useIconReact();
  const userPoolBalance = useLiquidityTokenBalance(account, pair);
  const totalPoolTokens = pair?.totalSupply;
  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined];

  return (
    <Box bg="bg2" flex={1} padding={[5, 7]}>
      <Typography variant="h3" mb={2}>
        {`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}`} liquidity pool
      </Typography>

      {pair?.poolId && (
        <Typography mb={5} lineHeight={'25px'}>
          {descriptions[pair?.poolId]}
        </Typography>
      )}

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
              {!pair?.queueRate ? (
                <>
                  {token0Deposited?.toSignificant(6, { groupSeparator: ',' })} {pair?.reserve0.currency?.symbol}
                  <br />
                  {token1Deposited?.toSignificant(6, { groupSeparator: ',' })} {pair?.reserve1.currency?.symbol}
                </>
              ) : (
                `${token0Deposited?.toSignificant(6, { groupSeparator: ',' })} ${pair?.reserve0.currency?.symbol}`
              )}
            </Typography>
          </Box>

          {/* {selectedPair.rewards && (
            <Box sx={{ margin: '15px 0 25px 0' }}>
              <Typography textAlign="center" marginBottom="5px" color="text1">
                Your daily rewards
              </Typography>
              <Typography textAlign="center" variant="p">
                ~ {formatBigNumber(dailyReward, 'currency')} BALN
              </Typography>
            </Box>
          )} */}
        </Box>
        <Box width={[1, 1 / 2]}>
          <Box sx={{ margin: '15px 0 25px 0' }}>
            <Typography textAlign="center" marginBottom="5px" color="text1">
              Total supply
            </Typography>
            <Typography textAlign="center" variant="p">
              {!pair?.queueRate ? (
                <>
                  {pair?.reserve0.toFixed(0, { groupSeparator: ',' })} {pair?.reserve0.currency?.symbol}
                  <br />
                  {pair?.reserve1.toFixed(0, { groupSeparator: ',' })} {pair?.reserve1.currency?.symbol}
                </>
              ) : (
                `${pair?.reserve0.toFixed(0, { groupSeparator: ',' })} ${pair?.reserve0.currency?.symbol}`
              )}
            </Typography>
          </Box>

          {/* {selectedPair.rewards && (
            <Box sx={{ margin: '15px 0 25px 0' }}>
              <Typography textAlign="center" marginBottom="5px" color="text1">
                Total daily rewards
              </Typography>
              <Typography textAlign="center" variant="p">
                {formatBigNumber(data?.totalReward, 'currency')} BALN
              </Typography>
            </Box>
          )} */}
        </Box>
      </Flex>
    </Box>
  );
}
