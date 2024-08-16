import React from 'react';

import AllLogo from '@/assets/icons/all.svg?url';
import FundLogo from '@/assets/icons/stability-white.svg?url';
import ICONLogo from '@/assets/images/icon-logo.png?url';

const TOKEN_ICON_URL = 'https://raw.githubusercontent.com/balancednetwork/icons/master/tokens/';

const Icon = ({ src, alt, ...rest }: { src: string; alt?: string }) => (
  <img src={src} alt={alt} width={25} height={25} {...rest} style={{ marginRight: '15px' }} />
);

const CollateralIcon = ({ icon }: { icon: string }) => {
  const src = icon.toLowerCase();
  switch (src) {
    case 'all':
      return <Icon src={AllLogo} alt="All" />;
    case 'stability fund':
      return <Icon src={FundLogo} alt="Stability Fund" />;
    case 'sicx':
      return <Icon src={ICONLogo} alt="ICON" />;
    default:
      return <Icon src={`${TOKEN_ICON_URL}${src}.png`} alt={icon} />;
  }
};

export default CollateralIcon;
