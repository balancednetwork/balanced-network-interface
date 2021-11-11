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
import { PairInfo, SUPPORTED_PAIRS } from 'constants/pairs';
import useWidth from 'hooks/useWidth';
import { useAllPairsAPY } from 'queries/reward';
import { resetMintState } from 'store/mint/actions';
import { useSetPair, usePoolPair } from 'store/pool/hooks';

export default function PairSelector() {
  const upSmall = useMedia('(min-width:768px)');
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const selectedPair = usePoolPair();
  const setPair = useSetPair();
  const dispatch = useDispatch();

  const handleSelectPair = (pair: PairInfo) => {
    toggleOpen();
    setPair(pair);
    dispatch(resetMintState());
  };

  const apys = useAllPairsAPY();

  const [ref, width] = useWidth();

  return (
    <Flex alignItems="flex-end" ref={ref}>
      <Typography variant="h2">Supply:&nbsp;</Typography>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <div>
          <StyledWrapper onClick={toggleOpen}>
            <Text active={open}>{selectedPair.name}</Text>
            <StyledArrowDownIcon />
          </StyledWrapper>

          <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom" offset={[0, 10]}>
            <List style={{ width: (width ?? 0) + (upSmall ? 40 : 20) }}>
              <DashGrid>
                <HeaderText>POOL</HeaderText>
                <HeaderText textAlign="right">APY</HeaderText>
              </DashGrid>
              {SUPPORTED_PAIRS.map(pair => (
                <ListItem key={pair.id} onClick={() => handleSelectPair(pair)}>
                  <DataText variant="p" fontWeight="bold">
                    {pair.name}
                  </DataText>
                  <DataText variant="p" textAlign="right">
                    {apys && apys[pair.id] ? apys[pair.id].times(100).dp(2).toFormat() : '-'}%
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
