import QuestionHelper, { QuestionWrapper } from '@/components/QuestionHelper';
import { HIGH_PRICE_ASSET_DP } from '@/constants/tokens';
import { AssetManagerToken } from '@/queries/assetManager';
import React, { Fragment } from 'react';
import { Box } from 'rebass';
import styled from 'styled-components';

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
  breakdown,
  spacing = { x: 0, y: 0 },
}: {
  breakdown: AssetManagerToken[];
  spacing?: { x: number; y: number };
}) => {
  return (
    <QuestionWrapper style={{ marginLeft: `${spacing.x}px`, transform: `translateY(${spacing.y}px)` }}>
      <QuestionHelper
        text={
          <Grid>
            {breakdown.map((assetManagerToken, i) => (
              <Fragment key={i}>
                <NetworkName>{assetManagerToken.networkName}:</NetworkName>
                <Amount>{`${assetManagerToken.tokenAmount.toFixed(
                  HIGH_PRICE_ASSET_DP[assetManagerToken.tokenAmount.currency.address] || 0,
                  { groupFormatting: ',' },
                )} ${assetManagerToken.tokenAmount.currency.symbol}`}</Amount>
              </Fragment>
            ))}
          </Grid>
        }
      />
    </QuestionWrapper>
  );
};

export default AssetManagerTokenBreakdown;
