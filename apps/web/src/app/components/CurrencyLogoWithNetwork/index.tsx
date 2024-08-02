import { XChainId } from '@/app/pages/trade/bridge/types';
import React from 'react';
import styled from 'styled-components';
import CurrencyLogo from '../CurrencyLogo';
import { Currency } from '@balancednetwork/sdk-core';
import { ChainLogo } from '@/app/components/ChainLogo';
import { xChainMap } from '@/app/pages/trade/bridge/_config/xChains';

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
