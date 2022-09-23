import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';

import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import LiquidityPoolsPanel from 'app/components/trade/LiquidityPoolsPanel';
import LPPanel from 'app/components/trade/LPPanel';
import { PoolPanelContext } from 'app/components/trade/PoolPanelContext';
import SwapDescription from 'app/components/trade/SwapDescription';
import SwapPanel from 'app/components/trade/SwapPanel';
import { SectionPanel } from 'app/components/trade/utils';
import { useAvailablePairs, useBalances } from 'hooks/useV2Pairs';
import { useFetchOraclePrices } from 'store/oracle/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useFetchStabilityFundBalances } from 'store/stabilityFund/hooks';
import { useTrackedTokenPairs } from 'store/user/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

export function TradePage() {
  const { account } = useIconReact();

  useFetchPrice();
  useFetchOraclePrices();
  useWalletFetchBalances(account);
  useFetchRewardsInfo();
  useFetchStabilityFundBalances();

  const [value, setValue] = React.useState<number>(0);

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
  };

  const trackedTokenPairs = useTrackedTokenPairs();

  // fetch the reserves for all V2 pools
  const pairs = useAvailablePairs(trackedTokenPairs);

  // fetch the user's balances of all tracked V2 LP tokens
  const balances = useBalances(account, pairs);

  const data = useMemo(
    () => ({
      trackedTokenPairs,
      pairs,
      balances,
    }),
    [trackedTokenPairs, pairs, balances],
  );

  return (
    <>
      <Box flex={1}>
        <Flex mb={10} flexDirection="column">
          <Flex alignItems="center" justifyContent="space-between">
            <Tabs value={value} onChange={handleTabClick}>
              <Tab>
                <Trans>Swap</Trans>
              </Tab>
              <Tab>
                <Trans>Supply liquidity</Trans>
              </Tab>
            </Tabs>
          </Flex>

          <TabPanel value={value} index={0}>
            <SectionPanel bg="bg2">
              <SwapPanel />
              <SwapDescription />
            </SectionPanel>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <PoolPanelContext.Provider value={data}>
              <LPPanel />
            </PoolPanelContext.Provider>
          </TabPanel>
        </Flex>

        {value === 1 && (
          <PoolPanelContext.Provider value={data}>
            <LiquidityPoolsPanel />
          </PoolPanelContext.Provider>
        )}
      </Box>
    </>
  );
}
