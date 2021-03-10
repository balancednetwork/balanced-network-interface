import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { Wrapper, UnderlineText, StyledArrowDownIcon } from 'app/components/DropdownText';
import { List, ListItem, DashGrid, HeaderText, DataText } from 'app/components/List';
import { PopperWithoutArrow } from 'app/components/Popover';
import { SupportedPairs, Pair } from 'constants/currency';
import { useSetPair, usePoolPair } from 'store/pool/hooks';

const StyledWrapper = styled(Wrapper)`
  font-size: 18px;
  padding-bottom: 5px;
  color: white;
  :hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export default function LiquiditySelect() {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const ref = React.useRef<HTMLElement>(null);

  const selectedPair = usePoolPair();
  const setPair = useSetPair();

  const handleSelectPool = (pl: Pair) => {
    toggleOpen();
    setPair(pl);
  };

  console.log(selectedPair);
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div>
        <StyledWrapper ref={ref} onClick={toggleOpen}>
          <UnderlineText>{selectedPair.pair}</UnderlineText>
          <StyledArrowDownIcon />
        </StyledWrapper>

        <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom">
          <List>
            <DashGrid>
              <HeaderText>POOL</HeaderText>
              <HeaderText textAlign="right">APY</HeaderText>
            </DashGrid>
            {SupportedPairs.map(pool => (
              <ListItem key={pool.pair} onClick={() => handleSelectPool(pool)}>
                <DataText variant="p" fontWeight="bold">
                  {pool.pair}
                </DataText>
                <DataText variant="p" textAlign="right">
                  5.6%
                </DataText>
              </ListItem>
            ))}
          </List>
        </PopperWithoutArrow>
      </div>
    </ClickAwayListener>
  );
}
