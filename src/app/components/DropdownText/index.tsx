import React from 'react';

import styled from 'styled-components';

import { DropdownPopper } from 'app/components/Popover';
import { ReactComponent as ArrowDownIcon } from 'assets/icons/arrow-down.svg';

const StyledArrowDownIcon = styled(ArrowDownIcon)`
  margin-left: 5px;
  margin-top: -3px;
  width: 10px;
`;

const Wrapper = styled.span`
  &:hover {
    cursor: pointer;
  }
`;

export const UnderlineText = styled.span`
  color: #2fccdc;
  font-size: 14px;
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

  // refs to detect clicks outside modal
  const wrapperRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleClick = e => {
    if (
      !(contentRef.current && contentRef.current.contains(e.target)) &&
      !(wrapperRef.current && wrapperRef.current.contains(e.target))
    ) {
      setAnchor(null);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  });

  return (
    <>
      <Wrapper onClick={handleToggleClick} ref={wrapperRef} {...rest}>
        <UnderlineText>{text}</UnderlineText>
        <StyledArrowDownIcon ref={arrowRef} />
      </Wrapper>
      <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
        <div ref={contentRef}>{children}</div>
      </DropdownPopper>
    </>
  );
};

export default DropdownText;
