import React from 'react';

import { StyledICONLogo } from 'app/components/CurrencyLogo';
import { ReactComponent as Archway } from 'assets/icons/archway.svg';
import ICONLogo from 'assets/images/icon-logo.png';

import { SupportedXCallChains } from '../types';

export const ChainLogo = ({ chain, size = '24px' }: { chain: SupportedXCallChains; size?: string }) => {
  switch (chain) {
    case 'icon':
      return <StyledICONLogo src={ICONLogo} alt="icon logo" size={size} />;
    case 'archway':
      return <Archway width={size} height={size} />;
  }
};
