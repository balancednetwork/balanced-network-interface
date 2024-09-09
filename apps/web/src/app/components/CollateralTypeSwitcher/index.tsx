import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { StyledArrowDownIcon } from '@/app/components/DropdownText';
import { useCollateralType, useIcxDisplayType } from '@/store/collateral/hooks';

import { SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import CurrencyLogo from '../CurrencyLogo';
import { DropdownPopper } from '../Popover';
import CollateralTypeListWrap from './CollateralTypeListWrap';

const Wrap = styled.span`
  cursor: pointer;
  font-size: 18px;
  position: relative;
  top: 3px;
  color: ${({ theme }) => theme.colors.primaryBright};
  display: flex;
  align-items: center;

  .arrow-container {
    svg {
      height: 22px;
    }
  }
`;

const LogoWrap = styled.span`
  display: inline-block;
  position: relative;
  margin-right: 5px;

  img {
    float: left;
  }
`;

export const CollateralTypeSwitcherWrap = styled.div`
  display: flex;
  align-items: center;

  @media screen and (max-width: 450px) {
    flex-flow: column;
    align-items: flex-start;
  }
`;

const CollateralTypeSwitcher = ({ width, containerRef }) => {
  const collateralType = useCollateralType();
  const icxDisplayType = useIcxDisplayType();

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
      <ClickAwayListener onClickAway={e => closeDropdown(e)}>
        <div>
          <Wrap onClick={handleToggle}>
            <LogoWrap>
              <CurrencyLogo
                currency={SUPPORTED_TOKENS_LIST.find(
                  token => token.symbol === (collateralType === 'sICX' ? icxDisplayType : collateralType),
                )}
                size={'18px'}
              />
            </LogoWrap>
            {collateralType === 'sICX' ? icxDisplayType : collateralType}
            <div ref={arrowRef} style={{ display: 'inline-block' }} className="arrow-container">
              <StyledArrowDownIcon />
            </div>
          </Wrap>

          <DropdownPopper
            show={Boolean(anchor)}
            anchorEl={anchor}
            arrowEl={arrowRef.current}
            containerOffset={containerRef ? containerRef.getBoundingClientRect().x : 0}
            placement="bottom"
            offset={[0, 8]}
          >
            <CollateralTypeListWrap width={width} anchor={anchor} setAnchor={setAnchor} />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </>
  );
};

export default CollateralTypeSwitcher;
