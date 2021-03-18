import React from 'react';

import BigNumber from 'bignumber.js';
import { IconBuilder } from 'icon-sdk-js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact, DEX_ADDRESS, BALN_ADDRESS, sICXbnUSDpoolId } from 'packages/icon-react';
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
import { useChangeRatio } from 'store/ratio/hooks';

export function TradePage() {
  const { account, iconService } = useIconReact();
  const changeRatio = useChangeRatio();
  const changeLiquiditySupply = useChangeLiquiditySupply();

  const [value, setValue] = React.useState<number>(0);

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
  };

  // get sICX:bnUSD ratio
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('getPrice')
        .params({ _pid: sICXbnUSDpoolId.toString() })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const sICXbnUSDratio = convertLoopToIcx(result);
          changeRatio({ sICXbnUSDratio: sICXbnUSDratio });
        });
    }
  }, [changeRatio, account, iconService]);

  /** get liquidity sICX:bnUSD supply
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('balanceOf')
        .params({ _owner: account, _id: sICXbnUSDpoolId })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const sICXbnUSDsupply = convertLoopToIcx(result);

          changeLiquiditySupply({ sICXbnUSDsupply: sICXbnUSDsupply });
        });
    }
  }, [changeLiquiditySupply, account]);

  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('getDeposit')
        .params({ _user: account, _tokenAddress: bnUSD_ADDRESS })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const bnUSDsupply = convertLoopToIcx(result);

          changeLiquiditySupply({ bnUSDsupply: bnUSDsupply });
        });
    }
  }, [changeLiquiditySupply, account]);
  **/

  // get liquidity supply

  const initLiquiditySupply = React.useCallback(() => {
    if (account) {
      Promise.all([
        bnJs.Dex.getPoolTotal(BalancedJs.utils.sICXbnUSDpoolId.toString(), bnJs.sICX.address),
        bnJs.Dex.getPoolTotal(BalancedJs.utils.sICXbnUSDpoolId.toString(), bnJs.bnUSD.address),
        bnJs.Dex.getSupply(BalancedJs.utils.sICXbnUSDpoolId.toString()),
        bnJs.Dex.getTotalSupply(BalancedJs.utils.sICXbnUSDpoolId.toString()),
      ]).then(result => {
        const [sICXsupply, bnUSDsupply, sICXbnUSDsupply, sICXbnUSDtotalSupply] = result.map(v =>
          convertLoopToIcx(v as BigNumber),
        );
        changeLiquiditySupply({ sICXsupply });
        changeLiquiditySupply({ bnUSDsupply });
        changeLiquiditySupply({ sICXbnUSDsupply });
        changeLiquiditySupply({ sICXbnUSDtotalSupply });
      });
    }
  }, [account, changeLiquiditySupply]);

  React.useEffect(() => {
    initLiquiditySupply();
  }, [initLiquiditySupply]);

  /*React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('balanceOf')
        .params({ _owner: account, _id: BALN_ADDRESS })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const sICXbnUSDsupply = convertLoopToIcx(result);

          changeLiquiditySupply({ sICXbnUSDsupply: sICXbnUSDsupply });
        });
    }
  }, [changeLiquiditySupply, account, iconService]);*/

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
