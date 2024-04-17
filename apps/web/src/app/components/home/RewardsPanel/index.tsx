import React from 'react';

import { Trans, t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Flex } from 'rebass';
import styled from 'styled-components';

import Divider, { VerticalDivider } from 'app/components/Divider';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { useHasAnyKindOfRewards } from 'store/reward/hooks';

import BBalnSlider from '../BBaln/BBalnSlider';
import Savings from '../Savings';
import LPRewards from './LPRewards';
import NetworkFeesReward from './NetworkFeesRewards';
import SavingsRewards from './SavingsRewards';

export const StyledBoxPanel = styled(BoxPanel)`
  ${({ theme }) => theme.mediaWidth.upMedium`
    grid-column: span 2;
  `}
`;

const SliderWrap = styled(Flex)`
  flex-direction: column;
  width: 100%;

  h4 {
    padding-top: 5px;
  }
`;

const RewardsPanel = () => {
  const [showGlobalTooltip, setGlobalTooltip] = React.useState(false);
  const isMedium = useMedia('(max-width: 1050px)');
  const isSmall = useMedia('(max-width: 800px)');
  const { account } = useIconReact();
  const hasAnyKindOfRewards = useHasAnyKindOfRewards();
  // // const { data: earnedPastMonth } = useEarnedPastMonth();

  const handleSetGlobalTooltip = React.useCallback(
    (shouldShow: boolean) => {
      setGlobalTooltip(shouldShow);
    },
    [setGlobalTooltip],
  );

  return (
    <StyledBoxPanel bg="bg3">
      <Flex mb="30px" alignItems="center" flexWrap="wrap" justifyContent="space-between">
        <Typography variant="h2" mr={6}>
          Rewards
        </Typography>
        {/* {account && (
          <Typography color="text1" fontSize={14} pt="9px">
            <Trans>Earned</Trans> <strong>{`$${earnedPastMonth?.toFormat(2)}`}</strong> <Trans>in the past month</Trans>
          </Typography>
        )} */}
      </Flex>
      <Flex flexDirection={isMedium ? 'column' : 'row'}>
        <SliderWrap>
          <Savings />
        </SliderWrap>
        {isMedium ? <Divider my="30px" /> : <VerticalDivider margin={'3px 50px'} />}
        <SliderWrap>
          <BBalnSlider
            title={t`Earning potential`}
            titleVariant="h4"
            showMaxRewardsNotice
            sliderMargin="15px 0 0"
            simple
            showGlobalTooltip={showGlobalTooltip}
            setGlobalTooltip={handleSetGlobalTooltip}
          />
        </SliderWrap>
      </Flex>
      <BoxPanel bg="bg2" mt="35px" style={{ padding: '17px 20px' }}>
        {account && hasAnyKindOfRewards ? (
          <Flex flexWrap={isSmall ? 'wrap' : 'nowrap'}>
            <SavingsRewards />
            {!isSmall ? (
              <VerticalDivider margin={isMedium ? '3px 15px' : '3px 30px'} />
            ) : (
              <Divider width="100%" my={4} />
            )}
            <LPRewards showGlobalTooltip={showGlobalTooltip} />
            {!isSmall ? (
              <VerticalDivider margin={isMedium ? '3px 15px' : '3px 30px'} />
            ) : (
              <Divider width="100%" my={4} />
            )}
            <NetworkFeesReward showGlobalTooltip={showGlobalTooltip} />
          </Flex>
        ) : (
          <Typography textAlign="center" fontSize={14} opacity={0.75}>
            <Trans>To earn rewards: supply liquidity, deposit bnUSD into the savings rate, or lock up BALN.</Trans>
          </Typography>
        )}
      </BoxPanel>
    </StyledBoxPanel>
  );
};

export default RewardsPanel;
