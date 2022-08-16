import React from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';

import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import LiquidityDetails from 'app/components/trade/LiquidityDetails';
import LPPanel from 'app/components/trade/LPPanel';
import SwapDescription from 'app/components/trade/SwapDescription';
import SwapPanel from 'app/components/trade/SwapPanel';
import { SectionPanel } from 'app/components/trade/utils';
import { useFetchOraclePrices } from 'store/oracle/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useFetchStabilityFundBalances } from 'store/stabilityFund/hooks';
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
            <LPPanel />
          </TabPanel>
        </Flex>

        {account && value === 1 && <LiquidityDetails />}
      </Box>
    </>
  );
}
