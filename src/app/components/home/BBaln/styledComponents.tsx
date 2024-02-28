import { Box, Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { Typography } from 'app/theme';

import { MetaData } from '../PositionDetailPanel';

export const ButtonsWrap = styled(Flex)<{ verticalButtons?: boolean }>`
  margin-left: auto;
  flex-direction: row;
  ${({ verticalButtons }) =>
    verticalButtons &&
    css`
      @media screen and (max-width: 400px) {
        flex-direction: column;
      } ;
    `};
`;

export const SliderWrap = styled(Box)<{ sliderBg?: string; sliderMargin?: string }>`
  ${({ sliderMargin }) => (sliderMargin ? `margin: ${sliderMargin};` : 'margin: 25px 0;')}
  .noUi-horizontal .noUi-connects {
    ${({ sliderBg }) => sliderBg && `background: ${sliderBg};`}
  }
  .lockup-notice {
    /* transition: all ease 0.2s; */
    opacity: 0;
    transform: translate3d(0, -5px, 0);
    &.show {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
`;

export const BoostedInfo = styled(Flex)<{ showBorder?: boolean }>`
  ${({ showBorder }) =>
    showBorder &&
    css`
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    `};

  width: 100%;
  position: relative;
  flex-wrap: wrap;
`;

export const BoostedBox = styled(Flex)`
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  flex-flow: column;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  width: 33.333%;
  &.no-border {
    border-right: 0;
  }
  @media screen and (max-width: 600px) {
    width: 100%;
    border-right: 0;
    margin-bottom: 20px;
    &.no-border {
      border-right: 0;
      margin-bottom: 0;
    }
  }
`;

export const StyledTypography = styled(Typography)`
  position: relative;
  padding: 0 20px;
  margin: 0 -20px;
  svg {
    position: absolute;
    right: 0;
    top: 3px;
    cursor: help;
  }
`;

export const PoolItem = styled(Flex)`
  min-width: 120px;
  width: 100%;
  max-width: 25%;
  padding: 15px 15px 0 15px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  @media screen and (max-width: 600px) {
    max-width: 33.333%;
  }
  @media screen and (max-width: 500px) {
    max-width: 50%;
  }
  @media screen and (max-width: 360px) {
    max-width: 100%;
  }
`;

export const BalnPreviewInput = styled.input`
  background: ${({ theme }) => theme.colors.bg5};
  padding: 3px 10px;
  border-radius: 10px;
  border: 2px solid ${({ theme }) => theme.colors.bg5};
  color: #d5d7db;
  font-size: 14px;
  text-align: right;
  width: 80px;
  outline: none;
  margin-right: 4px;
  transition: all ease 0.2s;
  &:focus,
  &:hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
  }
  &[disabled] {
    background: transparent;
  }
`;

export const Threshold = styled(Box)<{ position: number; flipTextDirection?: boolean }>`
  left: ${({ position }) => position + '%'};
  position: absolute;
  width: 1px;
  height: 25px;
  margin-top: -15px;
  background: #fff;
  ::after {
    position: absolute;
    content: '';
    top: 0;
    width: 10px;
    height: 1px;
    margin-left: -10px;
    transition: height 0.3s ease;
    background: #fff;
  }
  ${MetaData} {
    width: 60px;
    margin-left: -75px;
    dd {
      color: rgba(255, 255, 255, 1);
    }
  }

  ${({ flipTextDirection }) =>
    flipTextDirection &&
    css`
      ::after {
        margin-left: 0;
      }

      ${MetaData} {
        margin-left: 5px;
      }
    `};
`;

export const LiquidityDetailsWrap = styled(Box)<{ show?: boolean }>`
  display: none;
  width: 100%;
  justify-content: center;
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 20px;
  width: 100%;
  text-align: right;
  z-index: -1;
  pointer-events: none;
  transition: all ease 0.2s;
  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    display: block;
    opacity: 0;
  `};
  ${({ show }) =>
    show &&
    css`
      display: flex;
      z-index: 1;
      opacity: 1;
      pointer-events: all;
      ${({ theme }) => theme.mediaWidth.upExtraSmall`
      opacity: 1;
    `};
    `}
  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid ${({ theme }) => theme.colors.primary};
    position: absolute;
    bottom: 100%;
    margin-bottom: -2px;
    right: calc(16.666% - 13px);
    @media screen and (max-width: 600px) {
      right: calc(50% - 12px);
    }
  }
`;

export const LiquidityDetails = styled(Flex)`
  display: inline-flex;
  flex-wrap: wrap;
  padding: 0 15px 15px 15px;
  background: ${({ theme }) => theme.colors.bg2};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  width: auto;
`;
