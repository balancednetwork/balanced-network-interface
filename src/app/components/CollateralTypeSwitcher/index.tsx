import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { StyledArrowDownIcon, UnderlineText } from 'app/components/DropdownText';
import { useCollateralType } from 'store/collateral/hooks';

import { DropdownPopper } from '../Popover';
import CollateralTypeList from './CollateralTypeList';

const Wrap = styled.span`
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

const CollateralTypeSwitcher = ({ width, containerRef }) => {
  const collateralType = useCollateralType();

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : containerRef);
  };

  const closeDropdown = e => {
    if (!e.target.classList.contains('search-field')) {
      setAnchor(null);
    }
  };

  return (
    <>
      <Wrap onClick={handleToggle} style={{ position: 'relative' }}>
        <UnderlineText>{collateralType === 'sICX' ? 'ICX' : collateralType}</UnderlineText>
        <div ref={arrowRef} style={{ display: 'inline-block' }}>
          <StyledArrowDownIcon />
        </div>
      </Wrap>
      <ClickAwayListener onClickAway={e => closeDropdown(e)}>
        <DropdownPopper
          show={Boolean(anchor)}
          anchorEl={anchor}
          arrowEl={arrowRef.current}
          containerOffset={containerRef ? containerRef.getBoundingClientRect().x : 0}
          placement="bottom"
          offset={[0, 8]}
        >
          <CollateralTypeList width={width} anchor={anchor} setAnchor={setAnchor} />
        </DropdownPopper>
      </ClickAwayListener>
    </>
  );
};

export default CollateralTypeSwitcher;
