import React, { useEffect } from 'react';

import BigNumber from 'bignumber.js';
import { useFromNetwork } from 'btp/src/store/bridge/hooks';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { inputRegex } from 'app/components/CurrencyInputPanel';
import { UnderlineText } from 'app/components/DropdownText';
import { SelectorPopover } from 'app/components/Popover';
import useWidth from 'hooks/useWidth';
import { COMMON_PERCENTS } from 'store/swap/actions';
// import { Currency } from 'types/balanced-sdk-core';
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
  :disabled {
    border-color: rgb(6 9 56 / 30%);
    background: rgb(62 63 84 / 20%);
    color: #b1b1b1;
  }
`;

export const AssetName = styled(Flex)<{ isDisabled?: boolean }>`
  font-weight: 700;
  color: #fff;
  border: 2px solid #021338;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px 0 0 10px;
  align-items: center;
  padding: 3px 20px;
  font-size: 14px;
  width: 145px;
  ${props =>
    !props.isDisabled &&
    css`
      cursor: pointer;
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
  height: 43px;
  width: 100%;
  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
`;

const ItemList = styled(Option)<{ selected: boolean }>`
  ${props => props.selected && ' background-color: #2ca9b7;'}
`;

const AssetToTransfer = ({
  assetName,
  balanceOfAssetName,
  toggleDropdown,
  closeDropdown,
  setBalance,
  balance,
  onPercentSelect,
  percent,
  fee,
  disabled,
}) => {
  const [isActive, setIsActive] = React.useState(false);

  const fromNetwork = useFromNetwork();

  useEffect(() => {
    setBalance('');
  }, [balanceOfAssetName, setBalance]);

  const onUserInput = (input: string) => {
    setBalance(input);
  };

  const [ref] = useWidth();

  const handlePercentSelect = (instant: number) => (e: React.MouseEvent) => {
    if (!balanceOfAssetName) return;
    const amount = new BigNumber(balanceOfAssetName).times(instant).div(100);
    const totalAmount = amount.plus(new BigNumber(fee));
    const isInsufficientAmount = totalAmount.isGreaterThan(balanceOfAssetName);

    const result = isInsufficientAmount ? new BigNumber(balanceOfAssetName).minus(new BigNumber(fee)) : amount;
    setBalance(result.dp(4).toFormat());
  };

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput);
    }
  };

  return (
    <>
      {fromNetwork && (
        <Flex justifyContent={'end'}>
          <Label>
            Wallet:{' '}
            <WalletAmount onClick={handlePercentSelect(100)}>
              {!balanceOfAssetName ? 0 : new BigNumber(balanceOfAssetName).toFixed(4)} {assetName}
            </WalletAmount>
          </Label>
        </Flex>
      )}
      <AssetInfo ref={ref}>
        <ClickAwayListener onClickAway={closeDropdown}>
          <AssetName onClick={toggleDropdown}>
            <Icon icon={assetName} margin={'0 8px 0 0'} />
            <AssetSelector assetName={assetName} />
          </AssetName>
        </ClickAwayListener>
        <NumberInput
          placeholder="0"
          value={balance}
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
          disabled={disabled}
        />
        {onPercentSelect && (
          <SelectorPopover show={isActive} anchorEl={ref.current} placement="bottom-end">
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
        )}
      </AssetInfo>
    </>
  );
};

export default AssetToTransfer;
