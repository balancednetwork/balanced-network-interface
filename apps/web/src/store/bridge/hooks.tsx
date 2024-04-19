import React, { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { SupportedXCallChains } from 'app/_xcall/types';
import { AppState } from 'store';
import { setRecipient, selectCurrency, typeInput, selectChain, Field, switchChain, selectPercent } from './reducer';
import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { Trans, t } from '@lingui/macro';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { isDenomAsset } from 'app/_xcall/archway/utils';

export function useBridgeState(): AppState['bridge'] {
  return useSelector((state: AppState) => state.bridge);
}

export function useBridgeDirection() {
  const state = useBridgeState();
  return useMemo(() => {
    return {
      from: state[Field.FROM].chain,
      to: state[Field.TO].chain,
    };
  }, [state]);
}

export function useBridgeActionHandlers() {
  const dispatch = useDispatch();

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient(recipient));
    },
    [dispatch],
  );

  const onCurrencySelection = useCallback(
    (currency: Currency | undefined) => {
      dispatch(
        selectCurrency({
          currency: currency,
        }),
      );
    },
    [dispatch],
  );

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput(typedValue));
    },
    [dispatch],
  );

  const onChainSelection = useCallback(
    (field: Field, chain: SupportedXCallChains) => {
      dispatch(
        selectChain({
          field,
          chain,
        }),
      );
    },
    [dispatch],
  );

  const onSwitchChain = useCallback(() => {
    dispatch(switchChain());
  }, [dispatch]);

  const onPercentSelection = useCallback(
    (field: Field, percent: number, value: string) => {
      dispatch(selectPercent({ field, percent, value }));
    },
    [dispatch],
  );

  return {
    onChangeRecipient,
    onCurrencySelection,
    onUserInput,
    onChainSelection,
    onSwitchChain,
    onPercentSelection,
  };
}

export function useDerivedBridgeInfo() {
  const state = useBridgeState();
  const bridgeDirection = useBridgeDirection();
  const { typedValue, currency: currencyToBridge, recipient } = state;

  const currencyAmountToBridge = React.useMemo(() => {
    if (currencyToBridge && typedValue && !Number.isNaN(parseFloat(typedValue))) {
      return CurrencyAmount.fromRawAmount(
        currencyToBridge.wrapped,
        new BigNumber(typedValue).times(10 ** currencyToBridge.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [typedValue, currencyToBridge]);

  const signedInWallets = useSignedInWallets();
  const crossChainWallet = useCrossChainWalletBalances();

  const errorMessage = useMemo(() => {
    if (currencyAmountToBridge) {
      if (currencyAmountToBridge.equalTo(0)) {
        return t`Enter amount`;
      } else {
        if (
          signedInWallets.some(
            wallet =>
              wallet.chain === bridgeDirection.from &&
              (!crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address] ||
                crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address]?.lessThan(
                  currencyAmountToBridge,
                )),
          )
        ) {
          return t`Insufficient ${currencyAmountToBridge.currency.symbol}`;
        } else {
          return undefined;
        }
      }
    } else {
      return t`Enter amount`;
    }
  }, [bridgeDirection.from, crossChainWallet, currencyAmountToBridge, signedInWallets]);

  const isAvailable = useMemo(() => {
    if (!signedInWallets.some(wallet => wallet.chain === bridgeDirection.to)) return false;
    if (recipient === '') return false;

    return true;
  }, [bridgeDirection.to, recipient, signedInWallets]);

  const selectedTokenWalletBalance = React.useMemo(() => {
    if (currencyToBridge) {
      return crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    }
  }, [bridgeDirection.from, crossChainWallet, currencyToBridge]);

  const isDenom = currencyAmountToBridge && isDenomAsset(currencyAmountToBridge.currency);

  return {
    errorMessage,
    isAvailable,
    currencyAmountToBridge,
    selectedTokenWalletBalance,
    isDenom,
  };
}
