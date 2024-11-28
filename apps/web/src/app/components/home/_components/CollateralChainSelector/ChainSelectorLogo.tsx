import { ChainLogo } from '@/app/components/ChainLogo';
import { XChain } from '@/xwagmi/types';
import React from 'react';
import styled from 'styled-components';

const Wrap = styled.span`
  position: relative;
  display: inline-block;
  margin: 0 6px;
  transform: translateY(-1px);
`;

const ChainSelectorLogo = ({ chain, size = 14 }: { chain: XChain; size?: number }) => {
  return (
    <Wrap>
      <ChainLogo chain={chain} size={`${size}px`} />
    </Wrap>
  );
};

export default ChainSelectorLogo;
