import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { Wrapper, UnderlineText, StyledArrowDownIcon } from 'app/components/DropdownText';
import { List, ListItem, DashGrid, HeaderText, DataText } from 'app/components/List';
import { PopperWithoutArrow } from 'app/components/Popover';
import { Pair, BASE_SUPPORTED_PAIRS } from 'constants/currency';
import { resetMintState } from 'store/mint/actions';
import { useSetPair, usePoolPair, useAPYs } from 'store/pool/hooks';
import { formatBigNumber } from 'utils';

export default function LiquiditySelect() {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const ref = React.useRef<HTMLElement>(null);

  const selectedPair = usePoolPair();
  const setPair = useSetPair();
  const dispatch = useDispatch();

  const handleSelectPool = (pl: Pair) => {
    toggleOpen();
    setPair(pl);
    dispatch(resetMintState());
  };

  const apys = useAPYs();

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
            {BASE_SUPPORTED_PAIRS.map(pool => (
              <ListItem key={pool.pair} onClick={() => handleSelectPool(pool)}>
                <DataText variant="p" fontWeight="bold">
                  {pool.pair}
                </DataText>
                <DataText variant="p" textAlign="right">
                  {formatBigNumber(apys[pool.poolId], 'currency')}%
                </DataText>
              </ListItem>
            ))}
          </List>
        </PopperWithoutArrow>
      </div>
    </ClickAwayListener>
  );
}

const StyledWrapper = styled(Wrapper)`
  font-size: 18px;
  padding-bottom: 5px;
  color: white;
  :hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
