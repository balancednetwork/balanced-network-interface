import React, { useState, useEffect, useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { ChartControlButton, ChartControlGroup } from '@/app/components/ChartControl';
import { BoxPanel } from '@/app/components/Panel';
import { Typography } from '@/app/theme';

import CancelSearchButton from '@/app/components/SearchModal/CancelSearchButton';
import { SearchWrap } from '@/app/components/SearchModal/CurrencySearch';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useMedia } from 'react-use';
import AllPoolsPanel from './AllPoolsPanel';
import LiquidityDetails from './LiquidityDetails';
import { useHasLiquidity } from './LiquidityDetails/shared';

enum PanelType {
  YourPools,
  AllPools,
}

const Wrapper = styled(Flex)`
  flex-direction: column;
  align-items: start;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    flex-direction: row;
    align-items: center;
  `}
`;

export default function LiquidityPoolsPanel() {
  const [panelType, setPanelType] = useState<PanelType>(PanelType.AllPools);
  const theme = useTheme();
  const isSmallScreen = useMedia(`(minWidth: ${theme.mediaWidth.upSmall})`);
  const [query, setQuery] = React.useState('');
  const signedInWallets = useSignedInWallets();
  const signedIn = useMemo(() => signedInWallets.length > 0, [signedInWallets]);

  const handleSwitch = (v: PanelType) => {
    setPanelType(v);
  };

  const hasLiquidity = useHasLiquidity();

  useEffect(() => {
    if (signedIn && hasLiquidity) {
      setPanelType(PanelType.YourPools);
    } else {
      setPanelType(PanelType.AllPools);
    }
  }, [signedIn, hasLiquidity]);

  return (
    <BoxPanel bg="bg2" mb={10}>
      <Flex justifyContent="space-between" flexWrap="wrap" mb="45px" flexDirection={['column', 'column', 'row']}>
        <Wrapper>
          <Typography variant="h2" mr={2}>
            <Trans>Liquidity pools</Trans>
          </Typography>

          {signedIn && hasLiquidity && (
            <ChartControlGroup mb={'-3px'}>
              <ChartControlButton
                type="button"
                onClick={() => handleSwitch(PanelType.YourPools)}
                $active={panelType === PanelType.YourPools}
              >
                <Trans>Your pools</Trans>
              </ChartControlButton>
              <ChartControlButton
                type="button"
                onClick={() => handleSwitch(PanelType.AllPools)}
                $active={panelType === PanelType.AllPools}
              >
                <Trans>Core pools</Trans>
              </ChartControlButton>
            </ChartControlGroup>
          )}
        </Wrapper>

        <AnimatePresence>
          {panelType === PanelType.AllPools ? (
            <motion.div
              key="SearchInput"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Box width={isSmallScreen ? '100%' : '295px'} mb={isSmallScreen ? '25px' : 0} mt={['15px', '15px', '0']}>
                <SearchWrap>
                  <SearchInput
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{ marginBottom: '-10px' }}
                  />
                  <CancelSearchButton isActive={query.length > 0} onClick={() => setQuery('')}></CancelSearchButton>
                </SearchWrap>
              </Box>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Flex>

      <AnimatePresence>
        {panelType === PanelType.YourPools ? (
          <motion.div
            key="LPDetails"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'just', delay: 0.005 }}
          >
            <LiquidityDetails />
          </motion.div>
        ) : (
          <motion.div key="AllPools" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'just' }}>
            <AllPoolsPanel query={query} />
          </motion.div>
        )}
      </AnimatePresence>
    </BoxPanel>
  );
}
