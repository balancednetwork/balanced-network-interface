import React from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { ChainLogo } from '@/app/components/ChainLogo';
import { XChainId, XChain } from '@/app/pages/trade/bridge/types';
import { xChains } from '@/app/pages/trade/bridge/_config/xChains';

type ChainListProps = {
  chainId: XChainId;
  setChainId: (chain: XChainId) => void;
  chains?: XChain[];
};

type ChainItemProps = {
  chain: XChain;
  isActive: boolean;
  isLast: boolean;
};

const ChainItemWrap = styled(Flex)`
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: color 0.3s ease;
  align-items: center;
  padding: 10px 0;
  &:hover {
    color: ${({ theme }) => theme.colors.primaryBright};
  }
`;

const ChainItem = ({ chain, isActive, isLast }: ChainItemProps) => {
  return (
    <ChainItemWrap className={isLast ? '' : 'border-bottom'}>
      <Box pr="10px">
        <ChainLogo chain={chain} />
      </Box>
      {chain.name}
    </ChainItemWrap>
  );
};

const ChainList = ({ chainId, setChainId, chains }: ChainListProps) => {
  const relevantChains = chains || xChains;
  const sortedChains = relevantChains.sort((a, b) => (a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1));
  return (
    <Box p={'5px 15px'}>
      {sortedChains.map((chainItem, index) => (
        <Box key={index} onClick={e => setChainId(chainItem.xChainId)}>
          <ChainItem
            chain={chainItem}
            isActive={chainId === chainItem.xChainId}
            isLast={relevantChains.length === index + 1}
          />
        </Box>
      ))}
    </Box>
  );
};

export default ChainList;
