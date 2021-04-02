import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { Flex, Box } from 'rebass/styled-components';

import { DefaultLayout } from 'app/components/Layout';
import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import LiquidityDetails from 'app/components/trade/LiquidityDetails';
import LPPanel from 'app/components/trade/LPPanel';
import ReturnICDSection from 'app/components/trade/ReturnICDSection';
import SwapPanel from 'app/components/trade/SwapPanel';
import { useFetchLiquidity } from 'store/liquidity/hooks';
import { useFetchPrice } from 'store/ratio/hooks';
import { useFetchReward } from 'store/reward/hooks';
import { useFetchBalance } from 'store/wallet/hooks';

export function TradePage() {
  //const { account } = useIconReact();
  const account = 'hxdf7c371a35b4acb19d9f869a68eed8721503eaea';

  useFetchPrice();
  useFetchBalance(account);
  useFetchLiquidity(account);
  useFetchReward(account);

  const [value, setValue] = React.useState<number>(0);

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
  };

  // update the width on a window resize
  const ref = React.useRef<HTMLDivElement>();
  const [width, setWidth] = React.useState(ref?.current?.clientWidth);
  React.useEffect(() => {
    function handleResize() {
      setWidth(ref?.current?.clientWidth ?? width);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  return (
    <DefaultLayout title="Trade">
      <Helmet>
        <title>Trade</title>
      </Helmet>

      <Box flex={1}>
        <Flex mb={10} flexDirection="column">
          <Flex alignItems="center" justifyContent="space-between">
            <Tabs value={value} onChange={handleTabClick}>
              <Tab>Swap</Tab>
              <Tab>Supply liquidity</Tab>
            </Tabs>

            <ReturnICDSection />
          </Flex>

          <TabPanel value={value} index={0}>
            <SwapPanel />
          </TabPanel>

          <TabPanel value={value} index={1}>
            <LPPanel />
          </TabPanel>
        </Flex>

        <LiquidityDetails />
      </Box>
    </DefaultLayout>
  );
}
