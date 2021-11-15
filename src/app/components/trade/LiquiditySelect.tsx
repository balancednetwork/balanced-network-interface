import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { useDispatch } from 'react-redux';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Wrapper, UnderlineText, StyledArrowDownIcon } from 'app/components/DropdownText';
import { List, ListItem, DashGrid, HeaderText, DataText } from 'app/components/List';
import { PopperWithoutArrow } from 'app/components/Popover';
import { Typography } from 'app/theme';
import { Pair, SUPPORTED_PAIRS } from 'constants/currency';
import { useAllPairsAPY } from 'queries/reward';
import { resetMintState } from 'store/mint/actions';
import { useSetPair, usePoolPair } from 'store/pool/hooks';

export default function LiquiditySelect() {
  const upSmall = useMedia('(min-width:768px)');
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  // update the width on a window resize
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(ref?.current?.clientWidth);
  React.useEffect(() => {
    function handleResize() {
      setWidth(ref?.current?.clientWidth ?? width);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  const selectedPair = usePoolPair();
  const setPair = useSetPair();
  const dispatch = useDispatch();

  const handleSelectPool = (pl: Pair) => {
    toggleOpen();
    setPair(pl);
    dispatch(resetMintState());
  };

  const apys = useAllPairsAPY();

  return (
    <Flex alignItems="flex-end" ref={ref}>
      <Typography variant="h2">Supply:&nbsp;</Typography>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <div>
          <StyledWrapper onClick={toggleOpen}>
            <Text active={open}>{selectedPair.pair}</Text>
            <StyledArrowDownIcon />
          </StyledWrapper>

          <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom" offset={[0, 10]}>
            <List style={{ width: (width ?? 0) + (upSmall ? 40 : 20) }}>
              <DashGrid>
                <HeaderText>POOL</HeaderText>
                <HeaderText textAlign="right">APY</HeaderText>
              </DashGrid>
              {SUPPORTED_PAIRS.map(pool => (
                <ListItem key={pool.pair} onClick={() => handleSelectPool(pool)}>
                  <DataText variant="p" fontWeight="bold">
                    {pool.pair}
                  </DataText>
                  <DataText variant="p" textAlign="right">
                    {apys && apys[pool.poolId] ? `${apys[pool.poolId].times(100).dp(2).toFormat()}%` : '-'}
                  </DataText>
                </ListItem>
              ))}
            </List>
          </PopperWithoutArrow>
        </div>
      </ClickAwayListener>
    </Flex>
  );
}

const StyledWrapper = styled(Wrapper)`
  font-size: 18px;
  color: white;
  :hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Text = styled(UnderlineText)<{ active: boolean }>`
  ${props =>
    props.active &&
    ` 
    color: #2fccdc;
    &:after {
    content: '';
    display: block;
    width: 100%;
    height: 1px;
    margin-top: 3px;
    background: transparent;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
    background-color: #2fccdc;
  }
   `}
`;
