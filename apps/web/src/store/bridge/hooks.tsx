import React, { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { XChainId, XToken } from 'app/pages/trade/bridge/types';
import { AppState } from 'store';
import {
  setRecipient,
  selectCurrency,
  typeInput,
  selectChain,
  Field,
  switchChain,
  selectPercent,
  selectLiquidFinance,
} from './reducer';
import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { Trans, t } from '@lingui/macro';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { isDenomAsset } from 'app/_xcall/archway/utils';
import { sARCH } from 'app/pages/trade/bridge/_config/tokens';

export function useBridgeState(): AppState['bridge'] {
  return useSelector((state: AppState) => state.bridge);
}

export function useBridgeDirection() {
  const state = useBridgeState();
  return useMemo(() => {
    return {
      from: state[Field.FROM].chainId,
      to: state[Field.TO].chainId,
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
    (field: Field, chainId: XChainId) => {
      dispatch(
        selectChain({
          field,
          chainId,
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

  const onSelectLiquidFinance = useCallback(
    (v: boolean) => {
      dispatch(selectLiquidFinance(v));
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
    onSelectLiquidFinance,
  };
}

export function useDerivedBridgeInfo() {
  const state = useBridgeState();
  const bridgeDirection = useBridgeDirection();
  const { typedValue, currency: currencyToBridge, recipient } = state;

  const currencyAmountToBridge = React.useMemo(() => {
    if (currencyToBridge && typedValue && !Number.isNaN(parseFloat(typedValue))) {
      return CurrencyAmount.fromRawAmount(
        XToken.getXToken(bridgeDirection.from, currencyToBridge.wrapped),
        new BigNumber(typedValue).times(10 ** currencyToBridge.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [typedValue, currencyToBridge, bridgeDirection]);

  const signedInWallets = useSignedInWallets();
  const crossChainWallet = useCrossChainWalletBalances();

  const account = signedInWallets.find(w => w.xChainId === bridgeDirection.from)?.address;

  const errorMessage = useMemo(() => {
    if (!account) return t`Connect wallet`;

    if (!currencyAmountToBridge) return t`Enter amount`;

    if (!recipient) return t`Enter address`;

    if (currencyAmountToBridge.equalTo(0)) {
      return t`Enter amount`;
    } else {
      if (
        signedInWallets.some(
          wallet =>
            wallet.xChainId === bridgeDirection.from &&
            (!crossChainWallet[bridgeDirection.from]?.[currencyAmountToBridge.currency.address] ||
              crossChainWallet[bridgeDirection.from]?.[currencyAmountToBridge.currency.address]?.lessThan(
                currencyAmountToBridge,
              )),
        )
      ) {
        return t`Insufficient ${currencyAmountToBridge.currency.symbol}`;
      } else {
        return undefined;
      }
    }
  }, [bridgeDirection.from, crossChainWallet, currencyAmountToBridge, signedInWallets, account, recipient]);

  const selectedTokenWalletBalance = React.useMemo(() => {
    if (currencyToBridge) {
      return crossChainWallet[bridgeDirection.from]?.[currencyToBridge.wrapped.address];
    }
  }, [bridgeDirection.from, crossChainWallet, currencyToBridge]);

  const isDenom = currencyAmountToBridge && isDenomAsset(currencyAmountToBridge.currency);

  const isLiquidsARCH = Object.values(sARCH).some(token => token.address === currencyToBridge?.wrapped.address);

  return {
    errorMessage,
    currencyAmountToBridge,
    selectedTokenWalletBalance,
    isDenom,
    account,
    isLiquidsARCH,
  };
}
