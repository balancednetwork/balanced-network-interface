import styled, { css, keyframes } from 'styled-components';
import SearchInput from '../SearchModal/SearchInput';

const mobileWalletBreakpoint = '640px';

export const MainLogo = styled.div`
  img, svg {
    max-height: 45px
  }
`;

export const ActionDivider = styled.div<{ text: string }>`
  position: relative;
  padding-left: 42px;
  margin: 2px 0;

  &:before {
    content: '';
    display: block;
    position: absolute;
    height: 1px;
    width: 35px;
    background-color: rgba(255, 255, 255, 0.25);
    left: 0;
    top: 14px;
  }

  &:after {
    content: '${props => props.text}';    
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.75);
  }
`;

export const WalletActions = styled.div`
  padding-top: 5px;
  width: 100%;

  .wallet-options {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  ${ActionDivider} {
    display: none;
  }

  @media screen and (min-width: ${mobileWalletBreakpoint}) {
    margin-left: auto;
    width: auto;
    padding-top: 5px;

    .wallet-options {
      padding-top: 0;
      flex-direction: column;
      align-items: flex-end;
    }

    ${ActionDivider} {
      display: block;
    }
  }
`;

export const WalletItemGrid = styled.div`
  padding: 15px 0;

  @media screen and (min-width: ${mobileWalletBreakpoint}) {
    display: flex;
    flex-wrap: wrap;
  }

  ${MainLogo} {
    display: none;
    
    @media screen and (min-width: ${mobileWalletBreakpoint}) {
      max-width: 60px;
      display: block;
    }
  }

  @media screen and (min-width: ${mobileWalletBreakpoint}) {
    display: grid;
    grid-template-columns: 50px auto 130px;
    align-items: center;
  }
`;
export const ActiveIndicator = styled.div<{ active: boolean }>`
  position: relative;
  transition: opacity 0.2s ease;

  ${({ active }) =>
    active &&
    css`
      cursor: default !important;
      animation: ${pulseAnimation} 1s infinite;
  `};
`;

export const XChainsWrap = styled.div<{ signedIn: boolean }>`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  background: ${({ theme }) => theme.colors.bg4};
  border-radius: 10px;
  padding: 2px 10px;
  margin-top: 10px;
  margin-bottom: 5px;

  ${({ signedIn }) =>
    signedIn &&
    css`
    ${ActiveIndicator} {
      cursor: pointer;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  `};

  img {
    margin: 5px 8px;
  }

  @media screen and (min-width: ${mobileWalletBreakpoint}) {
    max-width: 236px;
    margin-bottom: 0;
  }
`;

const pulseAnimation = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
`;

export const StyledSearchInput = styled(SearchInput)`
  background-color: ${({ theme }) => theme.colors.bg6};
  border-color: ${({ theme }) => theme.colors.bg6};
`;

export const Wrapper = styled.div`
  width: 100%;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const SignInOptionsWrap = styled.div`
  background: ${({ theme }) => theme.colors.bg6};
  padding: 5px 25px;
  min-height: 60px;
  max-height: 350px;
  overflow-y: scroll;
  border-radius: 10px;
  /* box-shadow: 0px 10px 15px 0px rgba(1, 0, 42, 0.25) inset; */
`;
