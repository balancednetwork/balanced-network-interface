import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { inputRegex } from 'app/components/CurrencyInputPanel';
import { UnderlineText } from 'app/components/DropdownText';
import { SelectorPopover } from 'app/components/Popover';
import { ReactComponent as DropDown } from 'assets/icons/arrow-down.svg';
import useWidth from 'hooks/useWidth';
import { COMMON_PERCENTS } from 'store/swap/actions';
import { Currency } from 'types/balanced-sdk-core';
import { escapeRegExp } from 'utils';

import { HorizontalList, Option } from '../List';
import AssetSelector from './AssetSelector';
import { Icon } from './Icon';
import { Label } from './NetworkSelector';

const WalletAmount = styled(UnderlineText)`
  ${({ theme }) =>
    css`
      color: ${theme.colors.primaryBright};
    `};
`;

const NumberInput = styled.input<{ bg?: string; active?: boolean }>`
  flex: 1;
  width: 100%;
  height: 43px;
  text-align: right;
  border-radius: 0 10px 10px 0;
  border: ${({ theme, bg = 'bg2' }) => `2px solid ${theme.colors.bg5}`};
  background-color: ${({ theme }) => `${theme.colors.bg5}`};
  color: #ffffff;
  padding: 7px 20px;
  outline: none;
  transition: border 0.3s ease;
  overflow: visible;
  font-family: inherit;
  font-size: 100%;
  line-height: 1.15;
  margin: 0;
  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
  ${props => props.active && 'border-bottom-right-radius: 0;'}
`;

export const AssetName = styled(Flex)`
  font-weight: 700;
  color: #fff;
  border: 2px solid #021338;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px 0 0 10px;
  align-items: center;
  padding: 3px 20px;
  font-size: 14px;
  ${({ theme }) =>
    css`
      &:hover {
        border: 2px solid #2ca9b7;
      }
    `};
`;

export const AssetInfo = styled(Flex)`
  border-radius: 10px;
  ${({ theme }) =>
    css`
      background-color: ${theme.colors.bg5};
    `};
`;

export const AssetInput = styled.input`
  flex: 1;
  flex-grow: 1;
  text-align: right;
  border-radius: 0 10px 10px 0;
  border: ${({ theme }) => `2px solid ${theme.colors.bg5}`};
  background-color: ${({ theme }) => `${theme.colors.bg5}`};
  color: #ffffff;
  padding: 7px 20px;
  outline: none;
  transition: border 0.3s ease;
  overflow: visible;
  font-family: inherit;
  font-size: 100%;
  line-height: 1.15;
  margin: 0;
  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
`;

const ItemList = styled(Option)<{ selected: boolean }>`
  ${props => props.selected && ' background-color: #2ca9b7;'}
`;

const AssetToTransfer = ({ assetName, toggleDropdown, closeDropdown, setBalance, onPercentSelect, percent }) => {
  const [inputAmount, setInputAmount] = React.useState('');
  const [isActive, setIsActive] = React.useState(false);

  const onUserInput = (input: string) => {
    setInputAmount(input);
    setBalance(input);
  };

  const [ref, width] = useWidth();

  const handlePercentSelect = (instant: number) => (e: React.MouseEvent) => {
    onPercentSelect && onPercentSelect(instant);
  };

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput);
    }
  };

  return (
    <>
      <Flex justifyContent={'end'}>
        <Label>
          Wallet: <WalletAmount color={'red'}>{`${0} tokens`}</WalletAmount>
        </Label>
      </Flex>
      <AssetInfo>
        <AssetName>
          <Icon icon={assetName} margin={'0 8px 0 0'} />
          <AssetSelector assetName={assetName} toggleDropdown={toggleDropdown} closeDropdown={closeDropdown} />
        </AssetName>
        <NumberInput
          placeholder="0"
          value={inputAmount}
          onClick={() => setIsActive(!isActive)}
          onBlur={() => setIsActive(false)}
          onChange={event => {
            enforcer(event.target.value.replace(/,/g, '.'));
          }}
          inputMode="decimal"
          title="Token Amount"
          autoComplete="off"
          autoCorrect="off"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minLength={1}
          maxLength={79}
          spellCheck="false"
          active={onPercentSelect && isActive}
        />
        <SelectorPopover show={true} anchorEl={ref.current} placement="bottom-end">
          <HorizontalList justifyContent="center" alignItems="center">
            {COMMON_PERCENTS.map(value => (
              <ItemList
                key={value}
                onClick={handlePercentSelect(value)}
                selected={value === percent}
              >{`${value}%`}</ItemList>
            ))}
          </HorizontalList>
        </SelectorPopover>
      </AssetInfo>
    </>
  );
};

export default AssetToTransfer;
