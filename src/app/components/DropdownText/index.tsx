import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { DropdownPopper } from 'app/components/Popover';
import { ReactComponent as ArrowDownIcon } from 'assets/icons/arrow-down.svg';

export const StyledArrowDownIcon = styled(ArrowDownIcon)`
  margin-left: 5px;
  margin-top: -3px;
  width: 10px;
`;

export const Wrapper = styled.span`
  &:hover {
    cursor: pointer;
  }
  color: #2fccdc;
  font-size: 14px;
`;

export const UnderlineText = styled.span`
  color: inherit;
  font-size: inherit;
  text-decoration: none;
  background: transparent;
  display: inline-block;
  position: relative;
  padding-bottom: 3px;
  margin-bottom: -9px;
  user-select: none;

  &:after {
    content: '';
    display: block;
    width: 0px;
    height: 1px;
    margin-top: 3px;
    background: transparent;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  &:hover:after {
    width: 100%;
    background: #2fccdc;
  }
`;

export const DropdownText = ({ text, children, ...rest }: { text: string; children: React.ReactNode }) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggleClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closePopper = () => {
    setAnchor(null);
  };

  return (
    <ClickAwayListener onClickAway={closePopper}>
      <div>
        <Wrapper onClick={handleToggleClick} {...rest}>
          <UnderlineText>{text}</UnderlineText>
          <StyledArrowDownIcon ref={arrowRef} />
        </Wrapper>
        <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
          {children}
        </DropdownPopper>
      </div>
    </ClickAwayListener>
  );
};

export default DropdownText;
