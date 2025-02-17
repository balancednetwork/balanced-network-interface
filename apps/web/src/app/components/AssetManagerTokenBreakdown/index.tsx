import { Typography } from '@/app/theme';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { xChainMap, xTokenMap } from '@balancednetwork/xwagmi';
import { XToken } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import React, { Fragment, useMemo } from 'react';
import { Box } from 'rebass';
import styled from 'styled-components';
import QuestionHelper, { QuestionWrapper } from '../QuestionHelper';

export const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr auto auto;
  row-gap: 6px;
  column-gap: 6px;
`;

export const NetworkName = styled(Box)`
  ${({ theme }) => `color: ${theme.colors.text1};`};
`;

export const Amount = styled(Box)`
  text-align: right;
`;

export const TokenSymbol = styled(Box)`
  text-align: left;
  opacity: 0.85;
`;

const AssetManagerTokenBreakdown = ({
  amounts,
  spacing = { x: 0, y: 0 },
}: {
  amounts: CurrencyAmount<XToken>[];
  spacing?: { x: number; y: number };
}) => {
  const prices = useRatesWithOracle();

  const sortedAmounts = useMemo(() => {
    return amounts.sort((a, b) => {
      const aAmount = new BigNumber(a.toFixed()).toNumber();
      const bAmount = new BigNumber(b.toFixed()).toNumber();
      return bAmount - aAmount;
    });
  }, [amounts]);

  return (
    <QuestionWrapper style={{ marginLeft: `${spacing.x}px`, transform: `translateY(${spacing.y}px)` }}>
      <QuestionHelper
        width={280}
        text={
          <>
            <Typography mb="15px" color="text1">
              <Trans>Liquidity is held on ICON, with varied availability on other blockchains:</Trans>
            </Typography>
            <Grid>
              {sortedAmounts.map((currencyAmount, i) => {
                const spokeAssetVersion: string | undefined = xTokenMap[currencyAmount.currency.xChainId].find(
                  xToken => xToken.symbol === currencyAmount.currency.symbol,
                )?.spokeVersion;

                return (
                  <Fragment key={i}>
                    <NetworkName>{xChainMap[currencyAmount.currency.xChainId].name}:</NetworkName>
                    <Amount>
                      {`${formatBalance(currencyAmount.toExact(), prices?.[currencyAmount.currency.symbol].toFixed())}`}
                    </Amount>
                    <TokenSymbol>{spokeAssetVersion || currencyAmount.currency.symbol}</TokenSymbol>
                  </Fragment>
                );
              })}
            </Grid>
          </>
        }
      />
    </QuestionWrapper>
  );
};

export default AssetManagerTokenBreakdown;
