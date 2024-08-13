import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { StyledArrowDownIcon, UnderlineText } from '@/components/DropdownText';
import { Typography } from '@/theme';

import { DropdownPopper } from '../Popover';
import CollateralTypeList from './CollateralTypeList';

export const Wrap = styled.span`
  transform: translate3d(0, 3px, 0);
  cursor: pointer;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

export const CollateralTypeSwitcherWrap = styled.div`
  display: flex;
  align-items: center;

  @media screen and (max-width: 385px) {
    flex-flow: column;
    align-items: flex-start;
  }
`;

const CollateralSelector = ({ width, containerRef, collateral, setCollateral }) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : containerRef);
  };

  const closeDropdown = e => {
    if (!e.target.closest('.collateral-dropdown')) {
      setAnchor(null);
    }
  };

  return (
    <ClickAwayListener onClickAway={e => closeDropdown(e)}>
      <div>
        <Wrap onClick={handleToggle} style={{ position: 'relative' }}>
          <Typography fontSize={16}>
            <UnderlineText>{collateral}</UnderlineText>
            <div ref={arrowRef} style={{ display: 'inline-block' }}>
              <StyledArrowDownIcon />
            </div>
          </Typography>
        </Wrap>
        <DropdownPopper
          show={Boolean(anchor)}
          anchorEl={anchor}
          arrowEl={arrowRef.current}
          containerOffset={containerRef ? containerRef.getBoundingClientRect().x : 0}
          placement="bottom"
          offset={[0, 8]}
        >
          <CollateralTypeList width={width} anchor={anchor} setAnchor={setAnchor} setCollateral={setCollateral} />
        </DropdownPopper>
      </div>
    </ClickAwayListener>
  );
};

export default CollateralSelector;
