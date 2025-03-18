import React from 'react';

import { useIconReact } from '@/packages/icon-react';
import { Trans, t } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Flex } from 'rebass';
import styled from 'styled-components';

import Divider, { VerticalDivider } from '@/app/components/Divider';
import { BoxPanel } from '@/app/components/Panel';
import { Typography } from '@/app/theme';
import { useHasAnyKindOfRewards } from '@/store/reward/hooks';

import useWidth from '@/hooks/useWidth';
import { useSavingsXChainId } from '@/store/savings/hooks';
import { getNetworkDisplayName, getXChainType, useXAccount } from '@balancednetwork/xwagmi';
import BBalnSlider from '../BBaln/BBalnSlider';
import Savings from '../Savings';
import SavingsChainSelector from '../_components/SavingsChainSelector';
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

  const savingsXChainId = useSavingsXChainId();

  const account = useXAccount(getXChainType(savingsXChainId));
  const hasAnyKindOfRewards = useHasAnyKindOfRewards(savingsXChainId);

  const handleSetGlobalTooltip = React.useCallback((shouldShow: boolean) => {
    setGlobalTooltip(shouldShow);
  }, []);

  const [rewardsHeaderRef, rewardsHeaderWidth] = useWidth();

  return (
    <StyledBoxPanel bg="bg3">
      <Flex
        mb="30px"
        maxWidth={'400px'}
        alignItems="flex-end"
        flexWrap="wrap"
        justifyContent="justify-start"
        ref={rewardsHeaderRef}
      >
        <Typography variant="h2" mr={1} lineHeight={1.2}>
          Rewards
        </Typography>
        <SavingsChainSelector width={rewardsHeaderWidth} containerRef={rewardsHeaderRef.current} />
      </Flex>
      <Flex flexDirection={isMedium ? 'column' : 'row'}>
        <SliderWrap>
          <Savings />
        </SliderWrap>
        {isMedium ? <Divider my="30px" /> : <VerticalDivider $margin={'3px 50px'} />}
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
      <BoxPanel bg="bg2" mt="35px" style={{ padding: '17px 20px' }} className="drop-shadow-inset">
        {savingsXChainId === 'archway-1' || savingsXChainId === '0x100.icon' ? (
          <Typography textAlign="center" fontSize={14} opacity={0.75}>
            <Trans>No rewards available on {getNetworkDisplayName(savingsXChainId)}.</Trans>
          </Typography>
        ) : account.address && hasAnyKindOfRewards ? (
          <Flex flexWrap={isSmall ? 'wrap' : 'nowrap'}>
            <SavingsRewards />
            {!isSmall ? (
              <VerticalDivider $margin={isMedium ? '3px 15px' : '3px 30px'} />
            ) : (
              <Divider width="100%" my={4} />
            )}
            <LPRewards showGlobalTooltip={showGlobalTooltip} />
            {!isSmall ? (
              <VerticalDivider $margin={isMedium ? '3px 15px' : '3px 30px'} />
            ) : (
              <Divider width="100%" my={4} />
            )}
            <NetworkFeesReward showGlobalTooltip={showGlobalTooltip} />
          </Flex>
        ) : (
          <>
            {savingsXChainId === '0x1.icon' ? (
              <Typography textAlign="center" fontSize={14} opacity={0.75}>
                <Trans>
                  To earn rewards on ICON: supply liquidity, deposit bnUSD into the Savings Rate, or lock up BALN.
                </Trans>
              </Typography>
            ) : (
              <Typography textAlign="center" fontSize={14} opacity={0.75}>
                <Trans>
                  To earn rewards on {getNetworkDisplayName(savingsXChainId)}, supply liquidity or deposit bnUSD into
                  the Savings Rate.
                </Trans>
              </Typography>
            )}
          </>
        )}
      </BoxPanel>
    </StyledBoxPanel>
  );
};

export default RewardsPanel;
