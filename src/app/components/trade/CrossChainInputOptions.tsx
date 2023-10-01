import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { AnimatePresence, motion } from 'framer-motion';
import { Flex } from 'rebass';

import { CROSSCHAIN_SUPPORTED_TOKENS } from 'app/_xcall/_icon/config';
import { SupportedXCallChains } from 'app/_xcall/types';
import { Typography } from 'app/theme';

import { ChainTabButton, ChainTabs } from '../Header';

type CrossChainInputOptionsProps = {
  currency?: Currency;
  originChain: SupportedXCallChains;
  setOriginChain: (chain: SupportedXCallChains) => void;
};

const CrossChainInputOptions = ({ currency, originChain, setOriginChain }: CrossChainInputOptionsProps) => {
  const isCrossChainToken = Object.keys(CROSSCHAIN_SUPPORTED_TOKENS).includes(currency?.wrapped.address || '');

  React.useEffect(() => {
    if (!isCrossChainToken) {
      setOriginChain('icon');
    }
    return () => {
      setOriginChain('icon');
    };
  }, [setOriginChain, currency?.wrapped.address, isCrossChainToken]);

  return (
    <AnimatePresence>
      {isCrossChainToken && (
        <motion.div>
          <Flex alignItems="center" style={{ transform: 'translateY(5px)' }}>
            <Typography mt="-1px" mr={2}>
              From:
            </Typography>
            <ChainTabs p={'0 !important'}>
              <ChainTabButton active={originChain === 'icon'} onClick={() => setOriginChain('icon')}>
                ICON
              </ChainTabButton>
              <ChainTabButton active={originChain === 'archway'} onClick={() => setOriginChain('archway')}>
                Archway
              </ChainTabButton>
            </ChainTabs>
          </Flex>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CrossChainInputOptions;
