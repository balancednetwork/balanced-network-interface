import styled, { css } from 'styled-components';

import { Flex } from 'rebass/styled-components';
import { AutoColumn } from '../Column';
import { RowBetween } from '../Row';

export const TextDot = styled.div`
  height: 3px;
  width: 3px;
  background-color: ${({ theme }) => theme.colors.text2};
  border-radius: 50%;
`;

export const Checkbox = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.alert};
  height: 20px;
  margin: 0;
`;

export const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
`;

export const MenuItem = styled(RowBetween)`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) auto minmax(0, 72px);
  grid-gap: 16px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  &:hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.colors.bg2};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`;

export const SearchInput = styled.input`
  position: relative;
  display: flex;
  padding: 16px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  border-radius: 20px;
  color: ${({ theme }) => theme.colors.text1};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.colors.bg3};
  -webkit-appearance: none;

  font-size: 18px;

  ::placeholder {
    color: ${({ theme }) => theme.colors.text};
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

export const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.bg2};
`;

export const SeparatorDark = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.bg3};
`;

export const HeaderText = styled(Flex)<{ className?: string }>`
  display: flex;
  font-size: 14px;
  color: #d5d7db;
  letter-spacing: 3px;
  text-transform: uppercase;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all ease 200ms;
  padding-left: 15px;
  white-space: nowrap;

  &:before,
  &:after,
  span:after,
  span:before {
    content: '';
    position: absolute;
    width: 8px;
    height: 2px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.primary};
    display: inline-block;
    top: 50%;
    transition: all ease 200ms;
    right: 0;
    transform-origin: center;
    opacity: 0;
    transform: rotate(0) translate3d(0, 0, 0);
  }

  ${props =>
    props.className === 'ASC' &&
    css`
      padding-right: 15px;
      padding-left: 0;
      &:before,
      &:after,
      span:after,
      span:before {
        opacity: 1;
      }

      &:before,
      span:before {
        transform: rotate(-45deg) translate3d(-2px, -3px, 0);
      }

      &:after,
      span:after {
        transform: rotate(45deg) translate3d(0px, -1px, 0);
      }
    `};

  ${props =>
    props.className === 'DESC' &&
    css`
      padding-right: 15px;
      padding-left: 15px;
      &:before,
      &:after,
      span:after,
      span:before {
        opacity: 1;
      }

      &:before,
      span:before {
        transform: rotate(45deg) translate3d(-3px, 2px, 0);
      }

      &:after,
      span:after {
        transform: rotate(-45deg) translate3d(1px, 0, 0);
      }
    `};

  &:first-of-type {
    padding-left: 0;
    &::before,
    &::after {
      display: none;
    }

    span {
      position: relative;

      &::before,
      &:after {
        margin-right: -15px;
      }
    }
  }
`;

export const XChainLogoList = styled.div`
  >* {
    margin: 2px 7px 2px 0;
  }
`;
