import styled from 'styled-components';
import { Link } from 'app/components/Link';
import { Box, Flex } from 'rebass';
import { Typography } from 'app/theme';
import { BoxPanel } from '../Panel';
import { notificationCSS } from './ICONWallets/utils';

export const walletBreakpoint = '385px';
const modalWalletBreakpoint = '400px';

export const WalletButton = styled(Link)`
  cursor: pointer;
`;

export const WalletWrap = styled(Box)`
  width: 400px;
  max-width: calc(100vw - 4px);
`;
export const WalletMenu = styled.div`
  font-size: 14px;
  padding: 25px 25px 15px 25px;
  display: flex;
  flex-wrap: wrap;
`;

export const WalletButtons = styled(Flex)`
  display: flex;
  align-items: center;
`;

export const WalletContent = styled(Box)`
  padding: 0 0 25px;
`;

export const WalletAssets = styled(Box)`
  padding: 0 25px;
  input {
    font-size: 14px;
  }
`;

export const HeaderText = styled(Typography)`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 3px;
  white-space: nowrap;
`;

export const DashGrid = styled(Box)`
  display: grid;
  grid-template-columns: 3fr 4fr;
  grid-template-areas: 'asset balance&value';
  align-items: center;
  @media screen and (max-width: ${walletBreakpoint}) {
    grid-template-columns: 3fr 5fr;
  }
  & > * {
    justify-content: flex-end;
    text-align: right;
    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

export const DataText = styled(Typography)<{ $fSize?: string }>`
  font-size: ${({ $fSize }) => $fSize || '14px'};
`;

export const BalanceAndValueWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  ${DataText}, ${HeaderText} {
    width: 50%;
    @media screen and (max-width: ${walletBreakpoint}) {
      width: 100%;
      &.value {
        opacity: 0.7;
      }
    }
  }
`;

export const List = styled(Box)`
  max-height: 400px;
  overflow-y: auto;
  padding: 0 25px;
`;

export const ListItem = styled(DashGrid)<{ $border?: boolean }>`
  padding: 20px 0;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;
  border-bottom: ${({ $border = true }) => ($border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
  @media screen and (max-width: ${walletBreakpoint}) {
    padding: 15px 0;
  }
  &.active {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const StandardCursorListItem = styled(DashGrid)<{ $border?: boolean }>`
  padding: 20px 0;
  cursor: default; // Standard cursor style
  color: #ffffff;
  transition: all 0.2s ease;
  border-bottom: ${({ $border = true }) => ($border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
  @media screen and (max-width: ${walletBreakpoint}) {
    padding: 15px 0;
  }
  &.active {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const AssetSymbol = styled.div<{ $hasNotification?: boolean }>`
  display: grid;
  grid-column-gap: 12px;
  grid-template-columns: auto 1fr;
  align-items: center;
  position: relative;
  ${({ $hasNotification }) => $hasNotification && notificationCSS}
  &:before, &:after {
    right: initial;
    left: 18px;
    top: -3px;
    z-index: 5;
  }
`;

export const ModalContent = styled(Box)`
  padding: 25px;
  width: 100%;
  button[role='tab'] {
    border-left: 0;
    border-top: 0;
    border-right: 0;
  }
  ${AssetSymbol} {
    &:before,
    &:after {
      display: none;
    }
  }
  @media screen and (max-width: ${modalWalletBreakpoint}) {
    padding: 15px;
  }
`;

export const BoxPanelWithArrow = styled(BoxPanel)`
  position: relative;
  width: 100%;
  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid #144a68;
    position: absolute;
    transition: all ease-in-out 200ms;
    top: 0;
    left: 34px;
    margin-top: -12px;
  }
  @media screen and (max-width: ${modalWalletBreakpoint}) {
    width: calc(100% + 30px);
    margin: 0 -15px -15px -15px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    padding: 15px;
    &:before {
      left: 50px;
    }
  }
`;

export const Wrapper = styled.div``;

export const BalanceBreakdown = styled.div<{ $arrowPosition: string }>`
  background: ${({ theme }) => theme.colors.bg3};
  border-radius: 10px;
  padding: 5px 15px 7px 10px;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: -12px;
    left: 30px;
    left: ${({ $arrowPosition }) => $arrowPosition};
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid ${({ theme }) => theme.colors.bg3};
    transition: all 0.3s ease-in-out;
  }

  ${DashGrid} {
    grid-template-columns: 11fr 12fr;
    @media screen and (max-width: ${walletBreakpoint}) {
      grid-template-columns: 14fr 15fr;
    }
  }

  ${ListItem} {
    padding: 9px 0;
  }
`;
