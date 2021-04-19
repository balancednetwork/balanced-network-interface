import React from 'react';

import { NavLink } from 'react-router-dom';
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
      <NavLink exact to="/">
        <MouseoverTooltip text="Back to the Balanced website" placement="right">
          <LogoImg src={LogoSrc} alt="Balanced logo" />
        </MouseoverTooltip>
      </NavLink>
    </div>
  );
}
