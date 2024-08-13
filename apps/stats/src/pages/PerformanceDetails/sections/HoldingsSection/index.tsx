import React, { useMemo, useState } from 'react';

import { addresses } from '@balancednetwork/balanced-js';
import { Currency } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { LAUNCH_DAY } from '@/queries';
import { useTokenPrices } from '@/queries/backendv2';
import { useHoldings, usePOLData } from '@/queries/blockDetails';
import DatePicker from 'react-datepicker';
import { Box, Flex, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { BoxPanel } from '@/components/Panel';
import CurrencyLogo, { CurrencyLogoFromURI } from '@/components/shared/CurrencyLogo';
import PoolLogo from '@/components/shared/PoolLogo';
import { HIGH_PRICE_ASSET_DP } from '@/constants/tokens';
import { DatePickerWrap, DisplayValueOrLoader, formatPercentage } from '@/pages/PerformanceDetails/utils';
import { Typography } from '@/theme';

import { GridItemToken, GridItemAssetTotal, GridItemHeader, ScrollHelper } from '../../index';
import { StyledSkeleton } from '../EarningSection';

import 'react-datepicker/dist/react-datepicker.css';

const daoFundAddress = addresses[1].daofund;
const reserveFundAddress = addresses[1].reserve;

export const BalanceGrid = styled.div<{ minWidth?: number }>`
  display: grid;
  grid-template-columns: 35% 32.5% 32.5%;
  align-items: stretch;
  ${({ minWidth }) => `min-width: ${minWidth || 600}px`};
`;

export const Change = styled.span<{ percentage: number }>`
  font-size: 14px;
  ${({ percentage, theme }) => percentage > 0 && `color: ${theme.colors.primary}`}
  ${({ percentage, theme }) => percentage < 0 && `color: ${theme.colors.alert}`}
`;

export const DatePickerInput = ({ ...props }) => <input type="text" {...props} readOnly />;

const HoldingsSection = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 1)));
  const { data: tokenPrices } = useTokenPrices();

  let totalCurrent = 0;
  let totalPast = 0;

  let totalCurrentReserve = 0;
  let totalPastReserve = 0;

  let totalCurrentPOL = 0;
  let totalPastPOL = 0;

  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  const { data: holdingsCurrent } = useHoldings(now, daoFundAddress);
  const { data: holdingsPast } = useHoldings(selectedDate.valueOf(), daoFundAddress);
  const combinedHoldings = useMemo(() => {
    if (holdingsCurrent && holdingsPast) {
      const result = Object.keys(holdingsCurrent).reduce((acc, key) => {
        acc[key] = { current: holdingsCurrent[key], past: holdingsPast[key] };
        return acc;
      }, {});
      return result;
    }
  }, [holdingsCurrent, holdingsPast]);

  const { data: holdingsCurrentReserve } = useHoldings(now, reserveFundAddress);
  const { data: holdingsPastReserve } = useHoldings(selectedDate.valueOf(), reserveFundAddress);
  const combinedHoldingsReserve = useMemo(() => {
    if (holdingsCurrentReserve && holdingsPastReserve) {
      const result = Object.keys(holdingsCurrentReserve).reduce((acc, key) => {
        acc[key] = { current: holdingsCurrentReserve[key], past: holdingsPastReserve[key] };
        return acc;
      }, {});
      return result;
    }
  }, [holdingsCurrentReserve, holdingsPastReserve]);

  const { data: POLCurrent } = usePOLData(now);
  const { data: POLPast } = usePOLData(selectedDate.valueOf());
  const combinedPOL = useMemo(() => {
    if (POLCurrent && POLPast) {
      const result = POLCurrent.map(currentPool => {
        const poolPast = POLPast.find(pool => pool.id === currentPool.id);
        return { current: currentPool, past: poolPast };
      });
      return result;
    }
  }, [POLCurrent, POLPast]);

  const shouldShowPOLSection =
    combinedPOL &&
    combinedPOL.filter(pol => pol.current.liquidity.isGreaterThan(0) || pol.past?.liquidity.isGreaterThan(0)).length >
      0;

  const gridWidth = 770;

  return (
    <BoxPanel bg="bg2" mb={10} id="holdings-history">
      <Typography variant="h2">Holdings</Typography>
      <ScrollHelper>
        {/* DAO Fund holdings */}
        <BalanceGrid minWidth={gridWidth}>
          <GridItemHeader>DAO Fund</GridItemHeader>
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
                minDate={new Date(LAUNCH_DAY / 1000)}
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
        {combinedHoldings &&
          tokenPrices &&
          Object.keys(combinedHoldings).map(contract => {
            const token = combinedHoldings[contract].current.currency.wrapped;
            const curAmount = new BigNumber(combinedHoldings[contract].current.toFixed(4));
            const prevAmount = new BigNumber(combinedHoldings[contract].past.toFixed(4));

            const percentageChange =
              prevAmount && curAmount.isGreaterThan(prevAmount)
                ? curAmount.div(prevAmount).minus(1).times(100).toNumber()
                : prevAmount && prevAmount.isGreaterThan(0)
                  ? curAmount.div(prevAmount).minus(1).times(100).toNumber()
                  : 0;

            const shouldAccount =
              curAmount.times(tokenPrices[token.symbol!]).isGreaterThan(1000) ||
              prevAmount.times(tokenPrices[token.symbol!]).isGreaterThan(1000);

            if (shouldAccount) {
              totalCurrent += curAmount.times(tokenPrices[token.symbol!]).toNumber();
              totalPast += prevAmount.times(tokenPrices[token.symbol!]).toNumber();
            }

            return (
              shouldAccount && (
                <BalanceGrid key={contract} minWidth={gridWidth}>
                  <GridItemToken>
                    <Flex alignItems="center">
                      <CurrencyLogo currency={token as Currency} size="40px" />
                      <Box ml={2}>
                        <Text color="text">{token.name}</Text>
                        <Text color="text" opacity={0.75}>
                          {token.symbol}
                        </Text>
                      </Box>
                    </Flex>
                  </GridItemToken>
                  <GridItemToken>
                    <Text color="text">
                      {tokenPrices && tokenPrices[token.symbol!] && (
                        <DisplayValueOrLoader value={curAmount} currencyRate={tokenPrices[token.symbol!].toNumber()} />
                      )}

                      <Change percentage={percentageChange ?? 0}>
                        {prevAmount.isGreaterThan(0) &&
                          Math.abs(percentageChange) >= 0.01 &&
                          formatPercentage(percentageChange)}
                      </Change>
                    </Text>
                    <Text color="text" opacity={0.75}>
                      <DisplayValueOrLoader
                        value={curAmount}
                        currencyRate={1}
                        format={HIGH_PRICE_ASSET_DP[contract] ? 'number4' : 'number'}
                      />
                      {` ${token.symbol}`}
                    </Text>
                  </GridItemToken>
                  <GridItemToken>
                    <Text color="text">
                      {combinedHoldings ? (
                        combinedHoldings[contract].past.greaterThan(0) ? (
                          <DisplayValueOrLoader
                            value={prevAmount}
                            currencyRate={tokenPrices && tokenPrices[token.symbol!].toNumber()}
                          />
                        ) : (
                          '-'
                        )
                      ) : (
                        <StyledSkeleton width={120} />
                      )}
                    </Text>
                    <Text color="text" opacity={0.75}>
                      {combinedHoldings ? (
                        combinedHoldings[contract].past.greaterThan(0) ? (
                          <>
                            <DisplayValueOrLoader
                              value={prevAmount}
                              currencyRate={1}
                              format={HIGH_PRICE_ASSET_DP[contract] ? 'number4' : 'number'}
                            />
                            {` ${token.symbol}`}
                          </>
                        ) : null
                      ) : (
                        <StyledSkeleton width={120} />
                      )}
                    </Text>
                  </GridItemToken>
                </BalanceGrid>
              )
            );
          })}

        <BalanceGrid minWidth={gridWidth} className="border-top border-bottom" style={{ paddingBottom: '10px' }}>
          <GridItemAssetTotal>Subtotal</GridItemAssetTotal>
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

        {/* POL section */}
        {shouldShowPOLSection && (
          <>
            <BalanceGrid minWidth={gridWidth}>
              <GridItemHeader>Protocol-owned liquidity</GridItemHeader>
            </BalanceGrid>
            {combinedPOL &&
              combinedPOL.map(currentPoolSet => {
                const currentPool = currentPoolSet.current;
                const poolPast = currentPoolSet.past;
                const percentageChange =
                  poolPast && currentPool.liquidity.isGreaterThan(poolPast.liquidity)
                    ? currentPool.liquidity.div(poolPast.liquidity).minus(1).times(100).toNumber()
                    : poolPast && poolPast.liquidity.isGreaterThan(0)
                      ? currentPool.liquidity.div(poolPast.liquidity).minus(1).times(100).toNumber()
                      : 0;

                const shouldAccount =
                  currentPool.liquidity.isGreaterThan(1000) || poolPast?.liquidity.isGreaterThan(1000);

                if (shouldAccount) {
                  totalCurrentPOL += currentPool.liquidity.toNumber();
                  totalPastPOL += poolPast ? poolPast.liquidity.toNumber() : 0;
                }

                const baseDecimalDisplay = currentPool.DAOBaseAmount.isGreaterThan(100) ? 0 : 2;
                const QUOTEDecimalDisplay = currentPool.DAOQuoteAmount.isGreaterThan(100) ? 0 : 2;

                return (
                  shouldAccount && (
                    <BalanceGrid minWidth={gridWidth} key={currentPool.id}>
                      <GridItemToken>
                        {currentPool.pair && (
                          <Flex alignItems="center">
                            <Box sx={{ minWidth: '95px' }}>
                              <PoolLogo
                                baseCurrency={currentPool.pair.baseAddress}
                                quoteCurrency={currentPool.pair.quoteAddress}
                              />
                            </Box>
                            <Text ml={2}>{`${currentPool.pair.baseSymbol} / ${currentPool.pair.quoteSymbol}`}</Text>
                          </Flex>
                        )}
                      </GridItemToken>
                      <GridItemToken>
                        <Text color="text">
                          <DisplayValueOrLoader value={currentPool.liquidity} currencyRate={1} />
                          {poolPast && poolPast.liquidity.isGreaterThan(0) && (
                            <Change percentage={percentageChange ?? 0}>
                              {Math.abs(percentageChange) >= 0.01 && formatPercentage(percentageChange)}
                            </Change>
                          )}
                        </Text>
                        <Text color="text2">{`${currentPool.DAOBaseAmount.toFormat(baseDecimalDisplay)} ${
                          currentPool.pair?.baseSymbol
                        } / ${currentPool.DAOQuoteAmount.toFormat(QUOTEDecimalDisplay)} ${
                          currentPool.pair?.quoteSymbol
                        }`}</Text>
                      </GridItemToken>
                      <GridItemToken>
                        {poolPast ? (
                          poolPast.liquidity.isGreaterThan(0) ? (
                            <>
                              <Text color="text">
                                <DisplayValueOrLoader value={poolPast.liquidity} currencyRate={1} />
                              </Text>
                              <Text color="text2">{`${poolPast.DAOBaseAmount.toFormat(baseDecimalDisplay)} ${
                                poolPast.pair?.baseSymbol
                              } / ${poolPast.DAOQuoteAmount.toFormat(QUOTEDecimalDisplay)} ${
                                poolPast.pair?.quoteSymbol
                              }`}</Text>
                            </>
                          ) : (
                            '-'
                          )
                        ) : (
                          <StyledSkeleton width={120} />
                        )}
                      </GridItemToken>
                    </BalanceGrid>
                  )
                );
              })}

            <BalanceGrid minWidth={gridWidth} className="border-top border-bottom" style={{ paddingBottom: '10px' }}>
              <GridItemAssetTotal>Subtotal</GridItemAssetTotal>
              <GridItemAssetTotal>
                {combinedPOL ? (
                  <DisplayValueOrLoader value={totalCurrentPOL} currencyRate={1} />
                ) : (
                  <StyledSkeleton width={120} />
                )}
              </GridItemAssetTotal>
              <GridItemAssetTotal>
                {combinedPOL ? (
                  <DisplayValueOrLoader value={totalPastPOL} currencyRate={1} />
                ) : (
                  <StyledSkeleton width={120} />
                )}
              </GridItemAssetTotal>
            </BalanceGrid>
          </>
        )}

        <BalanceGrid minWidth={gridWidth}>
          <GridItemHeader>Reserve fund</GridItemHeader>
        </BalanceGrid>
        {/* Reserve Fund */}
        {combinedHoldingsReserve &&
          tokenPrices &&
          Object.keys(combinedHoldingsReserve).map(contract => {
            const token = combinedHoldingsReserve[contract].current.currency.wrapped;
            const curAmount = new BigNumber(combinedHoldingsReserve[contract].current.toFixed(4));
            const prevAmount = new BigNumber(combinedHoldingsReserve[contract].past.toFixed(4));
            const percentageChange =
              prevAmount && curAmount.isGreaterThan(prevAmount)
                ? curAmount.div(prevAmount).minus(1).times(100).toNumber()
                : prevAmount && prevAmount.isGreaterThan(0)
                  ? curAmount.div(prevAmount).minus(1).times(100).toNumber()
                  : 0;

            totalCurrentReserve += curAmount.times(tokenPrices[token.symbol!]).toNumber();
            totalPastReserve += prevAmount.times(tokenPrices[token.symbol!]).toNumber();

            return (
              (curAmount.isGreaterThan(0) || prevAmount.isGreaterThan(0)) && (
                <BalanceGrid key={contract} minWidth={gridWidth}>
                  <GridItemToken>
                    <Flex alignItems="center">
                      <CurrencyLogoFromURI address={(token as Currency).wrapped.address} size="40px" />
                      <Box ml={2}>
                        <Text color="text">{token.name}</Text>
                        <Text color="text" opacity={0.75}>
                          {token.symbol}
                        </Text>
                      </Box>
                    </Flex>
                  </GridItemToken>
                  <GridItemToken>
                    <Text color="text">
                      {tokenPrices && tokenPrices[token.symbol!] && (
                        <DisplayValueOrLoader value={curAmount} currencyRate={tokenPrices[token.symbol!].toNumber()} />
                      )}

                      <Change percentage={percentageChange ?? 0}>
                        {prevAmount.isGreaterThan(0) &&
                          Math.abs(percentageChange) >= 0.01 &&
                          formatPercentage(percentageChange)}
                      </Change>
                    </Text>
                    <Text color="text" opacity={0.75}>
                      <DisplayValueOrLoader
                        value={curAmount}
                        currencyRate={1}
                        format={HIGH_PRICE_ASSET_DP[contract] ? 'number4' : 'number'}
                      />
                      {` ${token.symbol}`}
                    </Text>
                  </GridItemToken>
                  <GridItemToken>
                    <Text color="text">
                      {combinedHoldingsReserve ? (
                        combinedHoldingsReserve[contract].past.greaterThan(0) ? (
                          <DisplayValueOrLoader
                            value={prevAmount}
                            currencyRate={tokenPrices && tokenPrices[token.symbol!].toNumber()}
                          />
                        ) : (
                          '-'
                        )
                      ) : (
                        <StyledSkeleton width={120} />
                      )}
                    </Text>
                    <Text color="text" opacity={0.75}>
                      {combinedHoldingsReserve ? (
                        combinedHoldingsReserve[contract].past.greaterThan(0) ? (
                          <>
                            <DisplayValueOrLoader
                              value={prevAmount}
                              currencyRate={1}
                              format={HIGH_PRICE_ASSET_DP[contract] ? 'number4' : 'number'}
                            />
                            {` ${token.symbol}`}
                          </>
                        ) : null
                      ) : (
                        <StyledSkeleton width={120} />
                      )}
                    </Text>
                  </GridItemToken>
                </BalanceGrid>
              )
            );
          })}

        <BalanceGrid minWidth={gridWidth} className="border-top">
          <GridItemAssetTotal>Subtotal</GridItemAssetTotal>
          <GridItemAssetTotal>
            {combinedHoldingsReserve ? (
              <DisplayValueOrLoader value={totalCurrentReserve} currencyRate={1} />
            ) : (
              <StyledSkeleton width={120} />
            )}
          </GridItemAssetTotal>
          <GridItemAssetTotal>
            {combinedHoldingsReserve ? (
              <DisplayValueOrLoader value={totalPastReserve} currencyRate={1} />
            ) : (
              <StyledSkeleton width={120} />
            )}
          </GridItemAssetTotal>
        </BalanceGrid>

        {/* TOTALS */}
        <BalanceGrid minWidth={gridWidth} className="border-top" style={{ marginTop: '10px' }}>
          <GridItemAssetTotal>Total</GridItemAssetTotal>
          <GridItemAssetTotal>
            {holdingsCurrent ? (
              <DisplayValueOrLoader value={totalCurrent + totalCurrentPOL + totalCurrentReserve} currencyRate={1} />
            ) : (
              <StyledSkeleton width={120} />
            )}
          </GridItemAssetTotal>
          <GridItemAssetTotal>
            {holdingsPast ? (
              <DisplayValueOrLoader value={totalPast + totalPastPOL + totalPastReserve} currencyRate={1} />
            ) : (
              <StyledSkeleton width={120} />
            )}
          </GridItemAssetTotal>
        </BalanceGrid>
      </ScrollHelper>
    </BoxPanel>
  );
};

export default HoldingsSection;
