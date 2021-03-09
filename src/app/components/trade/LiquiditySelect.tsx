import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Wrapper, UnderlineText, StyledArrowDownIcon } from 'app/components/DropdownText';
import { PopperWithoutArrow } from 'app/components/Popover';
import { Typography } from 'app/theme';

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 4fr 1fr;
`;

const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

const DataText = styled(Typography)`
  color: inherit;
  font-size: 16px;
`;

const ListItem = styled(DashGrid)`
  padding: 20px 0;
  cursor: pointer;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);

  :hover {
    color: #2ca9b7;
    transition: color 0.2s ease;
  }
`;

const List = styled(Box)`
  width: 316px;
  padding: 25px;
  -webkit-overflow-scrolling: touch;

  & > ${ListItem}:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

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

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div>
        <StyledWrapper ref={ref} onClick={toggleOpen}>
          <UnderlineText>ICX / bnUSD</UnderlineText>
          <StyledArrowDownIcon />
        </StyledWrapper>

        <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom">
          <List>
            <DashGrid>
              <HeaderText>POOL</HeaderText>
              <HeaderText textAlign="right">APY</HeaderText>
            </DashGrid>
            <ListItem>
              <DataText variant="p" fontWeight="bold">
                BALN / bnUSD
              </DataText>
              <DataText variant="p" textAlign="right">
                5.6%
              </DataText>
            </ListItem>
            <ListItem>
              <DataText variant="p" fontWeight="bold">
                ICX / bnUSD
              </DataText>
              <DataText variant="p" textAlign="right">
                3.6%
              </DataText>
            </ListItem>
            <ListItem>
              <DataText variant="p" fontWeight="bold">
                sICX / ICX
              </DataText>
              <DataText variant="p" textAlign="right">
                9.2%
              </DataText>
            </ListItem>
          </List>
        </PopperWithoutArrow>
      </div>
    </ClickAwayListener>
  );
}
