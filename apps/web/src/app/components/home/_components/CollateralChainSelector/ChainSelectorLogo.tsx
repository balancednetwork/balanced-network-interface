import { ChainLogo } from '@/app/components/ChainLogo';
import { XChain } from '@/xwagmi/types';
import React from 'react';
import styled from 'styled-components';

const Wrap = styled.span`
  position: relative;
  display: inline-block;
  margin: 0 5px;
  transform: translateY(-1px);
`;

const ChainSelectorLogo = ({ chain }: { chain: XChain }) => {
  return (
    <Wrap>
      <ChainLogo chain={chain} size={'14px'} />
    </Wrap>
  );
};

export default ChainSelectorLogo;
