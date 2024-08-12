import React, { useState } from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useFundLimits } from '@/queries';
import { useStabilityFundHoldings } from '@/queries/blockDetails';
import DatePicker from 'react-datepicker';
import { Box, Flex, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { BoxPanel } from '@/components/Panel';
import CurrencyLogo from '@/components/shared/CurrencyLogo';
import { DatePickerWrap, DisplayValueOrLoader, formatPercentage } from '@/pages/PerformanceDetails/utils';
import { Typography } from '@/theme';

import { ScrollHelper } from '../../index';
import { StyledSkeleton } from '../EarningSection';
import { Change, DatePickerInput } from '../HoldingsSection';

import 'react-datepicker/dist/react-datepicker.css';
import { useAssetManagerTokens } from '@/queries/assetManager';
import AssetManagerTokenBreakdown from '@/components/AssetManagerTokenBreakdown';

const BalanceGrid = styled.div`
  display: grid;
  grid-template-columns: 31% 23% 23% 23%;
  align-items: stretch;
  min-width: 700px;
`;

const GridItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
  &:nth-of-type(4n + 1) {
    justify-content: start;
  }
`;

const GridItemStrong = styled(GridItem)`
  padding-bottom: 10px;
  font-weight: 700;
  color: #ffffff;

  &:nth-of-type(4n + 1) {
    padding-left: 25px;
  }
`;

const GridItemSubtotal = styled(GridItemStrong)`
  border-top: 1px solid #304a68;
  border-bottom: 1px solid #304a68;
  padding-top: 9px;

  &:nth-of-type(4n + 1) {
    padding-left: 0;
  }
`;

const GridItemTotal = styled(GridItemSubtotal)`
  border-bottom: 0;
`;

const GridItemToken = styled(GridItem)`
  padding: 20px 0;
`;

const GridItemAssetTotal = styled(GridItemTotal)`
  border-top: 0;
  padding-top: 20px;
`;

const GridItemHeader = styled(GridItem)`
  text-transform: uppercase;
  font-size: 14px;
  font-weight: normal;
  letter-spacing: 3px;
  color: #ffffff;
  padding: 25px 0 20px;
  white-space: nowrap;
`;

const StabilityFundSection = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 1)));
  const { data: fundLimits } = useFundLimits();
  const { data: assetManagerTokensBreakdown } = useAssetManagerTokens();

  let totalCurrent = 0;
  let totalPast = 0;
  let totalLimit = 0;

  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  const { data: holdingsCurrent } = useStabilityFundHoldings(now);
  const { data: holdingsPast } = useStabilityFundHoldings(selectedDate.valueOf());

  return (
    <BoxPanel bg="bg2" mb={10} id="stability-fund">
      <Typography variant="h2">Stability Fund</Typography>
      <ScrollHelper>
        <BalanceGrid>
          <GridItemHeader>Asset</GridItemHeader>
          <GridItemHeader>Maximum limit</GridItemHeader>
          <GridItemHeader>
            {new Date().toLocaleDateString('en-US', {
              day: '2-digit',
            })}{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </GridItemHeader>
          <GridItemHeader>
            <DatePickerWrap>
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                dateFormat="dd MMM yyyy"
                popperClassName="datepicker-popper-wrap"
                popperPlacement="bottom-end"
                minDate={new Date(2022, 7, 16)}
                maxDate={new Date().setDate(new Date().getDate() - 1)}
                customInput={<DatePickerInput />}
                popperModifiers={[
                  { name: 'offset', options: { offset: [20, -3] } },
                  {
                    name: 'preventOverflow',
                    options: {
                      rootBoundary: 'body',
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            </DatePickerWrap>
          </GridItemHeader>
        </BalanceGrid>

        {holdingsCurrent &&
          Object.keys(holdingsCurrent).map(contract => {
            const token = holdingsCurrent[contract].currency.wrapped;
            const tokenBreakdown = assetManagerTokensBreakdown && assetManagerTokensBreakdown[contract];
            const fundLimit = fundLimits && fundLimits[token.address];
            const curAmount = new BigNumber(holdingsCurrent[contract].toFixed());
            const prevAmount =
              holdingsPast && holdingsPast[contract] && new BigNumber(holdingsPast[contract].toFixed());
            const percentageChange =
              prevAmount && curAmount.isGreaterThan(prevAmount)
                ? new BigNumber(100).minus(prevAmount.times(100).div(curAmount)).toNumber()
                : prevAmount && prevAmount.isGreaterThan(0)
                ? curAmount.div(prevAmount).minus(1).times(100).toNumber()
                : 0;

            if (curAmount) {
              totalCurrent += curAmount.toNumber();
            }
            if (prevAmount) {
              totalPast += prevAmount.toNumber();
            }

            if (fundLimit) {
              totalLimit += new BigNumber(fundLimit.toFixed()).toNumber();
            }

            return (
              <BalanceGrid key={contract}>
                <GridItemToken>
                  <Flex alignItems="center">
                    <CurrencyLogo currency={token as Currency} size="40px" />
                    <Box ml={2}>
                      <Flex>
                        <Text color="text">{token.name}</Text>
                        {tokenBreakdown && tokenBreakdown.length > 1 && (
                          <AssetManagerTokenBreakdown breakdown={tokenBreakdown} spacing={{ x: 5, y: 0 }} />
                        )}
                      </Flex>
                      <Text color="text" opacity={0.75}>
                        {token.symbol}
                      </Text>
                    </Box>
                  </Flex>
                </GridItemToken>
                <GridItemToken>
                  <Text color="text">
                    {fundLimit && (
                      <DisplayValueOrLoader
                        value={new BigNumber(fundLimit.toFixed())}
                        currencyRate={1}
                        format="number"
                      />
                    )}
                  </Text>
                </GridItemToken>
                <GridItemToken>
                  <Text color="text">
                    <DisplayValueOrLoader value={curAmount} currencyRate={1} format={'number'} />
                    <Change percentage={percentageChange || 0}>{formatPercentage(percentageChange)}</Change>
                  </Text>
                </GridItemToken>
                <GridItemToken>
                  <Text color="text">
                    {holdingsPast ? (
                      holdingsPast[contract].greaterThan(0) ? (
                        <DisplayValueOrLoader value={prevAmount} currencyRate={1} format={'number'} />
                      ) : (
                        '0'
                      )
                    ) : (
                      <StyledSkeleton width={120} />
                    )}
                  </Text>
                </GridItemToken>
              </BalanceGrid>
            );
          })}

        <BalanceGrid className="border-top">
          <GridItemAssetTotal>Total</GridItemAssetTotal>
          <GridItemAssetTotal>
            {fundLimits ? <DisplayValueOrLoader value={totalLimit} currencyRate={1} /> : <StyledSkeleton width={120} />}
          </GridItemAssetTotal>
          <GridItemAssetTotal>
            {holdingsCurrent ? (
              <DisplayValueOrLoader value={totalCurrent} currencyRate={1} />
            ) : (
              <StyledSkeleton width={120} />
            )}
          </GridItemAssetTotal>
          <GridItemAssetTotal>
            {holdingsPast ? (
              <DisplayValueOrLoader value={totalPast} currencyRate={1} />
            ) : (
              <StyledSkeleton width={120} />
            )}
          </GridItemAssetTotal>
        </BalanceGrid>
      </ScrollHelper>
    </BoxPanel>
  );
};

export default StabilityFundSection;
