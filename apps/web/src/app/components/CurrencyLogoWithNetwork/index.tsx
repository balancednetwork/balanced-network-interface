import React from 'react';

import styled from 'styled-components';

import { ChainLogo } from '@/app/components/ChainLogo';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XToken } from '@balancednetwork/sdk-core';

import CurrencyLogo from '../CurrencyLogo';

const NetworkWrap = styled.div<{ $bgColor: string; $right: string; $bottom: string }>`
  position: absolute;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  right: ${({ $right }) => $right};
  bottom: ${({ $bottom }) => $bottom};

  background: ${({ $bgColor }) => $bgColor};
  outline: 2px solid ${({ $bgColor }) => $bgColor};

  img {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const Wrap = styled.div`
  position: relative;
`;

const CurrencyLogoWithNetwork = ({ currency, bgColor, size }: { currency: XToken; bgColor: string; size: string }) => {
  return (
    <Wrap>
      <CurrencyLogo currency={currency} size={size} />
      <NetworkWrap
        $bgColor={bgColor}
        $right={size === '20px' ? '-5px' : '-4px'}
        $bottom={size === '20px' ? '-6px' : '-5px'}
      >
        <ChainLogo chain={xChainMap[currency.xChainId]} size="14px" />
      </NetworkWrap>
    </Wrap>
  );
};

export default CurrencyLogoWithNetwork;
