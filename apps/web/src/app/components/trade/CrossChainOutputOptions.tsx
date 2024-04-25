import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { CROSSCHAIN_SUPPORTED_TOKENS } from 'app/_xcall/_icon/config';
import { XChainId } from 'app/_xcall/types';
import { Typography } from 'app/theme';

import { ChainTabButton, ChainTabs } from '../Header';

type CrossChainOutputOptionsProps = {
  currency?: Currency;
  destinationChain: XChainId;
  destinationAddress?: string;
  setDestinationChain: (chain: XChainId) => void;
  setDestinationAddress: (address: string) => void;
};

const CrossChainOutputOptions = ({ currency, destinationChain, setDestinationChain }: CrossChainOutputOptionsProps) => {
  const isCrossChainToken = Object.keys(CROSSCHAIN_SUPPORTED_TOKENS).includes(currency?.wrapped.address || '');

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (!isCrossChainToken) {
      setDestinationChain('0x1.icon');
    }
    return () => {
      setDestinationChain('0x1.icon');
    };
  }, [setDestinationChain, currency?.wrapped.address, isCrossChainToken]);

  return (
    <AnimatePresence>
      {isCrossChainToken && (
        <motion.div
        // initial={{ opacity: 0, height: 0 }}
        // animate={{ opacity: 1, height: 'auto' }}
        // exit={{ opacity: 0, height: 0 }}
        // key="destination-chain"
        // transition={{ duration: 0.3 }}
        >
          <Box style={{ transform: 'translateY(5px)' }}>
            <Flex alignItems="center">
              <Typography mt="-1px" mr={2}>
                To:
              </Typography>
              <ChainTabs p={'0 !important'}>
                <ChainTabButton
                  active={destinationChain === '0x1.icon'}
                  onClick={() => setDestinationChain('0x1.icon')}
                >
                  ICON
                </ChainTabButton>
                <ChainTabButton
                  active={destinationChain === 'archway-1'}
                  onClick={() => setDestinationChain('archway-1')}
                >
                  Archway
                </ChainTabButton>
              </ChainTabs>
            </Flex>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CrossChainOutputOptions;
