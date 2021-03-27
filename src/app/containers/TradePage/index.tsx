import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Helmet } from 'react-helmet-async';
import { Flex, Box } from 'rebass/styled-components';

import { DefaultLayout } from 'app/components/Layout';
import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import LiquidityDetails from 'app/components/trade/LiquidityDetails';
import LPPanel from 'app/components/trade/LPPanel';
import ReturnICDSection from 'app/components/trade/ReturnICDSection';
import SwapPanel from 'app/components/trade/SwapPanel';
import bnJs from 'bnJs';
import { useChangeLiquiditySupply } from 'store/liquidity/hooks';

export function TradePage() {
  const { account } = useIconReact();
  const changeLiquiditySupply = useChangeLiquiditySupply();

  const [value, setValue] = React.useState<number>(0);

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
  };

  const calculateTokenSupplied = (balance: BigNumber, poolTotal: BigNumber, totalSupply: BigNumber) => {
    let tokenSupplied = balance
      .multipliedBy(poolTotal)
      .multipliedBy(new BigNumber(1).minus(balance.dividedBy(totalSupply)))
      .dividedBy(totalSupply);
    if (tokenSupplied.isNaN()) tokenSupplied = new BigNumber(0);
    return tokenSupplied;
  };

  // get liquidity supply

  const initLiquiditySupply = React.useCallback(() => {
    if (account) {
      Promise.all([
        bnJs.Dex.getPoolTotal(BalancedJs.utils.sICXbnUSDpoolId.toString(), bnJs.sICX.address),
        bnJs.Dex.getPoolTotal(BalancedJs.utils.sICXbnUSDpoolId.toString(), bnJs.bnUSD.address),
        bnJs.Dex.balanceOf(BalancedJs.utils.sICXbnUSDpoolId.toString()),
        bnJs.Dex.getTotalSupply(BalancedJs.utils.sICXbnUSDpoolId.toString()),

        bnJs.Dex.getPoolTotal(BalancedJs.utils.BALNbnUSDpoolId.toString(), bnJs.Baln.address),
        bnJs.Dex.getPoolTotal(BalancedJs.utils.BALNbnUSDpoolId.toString(), bnJs.bnUSD.address),
        bnJs.Dex.balanceOf(BalancedJs.utils.BALNbnUSDpoolId.toString()),
        bnJs.Dex.getTotalSupply(BalancedJs.utils.BALNbnUSDpoolId.toString()),

        bnJs.Dex.getTotalSupply(BalancedJs.utils.sICXICXpoolId.toString()),
        bnJs.eject({ account: account }).Dex.getICXBalance(),
      ]).then(result => {
        const [
          sICXPoolsICXbnUSDTotal, // sm method `getPoolTotal`
          bnUSDPoolsICXbnUSDTotal, // sm method `getPoolTotal`
          sICXbnUSDBalance, // sm method `balanceOf`
          sICXbnUSDTotalSupply, // sm method `totalSupply` pool sICXbnUSDpoolId

          BALNPoolBALNbnUSDTotal,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDBalance,
          BALNbnUSDTotalSupply,

          sICXICXTotalSupply, // sm method `totalSupply` pool sICXICXpoolId
          ICXBalance,
        ] = result.map(v => convertLoopToIcx(v as BigNumber));
        const sICXSuppliedPoolsICXbnUSD = calculateTokenSupplied(
          sICXbnUSDBalance,
          sICXPoolsICXbnUSDTotal,
          sICXbnUSDTotalSupply,
        );
        const bnUSDSuppliedPoolsICXbnUSD = calculateTokenSupplied(
          sICXbnUSDBalance,
          bnUSDPoolsICXbnUSDTotal,
          sICXbnUSDTotalSupply,
        );

        const BALNSuppliedPoolBALNbnUSD = calculateTokenSupplied(
          BALNbnUSDBalance,
          BALNPoolBALNbnUSDTotal,
          BALNbnUSDTotalSupply,
        );
        const bnUSDSuppliedPoolBALNbnUSD = calculateTokenSupplied(
          BALNbnUSDBalance,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDTotalSupply,
        );

        console.log('sICXSuppliedPoolsICXbnUSD = ', sICXSuppliedPoolsICXbnUSD.toFixed(2));
        console.log('bnUSDSuppliedPoolsICXbnUSD = ', bnUSDSuppliedPoolsICXbnUSD.toFixed(2));
        console.log('BALNSuppliedPoolBALNbnUSD = ', BALNSuppliedPoolBALNbnUSD.toFixed(2));
        console.log('bnUSDSuppliedPoolBALNbnUSD = ', bnUSDSuppliedPoolBALNbnUSD.toFixed(2));

        changeLiquiditySupply({
          sICXPoolsICXbnUSDTotal,
          bnUSDPoolsICXbnUSDTotal,
          sICXbnUSDBalance,
          sICXbnUSDTotalSupply,

          BALNPoolBALNbnUSDTotal,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDBalance,
          BALNbnUSDTotalSupply,

          sICXSuppliedPoolsICXbnUSD,
          bnUSDSuppliedPoolsICXbnUSD,

          BALNSuppliedPoolBALNbnUSD,
          bnUSDSuppliedPoolBALNbnUSD,

          sICXICXTotalSupply,
          ICXBalance,
        });
      });
    }
  }, [account, changeLiquiditySupply]);

  React.useEffect(() => {
    initLiquiditySupply();
  }, [initLiquiditySupply]);

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
