import React, { useMemo } from 'react';

import { useBorrowersInfo, useCollateralInfo, useLoanInfo, useStakingAPR } from '@/queries';
import { useDebtDataFor, useTokenPrices } from '@/queries/backendv2';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import CollateralSelector from '@/components/CollateralSelector';
import { predefinedCollateralTypes } from '@/components/CollateralSelector/CollateralTypeList';
import { ONE } from '@/constants/number';
import useWidth from '@/hooks/useWidth';
import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { ChartInfo, ChartInfoItem, ChartSection } from '@/sections/BALNSection/DistributionChart';
import { useStabilityFundTotal, useSupportedCollateralTokens } from '@/store/collateral/hooks';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';

import { TimeFrame } from '../TimeFrameSelector';
import Chart from './Chart';

const CollateralControlWrap = styled(Flex)`
  flex-direction: row;
  align-items: center;
`;

const SelectorsWrap = styled(Flex)`
  margin: 5px 0 !important;
  padding-bottom: 6px;
  padding-top: 4px;
  @media screen and (min-width: 500px) {
    margin: 0 !important;
  }
`;

export default function CollateralChart({
  selectedCollateral,
  selectedTimeFrame,
  setCollateral,
}: {
  selectedCollateral: string;
  selectedTimeFrame: TimeFrame;
  setCollateral: (string) => void;
}) {
  const { data: collateralInfo } = useCollateralInfo();
  const { data: stakingAPR } = useStakingAPR();
  const loanInfo = useLoanInfo();
  const { data: borrowersInfo } = useBorrowersInfo();
  const { data: supportedCollaterals } = useSupportedCollateralTokens();
  const stabilityFundTotal = useStabilityFundTotal();
  const { data: tokenPrices } = useTokenPrices();
  const { data: debtData } = useDebtDataFor(365);

  const [collateralTVLHover, setCollateralTVLHover] = React.useState<number | undefined>();
  const [collateralLabel, setCollateralLabel] = React.useState<string | undefined>();

  const [userHovering, setUserHovering] = React.useState<boolean>(false);

  const [totalCollateral, setTotalCollateral] = React.useState<undefined | number>();
  const [collateralChange, setCollateralChange] = React.useState<undefined | number>();

  const collateralTokenPrice = useMemo(() => {
    if (
      selectedCollateral === predefinedCollateralTypes.STABILITY_FUND ||
      selectedCollateral === predefinedCollateralTypes.ALL
    ) {
      return new BigNumber(1);
    }
    return tokenPrices?.[selectedCollateral];
  }, [selectedCollateral, tokenPrices]);

  const collateralTVLInUSDHover = useMemo(
    () =>
      getFormattedNumber(
        new BigNumber(collateralTVLHover || '0')
          .times(collateralTokenPrice || ONE)
          .integerValue()
          .toNumber(),
        'currency0',
      ),

    [collateralTokenPrice, collateralTVLHover],
  );

  //update chart collateral amount and value if user is not hovering over the chart
  React.useEffect(() => {
    if (!userHovering && collateralInfo) {
      if (selectedCollateral === predefinedCollateralTypes.ALL) {
        setCollateralTVLHover(collateralInfo.collateralData.current.total.value);
      } else if (selectedCollateral === predefinedCollateralTypes.STABILITY_FUND) {
        setCollateralTVLHover(collateralInfo.collateralData.current.fundTotal.value);
      } else {
        if (collateralInfo.collateralData.current[selectedCollateral]) {
          setCollateralTVLHover(collateralInfo.collateralData.current[selectedCollateral].amount);
        }
      }
    }
  }, [collateralInfo, selectedCollateral, userHovering]);

  const collateralChangeContent =
    collateralTokenPrice &&
    (collateralChange === undefined ? (
      <LoaderComponent></LoaderComponent>
    ) : collateralChange >= 0 ? (
      <Typography
        fontSize={18}
        color="text"
      >{`+ $${getFormattedNumber(collateralTokenPrice.times(collateralChange).toNumber() || 0, 'number')}`}</Typography>
    ) : (
      <Typography fontSize={18} color="text">
        {getFormattedNumber(collateralTokenPrice.times(collateralChange).toNumber() || 0, 'number').replace('-', '- $')}
      </Typography>
    ));

  const selectedCollateralDebt = useMemo(() => {
    return debtData?.[selectedCollateral];
  }, [debtData, selectedCollateral]);

  const collateralRatio = useMemo(() => {
    if (
      totalCollateral &&
      collateralTokenPrice &&
      selectedCollateralDebt &&
      selectedCollateralDebt[selectedCollateralDebt.length - 1]
    ) {
      const valueNow = selectedCollateralDebt[selectedCollateralDebt.length - 1].value;

      return collateralTokenPrice.times(totalCollateral).div(valueNow);
    }
  }, [totalCollateral, collateralTokenPrice, selectedCollateralDebt]);

  const [ref, width] = useWidth();
  const isSmall = useMedia('(max-width: 699px)');
  const isExtraSmall = useMedia('(max-width: 499px)');

  return (
    <ChartSection border>
      <Flex flexDirection={['column', 'row']} ref={ref}>
        <Flex mr="auto" flexDirection="column" alignItems="center">
          <CollateralControlWrap mb={1}>
            <Typography variant="h3" mr={2} mb="2px">
              Collateral
            </Typography>
            {/* <SelectorsWrap> */}
            <CollateralSelector
              width={width}
              containerRef={ref.current}
              collateral={selectedCollateral === 'sICX' ? 'ICON' : selectedCollateral}
              setCollateral={setCollateral}
            />
            {/* </SelectorsWrap> */}
          </CollateralControlWrap>
        </Flex>
        <Typography variant="h3">{collateralInfo && collateralTVLHover && `${collateralTVLInUSDHover}`}</Typography>
      </Flex>

      <Flex mb={1}>
        <Typography variant="p" color="text2" fontSize={18}>
          {collateralLabel ? <>{collateralLabel}</> : <>{dayjs.utc().format('MMM D, YYYY')}</>}
        </Typography>
        {selectedCollateral !== predefinedCollateralTypes.ALL &&
          selectedCollateral !== predefinedCollateralTypes.STABILITY_FUND && (
            <Typography ml="auto" variant="p" color="text2" fontSize={18}>
              {collateralTVLHover &&
                `${getFormattedNumber(
                  collateralTVLHover,
                  collateralTVLHover > 100 ? 'number' : 'number4',
                )} ${selectedCollateral}`}
            </Typography>
          )}
      </Flex>
      <Box mb="15px">
        <Chart
          selectedCollateral={selectedCollateral}
          collateralTVLHover={collateralTVLHover}
          collateralLabel={collateralLabel}
          selectedTimeFrame={selectedTimeFrame}
          setCollateralTVLHover={setCollateralTVLHover}
          setCollateralLabel={setCollateralLabel}
          setUserHovering={setUserHovering}
          setCollateralChange={setCollateralChange}
          setTotalCollateral={setTotalCollateral}
        ></Chart>
      </Box>

      {/* Flexible chart footer */}
      <ChartInfo>
        {selectedCollateral === 'All' ? (
          <>
            <ChartInfoItem smaller border>
              <Typography variant="p" fontSize="18px">
                {supportedCollaterals ? Object.keys(supportedCollaterals).length + 1 : <LoaderComponent />}
              </Typography>
              <Typography color="text1">Collateral types</Typography>
            </ChartInfoItem>
            <ChartInfoItem smaller border={!isSmall || isExtraSmall}>
              <Typography variant="p" fontSize="18px">
                {totalCollateral && loanInfo.totalBnUSD ? (
                  getFormattedNumber(totalCollateral / loanInfo.totalBnUSD, 'percent0')
                ) : (
                  <LoaderComponent />
                )}
              </Typography>
              <Typography color="text1">Collateral ratio</Typography>
            </ChartInfoItem>
            <ChartInfoItem
              smaller
              flex={isSmall ? null : 1}
              flexDirection="column"
              alignItems="center"
              width={isSmall ? '100%' : 'auto'}
            >
              {collateralChangeContent}
              <Typography color="text1">Past month</Typography>
            </ChartInfoItem>
          </>
        ) : selectedCollateral === 'Stability Fund' ? (
          <>
            <ChartInfoItem border>
              <Typography variant="p" fontSize="18px">
                {stabilityFundTotal ? stabilityFundTotal.tokenCount : <LoaderComponent />}
              </Typography>
              <Typography color="text1">Stablecoins</Typography>
            </ChartInfoItem>
            <ChartInfoItem flex={1} flexDirection="column" alignItems="center">
              <Typography variant="p" fontSize="18px">
                {stabilityFundTotal ? `$${stabilityFundTotal.maxLimit?.toFormat(0)}` : <LoaderComponent />}
              </Typography>
              <Typography color="text1">Maximum limit</Typography>
            </ChartInfoItem>
          </>
        ) : (
          <>
            <ChartInfoItem smaller border>
              <Typography variant="p" fontSize="18px">
                {collateralTokenPrice ? (
                  `$${collateralTokenPrice.toFormat(collateralTokenPrice.isGreaterThan(100) ? 0 : collateralTokenPrice.isLessThan(1) ? 4 : 2)}`
                ) : (
                  <LoaderComponent />
                )}
              </Typography>
              <Typography color="text1">{selectedCollateral} price</Typography>
            </ChartInfoItem>
            <ChartInfoItem smaller border={!isSmall || isExtraSmall}>
              {selectedCollateral === 'sICX' ? (
                <>
                  <Typography variant="p" fontSize="18px">
                    {stakingAPR ? getFormattedNumber(stakingAPR.toNumber(), 'percent2') : <LoaderComponent />}
                  </Typography>
                  <Typography color="text1">Staking APR</Typography>
                </>
              ) : (
                <>
                  <Typography variant="p" fontSize="18px">
                    {collateralRatio ? getFormattedNumber(collateralRatio.toNumber(), 'percent0') : <LoaderComponent />}
                  </Typography>
                  <Typography color="text1">Collateral ratio</Typography>
                </>
              )}
            </ChartInfoItem>
            <ChartInfoItem
              smaller
              flex={isSmall ? null : 1}
              flexDirection="column"
              alignItems="center"
              width={isSmall ? '100%' : 'auto'}
            >
              {collateralChangeContent}
              <Typography color="text1">Past month</Typography>
            </ChartInfoItem>
          </>
        )}
      </ChartInfo>
    </ChartSection>
  );
}
