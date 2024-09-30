import React from 'react';

import { useBorrowersInfo, useFundInfo, useLoanInfo } from '@/queries';
import dayjs from 'dayjs';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';

import { predefinedCollateralTypes } from '@/components/CollateralSelector/CollateralTypeList';
import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { ChartInfo, ChartInfoItem, ChartSection } from '@/sections/BALNSection/DistributionChart';
import { MAX_BOOST } from '@/sections/PairSection';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';

import QuestionHelper, { QuestionWrapper } from '@/components/QuestionHelper';
import { useDebtCeilings } from '@/queries/bnusd';
import { TimeFrame } from '../TimeFrameSelector';
import Chart from './Chart';

export default function BnUSDChart({
  selectedCollateral,
  selectedTimeFrame,
}: {
  selectedCollateral: string;
  selectedTimeFrame: TimeFrame;
}) {
  const loanInfo = useLoanInfo();
  const { data: borrowersInfo } = useBorrowersInfo();
  const { data: fundInfo } = useFundInfo();
  const { data: ceilingsData } = useDebtCeilings();

  const [userHovering, setUserHovering] = React.useState<boolean>(false);

  const [bnUSDHover, setBnUSDHover] = React.useState<number | undefined>();
  const [bnUSDLabel, setBnUSDLabel] = React.useState<string | undefined>();

  const [totalBnUSD, setTotalBnUSD] = React.useState<undefined | number>();
  const [bnUSDChange, setBnUSDChange] = React.useState<undefined | number>();

  const cbSetUserHovering = React.useCallback(bool => {
    setUserHovering(bool);
  }, []);

  const cbSetBnUSDHover = React.useCallback((value: number | undefined) => {
    setBnUSDHover(value);
  }, []);

  const cbSetBnUSDLabel = React.useCallback((value: string | undefined) => {
    setBnUSDLabel(value);
  }, []);

  const cbSetTotalBnUSD = React.useCallback((value: number | undefined) => {
    setTotalBnUSD(value);
  }, []);

  const cbSetBnUSDChange = React.useCallback((value: number | undefined) => {
    setBnUSDChange(value);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (!userHovering) {
      setBnUSDHover(totalBnUSD);
    }
  }, [bnUSDHover, totalBnUSD, userHovering]);

  const isSmall = useMedia('(max-width: 699px)');
  const isExtraSmall = useMedia('(max-width: 499px)');

  const bnUSDChangeContent =
    bnUSDChange === undefined ? (
      <LoaderComponent></LoaderComponent>
    ) : bnUSDChange >= 0 ? (
      <Typography fontSize={18} color="text">{`+ $${getFormattedNumber(bnUSDChange, 'number')}`}</Typography>
    ) : (
      <Typography fontSize={18} color="text">
        {getFormattedNumber(bnUSDChange, 'number').replace('-', '- $')}
      </Typography>
    );

  return (
    <ChartSection>
      <Flex flexDirection={['column', 'row']}>
        <Flex mr="auto" mb="3px" alignItems="center">
          <Typography variant="h3" mr="auto" mb="4px">
            Balanced Dollars
          </Typography>
        </Flex>
        <Typography variant="h3">
          {bnUSDHover ? getFormattedNumber(bnUSDHover || 0, 'number') : <LoaderComponent />} bnUSD
        </Typography>
      </Flex>

      <Typography variant="p" color="text2" mr="auto" mb="3px" fontSize={18}>
        {bnUSDLabel ? <>{bnUSDLabel}</> : <>{dayjs.utc().format('MMM D, YYYY')}</>}
      </Typography>

      <Box mb="15px">
        <Chart
          collateralTVLHover={bnUSDHover}
          collateralLabel={bnUSDLabel}
          selectedCollateral={selectedCollateral}
          selectedTimeFrame={selectedTimeFrame}
          setCollateralTVLHover={cbSetBnUSDHover}
          setCollateralLabel={cbSetBnUSDLabel}
          setTotalBnUSD={cbSetTotalBnUSD}
          setBnUSDChange={cbSetBnUSDChange}
          setUserHovering={cbSetUserHovering}
        ></Chart>
      </Box>

      {/* flexible footer */}
      <ChartInfo>
        {selectedCollateral === predefinedCollateralTypes.STABILITY_FUND ? (
          <>
            <ChartInfoItem border>
              <Flex>
                <Typography variant="p" fontSize="18px">
                  {fundInfo ? `${fundInfo.feeIn}% - ${fundInfo.feeOut}%` : <LoaderComponent />}
                </Typography>
                {fundInfo && (
                  <QuestionWrapper style={{ transform: 'translateY(1px)', marginLeft: '5px' }}>
                    <QuestionHelper
                      text={`Use the Stability Fund to swap approved assets 1:1 for bnUSD. If you trade the inverse, there's a ${fundInfo.feeOut}% fee.`}
                    />
                  </QuestionWrapper>
                )}
              </Flex>
              <Typography color="text1">Stability Fund fee</Typography>
            </ChartInfoItem>
            <ChartInfoItem>
              <Typography variant="p" fontSize="18px">
                {fundInfo ? getFormattedNumber(fundInfo.feesGenerated, 'price') : <LoaderComponent />}
              </Typography>
              <Typography color="text1">Earned past month</Typography>
            </ChartInfoItem>
          </>
        ) : selectedCollateral === predefinedCollateralTypes.ALL ? (
          <>
            <ChartInfoItem smaller border>
              <Typography variant="p" fontSize="18px">
                {borrowersInfo ? getFormattedNumber(borrowersInfo.total, 'number') : <LoaderComponent />}
              </Typography>
              <Typography color="text1">Borrowers</Typography>
            </ChartInfoItem>
            <ChartInfoItem smaller border={!isSmall || isExtraSmall}>
              <Typography variant="p" fontSize="18px">
                {ceilingsData ? `$${ceilingsData.total.toFormat(0)}` : <LoaderComponent />}
              </Typography>
              <Typography color="text1">Maximum limit</Typography>
            </ChartInfoItem>
            <ChartInfoItem
              smaller
              flex={isSmall ? null : 1}
              flexDirection="column"
              alignItems="center"
              width={isSmall ? '100%' : 'auto'}
            >
              {bnUSDChangeContent}
              <Typography color="text1">Past month</Typography>
            </ChartInfoItem>
          </>
        ) : (
          <>
            <ChartInfoItem border smaller>
              <Typography variant="p" fontSize="18px">
                {borrowersInfo ? (
                  getFormattedNumber(borrowersInfo[selectedCollateral] || 0, 'number')
                ) : (
                  <LoaderComponent />
                )}
              </Typography>
              <Typography color="text1">Borrowers</Typography>
            </ChartInfoItem>
            <ChartInfoItem smaller border={!isSmall || isExtraSmall}>
              <Typography variant="p" fontSize="18px">
                {ceilingsData ? (
                  `$${
                    ceilingsData.ceilings.find(item => item.symbol === selectedCollateral)?.ceiling.toFormat(0) || '0'
                  }`
                ) : (
                  <LoaderComponent />
                )}
              </Typography>
              <Typography color="text1">Maximum limit</Typography>
            </ChartInfoItem>
            <ChartInfoItem
              smaller
              flex={isSmall ? null : 1}
              flexDirection="column"
              alignItems="center"
              width={isSmall ? '100%' : 'auto'}
            >
              <Typography variant="p" fontSize="18px">
                {bnUSDChangeContent}
              </Typography>
              <Typography color="text1">Past month</Typography>
            </ChartInfoItem>
          </>
        )}
      </ChartInfo>
    </ChartSection>
  );
}
