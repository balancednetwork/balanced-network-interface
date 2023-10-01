import React from 'react';

import { Trans } from '@lingui/macro';
import { NavLink, useLocation } from 'react-router-dom';
import { Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { ReactComponent as HomeIcon } from 'assets/icons/home.svg';
import { ReactComponent as TradeIcon } from 'assets/icons/trade.svg';
import { ReactComponent as VoteIcon } from 'assets/icons/vote.svg';
import { useActiveProposals } from 'queries/vote';
import { useBBalnAmount } from 'store/bbaln/hooks';

import { notificationCSS } from '../ICONWallet/wallets/utils';

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
  padding: 10px 10px;
  width: 80px;
  border-radius: 25px;
  color: #8695a6;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 14px;

  svg {
    display: none;
  }

  ${({ theme }) => theme.mediaWidth.up360`
    width: 100px;
    svg {
      display: inline-block;
    }
  `};

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

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    width: 114px;
    padding: 10px 15px;
  `}

  ${({ theme }) => theme.mediaWidth.upLarge`
    width: 114px;
    padding: 15px;
  `}

  > svg {
    margin-bottom: 5px;
  }
`;

const StyledNavLinkWithNotification = styled(({ hasNotification, ...rest }) => <StyledNavLink {...rest} />)<{
  hasNotification?: boolean;
}>`
  ${({ theme, hasNotification }) =>
    hasNotification &&
    `
    ${notificationCSS}
    &:before, &:after {
      pointer-events: none;
      z-index: 10;
      background-color: ${theme.colors.primary};
      right: 25px;
      top: 10px;
    }

    &:hover, &.${activeClassName} {
      &:before, &:after {
        background-color: ${theme.colors.bg1}
      }
    }
  `}
`;

export default React.memo(function AppBar() {
  const useActiveProposalsQuery = useActiveProposals();
  const { data: activeProposals } = useActiveProposalsQuery;
  const bBalnAmount = useBBalnAmount();
  const location = useLocation();

  const closeWalletHelper = () => {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    const cb = document.getElementById('root');
    cb?.dispatchEvent(event);
  };

  return (
    <Navigation>
      <List onClick={closeWalletHelper}>
        <ListItem>
          <StyledNavLink exact to="/">
            <HomeIcon width="35" height="33" />
            <Text>
              <Trans>Home</Trans>
            </Text>
          </StyledNavLink>
        </ListItem>
        <ListItem>
          <StyledNavLink to="/trade" onClick={e => location.pathname.startsWith('/trade') && e.preventDefault()}>
            <TradeIcon width="35" height="33" />
            <Text>
              <Trans>Trade</Trans>
            </Text>
          </StyledNavLink>
        </ListItem>
        <ListItem>
          <StyledNavLinkWithNotification
            exact
            to="/vote"
            hasNotification={activeProposals && activeProposals.length && bBalnAmount.isGreaterThan(0)}
          >
            <VoteIcon width="35" height="33" />
            <Text>
              <Trans>Vote</Trans>
            </Text>
          </StyledNavLinkWithNotification>
        </ListItem>
      </List>
    </Navigation>
  );
});
