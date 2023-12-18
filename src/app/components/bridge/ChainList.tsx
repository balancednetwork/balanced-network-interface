import React from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { ChainLogo } from 'app/_xcall/ChainLogo';
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
      {getNetworkDisplayName(chain)}
    </ChainItemWrap>
  );
};

const ChainList = ({ chain, setChain, chains }: ChainListProps) => {
  const relevantChains = chains || SUPPORTED_XCALL_CHAINS;

  return (
    <Box p={'5px 15px'}>
      {relevantChains.map((chainItem, index) => (
        <Box key={index} onClick={e => setChain(chainItem)}>
          <ChainItem chain={chainItem} isActive={chain === chainItem} isLast={relevantChains.length === index + 1} />
        </Box>
      ))}
    </Box>
  );
};

export default ChainList;
