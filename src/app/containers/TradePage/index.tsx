import React from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { UnderlineText } from 'app/components/DropdownText';
import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import LiquidityDetails from 'app/components/trade/LiquidityDetails';
import LPPanel from 'app/components/trade/LPPanel';
import SwapDescription from 'app/components/trade/SwapDescription';
import SwapPanel from 'app/components/trade/SwapPanel';
import { SectionPanel } from 'app/components/trade/utils';
import { useTransferAssetsModalToggle } from 'store/application/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

const BTPButton = styled(UnderlineText)`
  padding-right: 0 !important;
  font-size: 14px;
  padding-bottom: 5px;
  margin: 5px 0 20px;
  width: 250px;

  ${({ theme }) => theme.mediaWidth.upSmall`
    position: absolute;
    align-self: flex-end;
    transform: translate3d(0, 9px, 0);
    padding-bottom: 0;
    margin: 0;
    width: auto;
  `};

  ${({ theme }) =>
    css`
      color: ${theme.colors.primaryBright};
    `};
`;

export function TradePage() {
  const { account } = useIconReact();

  useFetchPrice();
  useWalletFetchBalances(account);
  useFetchRewardsInfo();

  const [value, setValue] = React.useState<number>(0);

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
  };

  //handle wallet modal
  const toggleTransferAssetsModal = useTransferAssetsModalToggle();

  return (
    <>
      <Box flex={1}>
        <Flex mb={10} flexDirection="column">
          <BTPButton onClick={toggleTransferAssetsModal}>Transfer assets between blockchains</BTPButton>
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
