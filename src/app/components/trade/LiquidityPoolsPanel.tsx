import React, { useState, useCallback } from 'react';

import { Trans, t } from '@lingui/macro';
import { Flex } from 'rebass/styled-components';

import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { isAddress } from 'utils';

import SearchInput from '../SearchModal/SearchInput';
import AllPoolsPanel from './AllPoolsPanel';
import LiquidityDetails from './LiquidityDetails';
import { ChartControlButton, ChartControlGroup } from './utils';

export default function LiquidityPoolsPanel() {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleInput = useCallback(event => {
    const input = event.target.value;
    const checksummedInput = isAddress(input);
    setSearchQuery(checksummedInput || input);
  }, []);

  const [value, setValue] = useState<number>(0);
  const handleSwitch = (v: number) => {
    setValue(v);
  };

  return (
    <BoxPanel bg="bg2" mb={10}>
      <Flex alignItems="center" justifyContent="space-between" mb={5}>
        <Flex alignItems="center">
          <Typography variant="h2" mr={4}>
            <Trans>Liquidity pools</Trans>
          </Typography>

          <ChartControlGroup>
            <ChartControlButton type="button" onClick={() => handleSwitch(0)} active={value === 0}>
              <Trans>Your Pools</Trans>
            </ChartControlButton>
            <ChartControlButton type="button" onClick={() => handleSwitch(1)} active={value === 1}>
              <Trans>All pools</Trans>
            </ChartControlButton>
          </ChartControlGroup>
        </Flex>

        <SearchInput
          type="text"
          id="pool-search-input"
          placeholder={t`Search pools ...`}
          autoComplete="off"
          value={searchQuery}
          onChange={handleInput}
          style={{ maxWidth: '400px' }}
        />
      </Flex>

      {value === 0 ? <LiquidityDetails /> : <AllPoolsPanel />}
    </BoxPanel>
  );
}
