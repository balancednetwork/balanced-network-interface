import { HIGH_PRICE_ASSET_DP } from '@/constants/tokens';
import React, { Fragment } from 'react';
import { Box } from 'rebass';
import styled from 'styled-components';
import QuestionHelper, { QuestionWrapper } from '../QuestionHelper';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { XToken } from '@/app/pages/trade/bridge/types';
import { xChainMap } from '@/app/pages/trade/bridge/_config/xChains';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance } from '@/utils/formatter';

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 6px;
  column-gap: 5px;
`;

const NetworkName = styled(Box)`
  ${({ theme }) => `color: ${theme.colors.text1};`};
`;

const Amount = styled(Box)`
  text-align: right;
`;

const AssetManagerTokenBreakdown = ({
  amounts,
  spacing = { x: 0, y: 0 },
}: {
  amounts: CurrencyAmount<XToken>[];
  spacing?: { x: number; y: number };
}) => {
  const prices = useRatesWithOracle();

  return (
    <QuestionWrapper style={{ marginLeft: `${spacing.x}px`, transform: `translateY(${spacing.y}px)` }}>
      <QuestionHelper
        text={
          <Grid>
            {amounts.map((currencyAmount, i) => (
              <Fragment key={i}>
                <NetworkName>{xChainMap[currencyAmount.currency.xChainId].name}:</NetworkName>
                <Amount>
                  {`${formatBalance(currencyAmount.toExact(), prices?.[currencyAmount.currency.symbol].toFixed())} ${currencyAmount.currency.symbol}`}
                </Amount>
              </Fragment>
            ))}
          </Grid>
        }
      />
    </QuestionWrapper>
  );
};

export default AssetManagerTokenBreakdown;
