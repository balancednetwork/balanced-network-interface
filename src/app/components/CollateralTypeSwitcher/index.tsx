import React from 'react';

import ClickAwayListener from 'react-click-away-listener';

import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { MenuList, MenuItem } from 'app/components/Menu';
import { useCollateralType, useCollateralChangeCollateralType } from 'store/collateral/hooks';

import { DropdownPopper } from '../Popover';

const availableCollateralTypes: { [key: string]: string } = {
  sICX: 'sICX',
  BALN: 'BALN',
  bnUSD: 'bnUSD',
};

const CollateralTypeSwitcher = () => {
  const collateralType = useCollateralType();
  const changeCollateralType = useCollateralChangeCollateralType();

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = () => {
    setAnchor(null);
  };

  return (
    <>
      <ClickAwayListener onClickAway={closeDropdown}>
        <UnderlineTextWithArrow
          onClick={handleToggle}
          text={availableCollateralTypes[collateralType]}
          arrowRef={arrowRef}
        />
      </ClickAwayListener>
      <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
        <MenuList>
          {Object.keys(availableCollateralTypes).map(
            t =>
              t !== collateralType && (
                <MenuItem key={t} onClick={() => changeCollateralType(t)}>
                  {t}
                </MenuItem>
              ),
          )}
        </MenuList>
      </DropdownPopper>
    </>
  );
};

export default CollateralTypeSwitcher;
