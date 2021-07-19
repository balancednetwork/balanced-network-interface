import React from 'react';

import { Tabs, TabPanels, TabPanel } from '@reach/tabs';
import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';

import Divider from 'app/components/Divider';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';

import SendPanel from './SendPanel';
import { StyledTabList, StyledTab, Grid } from './utils';

export default function ICXWallet() {
  const { account } = useIconReact();

  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabsChange = index => {
    setTabIndex(index);
  };

  const [unstakingAmount, setUnstakingAmount] = React.useState<BigNumber>(new BigNumber(0));

  React.useEffect(() => {
    const fetchUserUnstakeInfo = async () => {
      if (account) {
        const result: Array<{ amount: string }> = await bnJs.Staking.getUserUnstakeInfo(account);
        setUnstakingAmount(
          result
            .map(record => BalancedJs.utils.toIcx(new BigNumber(record['amount'], 16)))
            .reduce((sum, cur) => sum.plus(cur), new BigNumber(0)),
        );
      }
    };

    fetchUserUnstakeInfo();
  }, [account, tabIndex]);

  return (
    <>
      <Tabs index={tabIndex} onChange={handleTabsChange}>
        <StyledTabList>
          <StyledTab>Send</StyledTab>
          <StyledTab>Unstaking</StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <SendPanel currencyKey="ICX" />
          </TabPanel>

          <TabPanel>
            <Grid>
              <Typography variant="h3">Unstaking</Typography>

              {!unstakingAmount.isZero() ? (
                <>
                  <Typography>Your ICX will be unstaked as more collateral is deposited into Balanced.</Typography>

                  <Typography variant="p">{unstakingAmount.dp(2).toFormat()} ICX unstaking</Typography>
                </>
              ) : (
                <Typography>There's no ICX unstaking.</Typography>
              )}
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
