import React from 'react';

import styled from 'styled-components';

import LogoSrc from 'assets/images/balanced-logo.png';

import { MouseoverTooltip } from '../Tooltip';

const LogoImg = styled.img`
  width: 100px;
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 75px;
  `}
`;

export default function Logo(props) {
  return (
    <div {...props}>
      <a href="https://balanced.network">
        <MouseoverTooltip text="Back to the Balanced website" placement="right">
          <LogoImg src={LogoSrc} alt="Balanced logo" />
        </MouseoverTooltip>
      </a>
    </div>
  );
}
