import React from 'react';

import { NavLink } from 'react-router-dom';
import { Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { ReactComponent as HomeIcon } from 'assets/icons/home.svg';
import { ReactComponent as TradeIcon } from 'assets/icons/trade.svg';
import { ReactComponent as VoteIcon } from 'assets/icons/vote.svg';

const Navigation = styled.nav`
  display: inline-block;
  width: initial;

  ${({ theme }) => theme.mediaWidth.upLarge`
    display: block;
    width: 100px;
  `}
`;

const List = styled.ul`
  width: 100%;
  border-radius: 25px;
  padding: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.colors.bg2};
  box-shadow: 0 2.8px 2.2px rgba(0, 0, 0, 0.068), 0 6.7px 5.3px rgba(0, 0, 0, 0.096), 0 12.5px 10px rgba(0, 0, 0, 0.12),
    0 22.3px 17.9px rgba(0, 0, 0, 0.144), 0 41.8px 33.4px rgba(0, 0, 0, 0.172), 0 100px 80px rgba(0, 0, 0, 0.24);
  ${({ theme }) => theme.mediaWidth.upLarge`
    box-shadow: none;
  `}
`;

const ListItem = styled.li`
  &::before {
    content: '';
  }

  display: inline-block;
  margin-bottom: 0;
  margin-right: 3px;

  &:last-child {
    margin-right: 0;
  }

  ${({ theme }) => theme.mediaWidth.upLarge`
    display: block;
    margin-bottom: 15px;
    margin-right: 0;

    &:last-child {
      margin-bottom: 0;
    }
  `}
`;

const activeClassName = 'ACTIVE';

const StyledNavLink = styled(NavLink).attrs({ activeClassName })`
  display: block;
  margin-left: 50%;
  transform: translate(-50%);
  padding: 10px 15px;
  width: 114px;
  border-radius: 25px;
  color: #8695a6;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 14px;

  &.${activeClassName} {
    color: ${({ theme }) => theme.colors.bg1};
    background-color: ${({ theme }) => theme.colors.primary};
    opacity: 1;
  }

  :hover,
  :focus {
    color: ${({ theme }) => theme.colors.bg1};
    background-color: ${({ theme }) => theme.colors.primary};
    opacity: 1;
  }

  ${({ theme }) => theme.mediaWidth.upLarge`
    width: 114px;
    padding: 15px;
  `}

  > svg {
    margin-bottom: 5px;
  }
`;

export default React.memo(function AppBar() {
  return (
    <Navigation>
      <List>
        <ListItem>
          <StyledNavLink exact to="/">
            <HomeIcon width="35" height="33" />
            <Text>Home</Text>
          </StyledNavLink>
        </ListItem>
        <ListItem>
          <StyledNavLink exact to="/trade">
            <TradeIcon width="35" height="33" />
            <Text>Trade</Text>
          </StyledNavLink>
        </ListItem>
        <ListItem>
          <StyledNavLink to="/vote">
            <VoteIcon width="30" height="35" />
            <Text>Vote</Text>
          </StyledNavLink>
        </ListItem>
      </List>
    </Navigation>
  );
});
