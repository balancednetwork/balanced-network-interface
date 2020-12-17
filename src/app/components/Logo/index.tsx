import React from 'react';

import { ImageProps } from 'rebass';
import styled from 'styled-components';

import LogoSrc from 'assets/images/balanced-logo.png';

const LogoImg = styled.img`
  width: 100px;
`;

export default function Logo(props: Omit<ImageProps, 'src' | 'alt'>) {
  return <LogoImg src={LogoSrc} alt="Balanced logo" {...props} />;
}
