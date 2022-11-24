import React from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { FlexPanel } from 'app/components/Panel';
import { HeaderText } from 'app/components/trade/LiquidityDetails';
import { notificationCSS } from 'app/components/Wallet/wallets/utils';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';

export const Grid = styled(Box)`
  display: grid;
  grid-gap: 35px;
  grid-template-columns: 1fr 1fr 1fr;
  justify-items: stretch;
`;

export const ProposalPreview = styled(FlexPanel)<{ noHover?: boolean }>`
  ${({ theme, noHover }) => css`
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;

    &:before {
      content: '';
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      border: 3px solid ${theme.colors.primary};
      transition: all 0.3s ease;
      transform: scale(1.033);
      border-radius: 10px;
      opacity: 0;
    }

    ${!noHover &&
    css`
      &:hover {
        &:before {
          transform: scale(1);
          opacity: 1;
        }
      }
    `}
  `};
`;

export const StyledTypography = styled(Typography)<{ notification: boolean }>`
  position: relative;
  ${({ notification }) => notification && notificationCSS};
  &:before,
  &:after {
    left: -25px;
    top: -20px;
  }
`;

export const VotingGrid = styled(Flex)<{ auth: boolean }>`
  display: grid;
  ${({ auth }) =>
    auth
      ? css`
          grid-template-columns: 5fr 4fr 4fr 3fr;
        `
      : css`
          grid-template-columns: 5fr 8fr 3fr;
        `};

  grid-column-gap: 35px;

  & > * {
    text-align: right;

    &:first-of-type {
      text-align: left;
    }
  }
`;

export const GirdHeaderItem = styled(HeaderText)``;

export const StyledQuestionIcon = styled(QuestionIcon)`
  cursor: help;
`;

export const VoteItemWrap = styled(Box)`
  padding: 20px 0;
`;

export const AllocationInput = styled.input<{ valid: boolean }>`
  ${({ theme, valid }) => css`
    background: ${theme.colors.bg5};
    border: 2px solid ${theme.colors.bg5};
    border-radius: 10px;
    outline: none;
    color: ${valid ? '#FFFFFF' : '#fb6a6a'};
    padding-left: 15px;
    height: 40px;
    transition: all ease 0.3s;
    text-align: center;

    &:focus,
    &:hover {
      outline: none;
      /* border: 2px solid ${theme.colors.primary}; */
    }

    ::placeholder {
      padding-left: 15px;
    }
  `};
`;

export const VotingButtons = styled(Flex)`
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: 10px;

  button {
    font-size: 14px;
    padding: 4px 15px 5px 15px;

    &:first-of-type {
      padding-left: 0;
    }
  }
`;

const Loader = styled.span`
  @keyframes blink {
    0% {
      opacity: 0;
      transform: scale(0.4);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.4);
    }
  }

  span {
    animation: blink 2s infinite;
    display: inline-flex;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #ffffff;
    margin-left: 3px;
  }

  span:nth-of-type(1) {
    animation-delay: 100ms;
  }
  span:nth-of-type(2) {
    animation-delay: 250ms;
  }
  span:nth-of-type(3) {
    animation-delay: 400ms;
  }
`;

export const LoaderComponent = () => (
  <Loader>
    <span></span>
    <span></span>
    <span></span>
  </Loader>
);
