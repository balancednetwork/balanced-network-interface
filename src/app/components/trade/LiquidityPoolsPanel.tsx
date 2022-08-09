import React, { useState, useEffect, useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
// import SearchInput from '../SearchModal/SearchInput';
import { useAvailablePairs, useBalances } from 'hooks/useV2Pairs';
import { useTrackedTokenPairs } from 'store/user/hooks';

import AllPoolsPanel from './AllPoolsPanel';
import LiquidityDetails from './LiquidityDetails';
import { useHasLiquidity } from './LiquidityDetails/shared';
import { PoolPanelContext } from './PoolPanelContext';
import { ChartControlButton, ChartControlGroup } from './utils';

enum PanelType {
  YourPools,
  AllPools,
}

const Wrapper = styled(Flex)`
  flex-direction: column;
  align-items: start;
  margin-bottom: 30px;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.up500`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  `}
`;

export default function LiquidityPoolsPanel() {
  const { account } = useIconReact();
  // const [searchQuery, setSearchQuery] = useState<string>('');

  // const handleInput = useCallback(event => {
  //   setSearchQuery(event.target.value);
  // }, []);

  const [panelType, setPanelType] = useState<PanelType>(PanelType.AllPools);
  const handleSwitch = (v: PanelType) => {
    setPanelType(v);
  };

  const hasLiquidity = useHasLiquidity();

  useEffect(() => {
    if (account && hasLiquidity) {
      setPanelType(PanelType.YourPools);
    } else {
      setPanelType(PanelType.AllPools);
    }
  }, [account, hasLiquidity]);

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
    <BoxPanel bg="bg2" mb={10}>
      <Wrapper>
        <Typography variant="h2">
          <Trans>Liquidity pools</Trans>
        </Typography>

        {account && (
          <ChartControlGroup>
            {hasLiquidity && (
              <ChartControlButton
                type="button"
                onClick={() => handleSwitch(PanelType.YourPools)}
                active={panelType === PanelType.YourPools}
              >
                <Trans>Your pools</Trans>
              </ChartControlButton>
            )}
            <ChartControlButton
              type="button"
              onClick={() => handleSwitch(PanelType.AllPools)}
              active={panelType === PanelType.AllPools}
            >
              <Trans>All pools</Trans>
            </ChartControlButton>
          </ChartControlGroup>
        )}

        {/* !todo: implement search box  */}
        {/* <SearchInput
          type="text"
          id="pool-search-input"
          placeholder={t`Search pools...`}
          autoComplete="off"
          value={searchQuery}
          onChange={handleInput}
          style={{ maxWidth: '400px' }}
        /> */}
      </Wrapper>

      <PoolPanelContext.Provider value={data}>
        {panelType === PanelType.YourPools ? <LiquidityDetails /> : <AllPoolsPanel />}
      </PoolPanelContext.Provider>
    </BoxPanel>
  );
}
