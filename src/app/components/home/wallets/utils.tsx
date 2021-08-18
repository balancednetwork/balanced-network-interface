import { TabList, Tab } from '@reach/tabs';
import styled from 'styled-components';

import { Link } from 'app/components/Link';

import { notificationCSS } from '../WalletPanel';

export const StyledTabList = styled(TabList)`
  &[data-reach-tab-list] {
    width: 100%;
    background: transparent;
  }
`;

export const StyledTab = styled(Tab)<{ hasNotification?: boolean }>`
  &[data-reach-tab] {
    box-sizing: border-box;
    padding: 10px 15px;
    padding-top: 0;
    margin-right: 0px;
    border-bottom: 3px solid #144a68;
    color: rgba(255, 255, 255, 0.75);
    background-color: transparent;
    transition: border-bottom 0.3s ease, color 0.3s ease;
    position: relative;

    &[data-selected] {
      border-bottom: 3px solid #2ca9b7;
      color: #ffffff;
      transition: border-bottom 0.2s ease, color 0.2s ease;
    }

    :hover {
      border-bottom: 3px solid #2ca9b7;
      color: #ffffff;
      transition: border-bottom 0.2s ease, color 0.2s ease;
    }

    ${({ theme }) => theme.mediaWidth.upExtraSmall`
        margin-right: 15px;
    `}

    ${({ hasNotification }) => hasNotification && notificationCSS}
    
    &:after, &:before {
      right: -4px;
    }
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-auto-rows: auto;
  row-gap: 15px;
`;

export const MaxButton = styled(Link)`
  cursor: pointer;
`;
