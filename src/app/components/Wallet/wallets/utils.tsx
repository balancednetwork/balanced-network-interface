import { TabList, Tab } from '@reach/tabs';
import styled, { css } from 'styled-components';

import { Link } from 'app/components/Link';

export const StyledTabList = styled(TabList)`
  &[data-reach-tab-list] {
    width: 100%;
    background: transparent;
  }
`;

export const StyledTab = styled(Tab)<{ hasNotification?: boolean }>`
  &[data-reach-tab] {
    box-sizing: border-box;
    padding: 0 5px 10px;
    margin-right: 0px;
    border-bottom: 3px solid #144a68;
    color: rgba(255, 255, 255, 0.75);
    background-color: transparent;
    transition: border-bottom 0.3s ease, color 0.3s ease;
    position: relative;

    ${({ theme }) => theme.mediaWidth.up360`
      padding: 0 8px 10px;
    `};

    ${({ theme }) => theme.mediaWidth.up500`
      padding: 0 15px 10px 15px;
    `};

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
      top: 5px;
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

export const notificationCSS = css`
  position: relative;

  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.8);
    }
  }

  &:before,
  &:after {
    content: '';
    position: absolute;
    display: inline-block;
    transition: all ease 0.2s;
    top: 7px;
  }

  &:before {
    width: 10px;
    height: 10px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    right: 1px;
  }

  &:after {
    width: 10px;
    height: 10px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    right: 1px;
    animation: pulse 1s ease 1s infinite;
  }
`;
