import React from 'react';

import { Box } from 'rebass';

import { SUPPORTED_XCALL_CHAINS } from 'app/_xcall/config';
import { SupportedXCallChains } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';

type ChainListProps = {
  chain: SupportedXCallChains;
  setChain: (chain: SupportedXCallChains) => void;
  chains?: SupportedXCallChains[];
};

type ChainItemProps = {
  chain: SupportedXCallChains;
  isActive: boolean;
  isLast: boolean;
};

const ChainItem = ({ chain, isActive, isLast }: ChainItemProps) => {
  return <Box>{getNetworkDisplayName(chain)}</Box>;
};

const ChainList = ({ chain, setChain, chains }: ChainListProps) => {
  const relevantChains = chains || SUPPORTED_XCALL_CHAINS;

  return (
    <Box p={'15px'}>
      {relevantChains.map((chainItem, index) => (
        <Box key={index} onClick={e => setChain(chainItem)}>
          <ChainItem chain={chainItem} isActive={chain === chainItem} isLast={relevantChains.length === index + 1} />
        </Box>
      ))}
    </Box>
  );
};

export default ChainList;
