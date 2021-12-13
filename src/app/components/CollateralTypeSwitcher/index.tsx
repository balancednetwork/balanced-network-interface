import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { StyledArrowDownIcon, UnderlineText } from 'app/components/DropdownText';
import { useCollateralType } from 'store/collateral/hooks';

import { DropdownPopper } from '../Popover';
import CollateralTypeList from './CollateralTypeList';

const availableCollateralTypes: { [key: string]: string } = {
  ICX: 'ICX',
  BALN: 'BALN',
  bnUSD: 'bnUSD',
};

const Wrap = styled.span`
  padding-left: 7px;
  transform: translate3d(0, 3px, 0);
  cursor: pointer;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const CollateralTypeSwitcher = () => {
  const collateralType = useCollateralType();

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = e => {
    if (!e.target.classList.contains('search-field')) {
      setAnchor(null);
    }
  };

  return (
    <>
      <Wrap onClick={handleToggle}>
        <UnderlineText>{availableCollateralTypes[collateralType]}</UnderlineText>
        <StyledArrowDownIcon ref={arrowRef} />
      </Wrap>
      <ClickAwayListener onClickAway={e => closeDropdown(e)}>
        <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom">
          <CollateralTypeList />
        </DropdownPopper>
      </ClickAwayListener>
    </>
  );
};

export default CollateralTypeSwitcher;
