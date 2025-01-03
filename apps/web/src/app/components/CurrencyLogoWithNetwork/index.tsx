import React from 'react';

import styled from 'styled-components';

import { ChainLogo } from '@/app/components/ChainLogo';
import { Currency } from '@balancednetwork/sdk-core';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';

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

const CurrencyLogoWithNetwork = ({
  currency,
  chainId,
  bgColor,
  size,
}: { currency: Currency; chainId: XChainId; bgColor: string; size: string }) => {
  return (
    <Wrap>
      <CurrencyLogo currency={currency} size={size} />
      <NetworkWrap
        $bgColor={bgColor}
        $right={size === '20px' ? '-5px' : '-4px'}
        $bottom={size === '20px' ? '-6px' : '-5px'}
      >
        <ChainLogo chain={xChainMap[chainId]} size="14px" />
      </NetworkWrap>
    </Wrap>
  );
};

export default CurrencyLogoWithNetwork;
