import React from 'react';
import { isMobile } from 'react-device-detect';

import LogoMobileSrc from '@/assets/images/logo-mobile.png';
import LogoSrc from '@/assets/images/logo.png';

export default function Logo(props) {
  return (
    <div {...props} className={isMobile ? 'w-[200px]' : 'w-[239px]'}>
      <img src={isMobile ? LogoMobileSrc : LogoSrc} className="cursor-pointer" id="header-logo" alt="hanaswap" />
    </div>
  );
}
