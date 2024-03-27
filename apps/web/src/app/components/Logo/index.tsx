import React from 'react';

import { t } from '@lingui/macro';
import styled from 'styled-components';

import LogoSrc from 'assets/images/balanced-logo.png';

import { MouseoverTooltip } from '../Tooltip';

const LogoImg = styled.img`
  width: 75px;
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upSmall`
    width: 100px;
  `}
`;

export default function Logo(props) {
  return (
    <div {...props}>
      <a href="https://balanced.network">
        <MouseoverTooltip text={t`Back to the Balanced website`} placement="right" noArrowAndBorder>
          <LogoImg src={LogoSrc} alt="Balanced logo" />
        </MouseoverTooltip>
      </a>
    </div>
  );
}
