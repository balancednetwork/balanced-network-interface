import React from 'react';

import { NavLink } from 'react-router-dom';
import { Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { ReactComponent as HomeIcon } from 'assets/icons/home.svg';
import { ReactComponent as TradeIcon } from 'assets/icons/trade.svg';
import { ReactComponent as VoteIcon } from 'assets/icons/vote.svg';

const Navigation = styled.nav`
  display: inline-block;
  width: 100px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: initial;
  `}
`;

const List = styled.ul`
  width: 100%;
  border: 1px solid #2395aa;
  box-shadow: 0 2.8px 2.2px rgba(0, 0, 0, 0.068), 0 6.7px 5.3px rgba(0, 0, 0, 0.096), 0 12.5px 10px rgba(0, 0, 0, 0.12),
    0 22.3px 17.9px rgba(0, 0, 0, 0.144), 0 41.8px 33.4px rgba(0, 0, 0, 0.172), 0 100px 80px rgba(0, 0, 0, 0.24);
  border-radius: 20px;
  padding: 0;
  margin: 0;
  background-color: #0c2a4d;
`;

const ListItem = styled.li`
  &::before {
    content: '';
  }

  margin-bottom: 15px;
  margin-right: 0;

  &:last-child {
    margin-bottom: 0;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: inline-block;
    margin-bottom: 0;
    margin-right: 3px;

    &:last-child {
      margin-right: 0;
    }
  `}
`;

const activeClassName = 'ACTIVE';

const StyledNavLink = styled(NavLink).attrs({ activeClassName })`
  display: block;
  margin-left: 50%;
  transform: translate(-50%);
  padding: 10px;
  width: 114px;
  border-radius: 20px;
  color: #8695a6;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 14px;

  &.${activeClassName} {
    color: #01002a;
    background-color: #2395aa;
    opacity: 1;
  }

  :hover,
  :focus {
    color: #01002a;
    background-color: #2395aa;
    opacity: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100px;
    padding: 5px;
  `}
`;

export function AppBar() {
  return (
    <Navigation>
      <List>
        <ListItem>
          <StyledNavLink exact to="/">
            <HomeIcon width="30" height="35" />
            <Text>Home</Text>
          </StyledNavLink>
        </ListItem>

        <ListItem>
          <StyledNavLink exact to="/vote">
            <VoteIcon width="30" height="35" />
            <Text>Vote</Text>
          </StyledNavLink>
        </ListItem>

        <ListItem>
          <StyledNavLink exact to="/trade">
            <TradeIcon width="30" height="35" />
            <Text>Trade</Text>
          </StyledNavLink>
        </ListItem>
      </List>
    </Navigation>
  );
}
