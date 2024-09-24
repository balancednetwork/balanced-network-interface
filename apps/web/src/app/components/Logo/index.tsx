import React from 'react';

import LogoSrc from '@/assets/images/balanced-logo.png';

export default function Logo(props) {
  return (
    <div {...props}>
      <img src={LogoSrc} className="w-[75px] cursor-pointer sm:w-[100px]" alt="Balanced logo" />
    </div>
  );
}
