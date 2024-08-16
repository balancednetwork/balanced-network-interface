import React from 'react';

import { Trans } from '@lingui/macro';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Flex } from 'rebass/styled-components';

import { Tab, Tabs } from '@/app/components/Tab';
import { useIconReact } from '@/packages/icon-react';
import { useFetchBBalnInfo, useFetchBBalnSources } from '@/store/bbaln/hooks';
import { useFetchOraclePrices } from '@/store/oracle/hooks';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchRewardsInfo } from '@/store/reward/hooks';
import { useFetchStabilityFundBalances } from '@/store/stabilityFund/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';

export function TradePageLayout() {
  const { account } = useIconReact();
  const location = useLocation();
  const navigate = useNavigate();

  useFetchPrice();
  useFetchOraclePrices();
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
      navigate('/trade', { replace: true });
    }
    if (value === 1) {
      navigate('/trade/supply', { replace: true });
    }
    if (value === 2) {
      navigate('/trade/bridge', { replace: true });
    }
  };

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
        </Flex>

        <Outlet />
      </Flex>
    </Box>
  );
}
