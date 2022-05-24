import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { Typography } from 'app/theme';
import { ReactComponent as ArrowDown } from 'assets/icons/arrow-down.svg';

export const Label = styled(Typography)`
  margin-bottom: 10px;
`;
const Select = styled(Flex)`
  z-index: 3;
`;

const StyledArrowDown = styled(ArrowDown)`
  width: 10px;
  margin-left: 6px;
  margin-top: 5px;
`;

const Selected = styled(Flex)`
  line-height: 18px;
  font-weight: 700;
  color: #ffffff;
  height: 40px;
  align-items: center;
  border-radius: 10px;
  cursor: pointer;
  transition: all ease 0.3s;
  width: 100%;
  font-size: 14px;

  ${({ theme }) => css`
    background: ${theme.colors.bg5};
    border: 2px solid ${theme.colors.bg5};
  `};
`;

const AssetSelector = ({ assetName, toggleDropdown, closeDropdown }) => {
  return (
    <>
      <ClickAwayListener onClickAway={closeDropdown}>
        <Select>
          <Selected onClick={toggleDropdown}>
            {assetName}
            <StyledArrowDown />
          </Selected>
        </Select>
      </ClickAwayListener>
    </>
  );
};

export default AssetSelector;