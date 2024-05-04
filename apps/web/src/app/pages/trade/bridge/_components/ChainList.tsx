import React from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { ChainLogo } from 'app/pages/trade/bridge-v2/_components/ChainLogo';
import { XChainId, XChain } from 'app/pages/trade/bridge-v2/types';
import { xChains } from 'app/pages/trade/bridge-v2/_config/xChains';

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

  return (
    <Box p={'5px 15px'}>
      {relevantChains.map((chainItem, index) => (
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
