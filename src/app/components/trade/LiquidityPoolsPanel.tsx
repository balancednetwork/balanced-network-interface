import React, { useState, useEffect } from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';

import AllPoolsPanel from './AllPoolsPanel';
import LiquidityDetails from './LiquidityDetails';
import { useHasLiquidity } from './LiquidityDetails/shared';
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

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    flex-direction: row;
    align-items: center;
  `}
`;

export default function LiquidityPoolsPanel() {
  const { account } = useIconReact();
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
      <Wrapper>
        <Typography variant="h2" mr={2}>
          <Trans>Liquidity pools</Trans>
        </Typography>

        {account && hasLiquidity && (
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
              <Trans>Incentivised pools</Trans>
            </ChartControlButton>
          </ChartControlGroup>
        )}
      </Wrapper>

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
          <motion.div
            key="IncentivisedPools"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'just' }}
          >
            <AllPoolsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </BoxPanel>
  );
}
