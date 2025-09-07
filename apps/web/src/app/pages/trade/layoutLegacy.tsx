import React from 'react';

import { Trans, t } from '@lingui/macro';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Flex } from 'rebass/styled-components';

import { Tab, Tabs } from '@/app/components/Tab';
import { Typography } from '@/app/theme';
import { useIconReact } from '@/packages/icon-react';
import { useFetchBBalnInfo, useFetchBBalnSources } from '@/store/bbaln/hooks';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchRewardsInfo } from '@/store/reward/hooks';
import { useFetchStabilityFundBalances } from '@/store/stabilityFund/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';
import styled from 'styled-components';
import { UnderlineText } from '@/app/components/DropdownText';
import { useMedia } from 'react-use';

export const StyledTypographyWithArrow = styled(Typography)`
  position: relative;
  padding-right: 12px;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    width: 7px;
    height: 1px;
    border-radius: 2px;
    background-color: currentColor;
    transform-origin: right;
  }
  
  &::before {
    transform: translateY(-50%) rotate(45deg);
    margin-top: 1px;
  }
  
  &::after {
    transform: translateY(-50%) rotate(-45deg);
    margin-top: 0.5px;
  }
`;

export function TradePageLayoutLegacy() {
  const { account } = useIconReact();
  const location = useLocation();
  const navigate = useNavigate();
  const isSmall = useMedia('(max-width: 550px)');

  useFetchPrice();
  useFetchBBalnSources(5000, true);
  useWalletFetchBalances();
  useFetchBBalnInfo(account);
  useFetchRewardsInfo();
  useFetchStabilityFundBalances();

  const [value, setValue] = React.useState<number>(
    location.pathname.includes('/supply') ? 1 : location.pathname.includes('/bridge') ? 2 : 0,
  );

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
    if (value === 0) {
      navigate('/trade-legacy', { replace: true });
    }
    if (value === 1) {
      navigate('/trade-legacy/supply', { replace: true });
    }
    if (value === 2) {
      navigate('/trade-legacy/bridge', { replace: true });
    }
  };

  const isLegacy = location.pathname.includes('trade-legacy');

  return (
    <Box flex={1}>
      <Flex mb={10} flexDirection="column">
        <Flex alignItems="center" justifyContent="space-between">
          <Tabs value={value} onChange={handleTabClick}>
            <Tab>
              <Trans>Swap</Trans>
            </Tab>
            <Tab>
              <Trans>Supply</Trans>
            </Tab>
            <Tab>
              <Trans>Bridge</Trans>
            </Tab>
          </Tabs>
          {!isSmall && (
            <a href={isLegacy ? '/trade' : '/trade-legacy'} style={{ textDecoration: 'none' }}>
              <UnderlineText>
                <StyledTypographyWithArrow color="primary">{t`Trade on ${isLegacy ? 'regular' : 'legacy'} exchange`}</StyledTypographyWithArrow>
              </UnderlineText>
            </a>
          )}
        </Flex>

        <Outlet />
      </Flex>
    </Box>
  );
}
