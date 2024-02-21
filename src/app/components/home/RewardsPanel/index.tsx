import React from 'react';

import { Trans, t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Flex } from 'rebass';
import styled from 'styled-components';

import Divider, { VerticalDivider } from 'app/components/Divider';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { useEarnedPastMonth } from 'store/reward/hooks';

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
  const { data: earnedPastMonth } = useEarnedPastMonth();

  return (
    <StyledBoxPanel bg="bg3">
      <Flex mb="30px" alignItems="center" flexWrap="wrap" justifyContent="space-between">
        <Typography variant="h2">Rewards</Typography>
        {account && (
          <Typography color="text1" fontSize={14} pt="9px">
            <Trans>Earned</Trans> <strong>{`$${earnedPastMonth?.toFormat(2)}`}</strong> <Trans>in the past month</Trans>
          </Typography>
        )}
      </Flex>
      <Flex flexDirection={isMedium ? 'column' : 'row'}>
        <SliderWrap>
          <Savings />
        </SliderWrap>
        {isMedium ? <Divider my="30px" /> : <VerticalDivider margin={'3px 50px'} />}
        <SliderWrap>
          <BBalnSlider
            title={t`Earning power`}
            titleVariant="h4"
            showMaxRewardsNotice
            sliderMargin="15px 0 0"
            simple
            showGlobalTooltip={showGlobalTooltip}
            setGlobalTooltip={setGlobalTooltip}
          />
        </SliderWrap>
      </Flex>
      <BoxPanel bg="bg2" mt="35px" style={{ padding: '17px 20px' }}>
        <Flex flexWrap={isSmall ? 'wrap' : 'nowrap'}>
          <SavingsRewards />
          {!isSmall ? <VerticalDivider margin={'3px 30px'} /> : <Divider width="100%" my={4} />}
          <LPRewards showGlobalTooltip={showGlobalTooltip} />
          {!isSmall ? <VerticalDivider margin={'3px 30px'} /> : <Divider width="100%" my={4} />}
          <NetworkFeesReward showGlobalTooltip={showGlobalTooltip} />
        </Flex>
      </BoxPanel>
    </StyledBoxPanel>
  );
};

export default RewardsPanel;
