import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { useLocation, useHistory } from 'react-router-dom';
import { Flex, Box } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import BridgeActivity from 'app/components/bridge/BridgeActivity';
import BridgePanel from 'app/components/bridge/BridgePanel';
import { UnderlineText } from 'app/components/DropdownText';
import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import LiquidityPoolsPanel from 'app/components/trade/LiquidityPoolsPanel';
import LPPanel from 'app/components/trade/LPPanel';
import { PoolPanelContext } from 'app/components/trade/PoolPanelContext';
import SwapDescription from 'app/components/trade/SwapDescription';
import SwapPanel from 'app/components/trade/SwapPanel';
import { SectionPanel } from 'app/components/trade/utils';
import { useAvailablePairs, useBalances } from 'hooks/useV2Pairs';
import { useTransferAssetsModalToggle } from 'store/application/hooks';
import { useFetchBBalnInfo, useFetchBBalnSources } from 'store/bbaln/hooks';
import { useFetchOraclePrices } from 'store/oracle/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useFetchStabilityFundBalances } from 'store/stabilityFund/hooks';
import { useTrackedTokenPairs } from 'store/user/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

const BTPButton = styled(UnderlineText)`
  padding-right: 0 !important;
  font-size: 14px;
  padding-bottom: 5px;
  margin: 5px 0 20px;
  width: 250px;
  display: none;

  ${({ theme }) => theme.mediaWidth.upSmall`
    position: absolute;
    align-self: flex-end;
    transform: translate3d(0, 9px, 0);
    padding-bottom: 0;
    margin: 0;
    width: auto;
    display: block;
  `};

  ${({ theme }) =>
    css`
      color: ${theme.colors.primaryBright};
    `};
`;

export function TradePage() {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();
  const location = useLocation();
  const history = useHistory();

  useFetchPrice();
  useFetchOraclePrices();
  useFetchBBalnSources(5000, true);
  useWalletFetchBalances(account, accountArch);
  useFetchBBalnInfo(account);
  useFetchRewardsInfo();
  useFetchStabilityFundBalances();

  const [value, setValue] = React.useState<number>(
    location.pathname.includes('/supply') ? 1 : location.pathname.includes('/bridge') ? 2 : 0,
  );

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
    if (value === 0) {
      history.replace('/trade');
    }
    if (value === 1) {
      history.replace('/trade/supply');
    }
    if (value === 2) {
      history.replace('/trade/bridge');
    }
  };

  //handle wallet modal
  const toggleTransferAssetsModal = useTransferAssetsModalToggle();
  const trackedTokenPairs = useTrackedTokenPairs();

  const handleBTPButtonClick = () => {
    toggleTransferAssetsModal();
  };

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
          <BTPButton onClick={handleBTPButtonClick}>Transfer assets between blockchains (Legacy)</BTPButton>
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

          <TabPanel value={value} index={2}>
            <SectionPanel bg="bg2">
              <BridgePanel />
              <BridgeActivity />
            </SectionPanel>
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
