import React, { useState, useCallback, useEffect } from 'react';

import { Trans, t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';

import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';

import SearchInput from '../SearchModal/SearchInput';
import AllPoolsPanel from './AllPoolsPanel';
import LiquidityDetails, { useHasLiquidity } from './LiquidityDetails';
import { ChartControlButton, ChartControlGroup } from './utils';

enum PanelType {
  YourPools,
  AllPools,
}

export default function LiquidityPoolsPanel() {
  const { account } = useIconReact();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleInput = useCallback(event => {
    setSearchQuery(event.target.value);
  }, []);

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

  return (
    <BoxPanel bg="bg2" mb={10}>
      <Flex alignItems="center" justifyContent="space-between" mb={5}>
        <Flex alignItems="center">
          <Typography variant="h2" mr={4}>
            <Trans>Liquidity pools</Trans>
          </Typography>

          {account && (
            <ChartControlGroup>
              <ChartControlButton
                type="button"
                onClick={() => handleSwitch(PanelType.YourPools)}
                active={panelType === PanelType.YourPools}
              >
                <Trans>Your pools</Trans>
              </ChartControlButton>
              <ChartControlButton
                type="button"
                onClick={() => handleSwitch(PanelType.AllPools)}
                active={panelType === PanelType.AllPools}
              >
                <Trans>All pools</Trans>
              </ChartControlButton>
            </ChartControlGroup>
          )}
        </Flex>

        <SearchInput
          type="text"
          id="pool-search-input"
          placeholder={t`Search pools...`}
          autoComplete="off"
          value={searchQuery}
          onChange={handleInput}
          style={{ maxWidth: '400px' }}
        />
      </Flex>

      {panelType === PanelType.YourPools ? <LiquidityDetails /> : <AllPoolsPanel />}
    </BoxPanel>
  );
}
