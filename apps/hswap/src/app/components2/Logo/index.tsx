import React from 'react';

import LogoSrc from '@/assets/images/logo.png';

export default function Logo(props) {
  return (
    <div {...props}>
      <img src={LogoSrc} className="cursor-pointer" alt="hanaswap" />
    </div>
  );
}
