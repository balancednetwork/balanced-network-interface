import React from 'react';
import { isMobile } from 'react-device-detect';

import LogoSrc from '@/assets/images/logo.png';
import LogoMobileSrc from '@/assets/images/logo-mobile.png';

export default function Logo(props) {
  console.log('isMobile', isMobile);
  return (
    <div {...props} className={isMobile ? 'w-[220px]' : 'w-[239px]'}>
      <img src={isMobile ? LogoMobileSrc : LogoSrc} className="cursor-pointer" alt="hanaswap" />
    </div>
  );
}
