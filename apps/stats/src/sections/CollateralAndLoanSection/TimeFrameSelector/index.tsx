import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { Wrap } from '@/components/CollateralSelector';
import { StyledArrowDownIcon, UnderlineText } from '@/components/DropdownText';
import { DropdownPopper } from '@/components/Popover';
import { Typography } from '@/theme';

export type CollateralChartTimeFrame = {
  displayName: string;
  days: number;
};

export type TimeFrame = 'MONTH' | 'QUARTER_YEAR' | 'HALF_YEAR' | 'YEAR';

export const timeFrames: {
  [key in TimeFrame]: CollateralChartTimeFrame;
} = Object.freeze({
  MONTH: {
    displayName: 'month',
    days: 30,
  },
  QUARTER_YEAR: {
    displayName: '3 months',
    days: 91,
  },
  HALF_YEAR: {
    displayName: '6 months',
    days: 182,
  },
  YEAR: {
    displayName: 'year',
    days: 365,
  },
});

const TimeFrameItemList = styled.ul`
  list-style-type: none;
  padding: 5px;
  margin: 0;
`;

const TimeFrameItem = styled.li`
  padding: 7px 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  transition: all ease 0.3s;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export default function TimeFrameSelector({
  selected,
  setSelected,
}: {
  selected: TimeFrame;
  setSelected: (_t: TimeFrame) => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = e => {
    if (!e.target.closest('.collateral-dropdown')) {
      setAnchor(null);
    }
  };

  const handleClick = (item: TimeFrame) => {
    setSelected(item);
    setAnchor(null);
  };

  const selectedTimeFrame = timeFrames[selected];
  return (
    <ClickAwayListener onClickAway={e => closeDropdown(e)}>
      <div>
        <Wrap onClick={handleToggle} style={{ position: 'relative' }}>
          <Typography fontSize={16}>
            <UnderlineText>past {selectedTimeFrame.displayName}</UnderlineText>
            <div ref={arrowRef} style={{ display: 'inline-block', width: '19px' }}>
              <StyledArrowDownIcon />
            </div>
          </Typography>
        </Wrap>
        <DropdownPopper
          show={Boolean(anchor)}
          anchorEl={anchor}
          arrowEl={arrowRef.current}
          placement="bottom"
          offset={[0, 14]}
        >
          <TimeFrameItemList>
            {Object.keys(timeFrames)
              .filter(item => item !== selected)
              .map(item => (
                <TimeFrameItem key={item} onClick={() => handleClick(item as TimeFrame)}>
                  {timeFrames[item].displayName}
                </TimeFrameItem>
              ))}
          </TimeFrameItemList>
        </DropdownPopper>
      </div>
    </ClickAwayListener>
  );
}
