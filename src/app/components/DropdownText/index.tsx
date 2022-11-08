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
  white-space: nowrap;
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
  word-break: normal;
  cursor: pointer;

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

  ${({ theme }) => theme.mediaWidth.upMedium`
    &:hover:after {
    width: 100%;
    background: #2fccdc;
  }
  `};
`;

type UnderlineTextWithArrowProps = {
  arrowRef?: ((instance: SVGSVGElement | null) => void) | React.RefObject<SVGSVGElement> | null | undefined;
  text: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>;

export const UnderlineTextWithArrow: React.FC<UnderlineTextWithArrowProps> = props => {
  const { arrowRef, text, ...rest } = props;

  return (
    <Wrapper {...rest}>
      <UnderlineText>{text}</UnderlineText>
      <StyledArrowDownIcon ref={arrowRef} />
    </Wrapper>
  );
};

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
        <UnderlineTextWithArrow text={text} onClick={handleToggleClick} arrowRef={arrowRef} {...rest} />
        <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
          {children}
        </DropdownPopper>
      </div>
    </ClickAwayListener>
  );
};

export default DropdownText;
