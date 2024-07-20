import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { StyledArrowDownIcon, UnderlineText } from 'app/components/DropdownText';
import { useCollateralType, useIcxDisplayType } from 'store/collateral/hooks';

import { DropdownPopper } from '../Popover';
import CollateralTypeListWrap from './CollateralTypeListWrap';
import CurrencyLogo from '../CurrencyLogo';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

const Wrap = styled.span`
  cursor: pointer;
  font-size: 18px;
  position: relative;
  top: 3px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const IconWrap = styled.span`
  display: inline-block;
  position: relative;
  margin-right: 5px;
  transform: translateY(-2px);
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
            <UnderlineText>
              <>
                <IconWrap>
                  <CurrencyLogo
                    currency={SUPPORTED_TOKENS_LIST.find(
                      token => token.symbol === (collateralType === 'sICX' ? icxDisplayType : collateralType),
                    )}
                    size={'18px'}
                  />
                </IconWrap>
                {collateralType === 'sICX' ? icxDisplayType : collateralType}
              </>
            </UnderlineText>
            <div ref={arrowRef} style={{ display: 'inline-block' }}>
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
