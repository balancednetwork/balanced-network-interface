import React from 'react';

import ClickAwayListener from 'react-click-away-listener';

import { DropdownPopper } from '@/app/components/Popover';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import styled from 'styled-components';

type UnderlineTextWithArrowProps = {
  arrowRef?: ((instance: SVGSVGElement | null) => void) | React.RefObject<SVGSVGElement> | null | undefined;
  text: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>;

export const StyledArrowDownIcon = styled(ArrowDownIcon)`
  margin-left: 5px;
  margin-top: -3px;
  width: 10px;
`;

export const UnderlineText = ({ children }: any) => {
  return (
    <div
      className='text-inherit bg-transparent relative pb-1 -mb-2 select-none break-normal cursor-pointer 
        after:content-[" "] after:block after:w-0 after:h-[1px] after:mt-1 after:bg-transparent after:rounded-sm transition-["width 0.3s ease, background-color 0.3s ease"] 
        :hover:after:w-full :hover:after:bg-[#2fccdc]'
    >
      {children}
    </div>
  );
};

export const UnderlineTextWithArrow: React.FC<UnderlineTextWithArrowProps> = props => {
  const { arrowRef, text, ...rest } = props;

  return (
    <div className="flex items-center whitespace-normal text-[#2fccdc] text-sm" {...rest}>
      <span
        className='text-inherit bg-transparent relative pb-1 -mb-2 select-none break-normal cursor-pointer 
          after:content-[" "] after:block after:w-0 after:h-[1px] after:mt-1 after:bg-transparent after:rounded-sm transition-["width 0.3s ease, background-color 0.3s ease"]
          :hover:after:w-full :hover:after:bg-[#2fccdc]'
      >
        {text}
      </span>
      <ArrowDownIcon className="ml-1 w-2.5" ref={arrowRef} />
    </div>
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
