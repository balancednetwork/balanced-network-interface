import React, { useCallback, useMemo } from 'react';

import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { sARCH } from '@/constants/tokens1';
import { useAssetManagerTokens } from '@/hooks/useAssetManagerTokens';
import { useSignedInWallets } from '@/hooks/useWallets';
import { AppState } from '@/store';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { XChainId, XToken } from '@/types';
import { getXAddress, getXTokenBySymbol } from '@/utils/xTokens';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccount } from '@/xwagmi/hooks';
import { isDenomAsset } from '@/xwagmi/xchains/archway/utils';
import {
  Field,
  selectChain,
  selectCurrency,
  selectLiquidFinance,
  selectPercent,
  setRecipient,
  switchChain,
  typeInput,
} from './reducer';

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

  const xAccount = useXAccount(getXChainType(bridgeDirection.from));
  const account = xAccount.address;

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

  // get output currency
  const outputCurrency = useMemo(() => {
    if (currencyToBridge) {
      return getXTokenBySymbol(bridgeDirection.to, currencyToBridge.symbol);
    }
  }, [bridgeDirection.to, currencyToBridge]);

  // get output currencyAmount
  const outputCurrencyAmount = useMemo(() => {
    if (outputCurrency && typedValue && !Number.isNaN(parseFloat(typedValue))) {
      return CurrencyAmount.fromRawAmount(
        outputCurrency,
        new BigNumber(typedValue).times(10 ** outputCurrency.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [typedValue, outputCurrency]);

  const { data: assetManager } = useAssetManagerTokens();

  const maximumBridgeAmount = useMemo(() => {
    return assetManager?.[getXAddress(outputCurrency) ?? '']?.depositedAmount;
  }, [assetManager, outputCurrency]);

  const canBridge = useMemo(() => {
    return maximumBridgeAmount && outputCurrencyAmount ? maximumBridgeAmount?.greaterThan(outputCurrencyAmount) : true;
  }, [maximumBridgeAmount, outputCurrencyAmount]);

  return {
    errorMessage,
    currencyAmountToBridge,
    selectedTokenWalletBalance,
    isDenom,
    account,
    isLiquidsARCH,
    canBridge,
    maximumBridgeAmount,
  };
}
