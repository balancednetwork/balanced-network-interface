import React, { useCallback, useEffect, useMemo } from 'react';

import { Currency, CurrencyAmount, Fraction, Price, Token, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t } from '@lingui/macro';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useCheckSolanaAccount } from '@/app/components/SolanaAccountExistenceWarning';
import { PRICE_IMPACT_SWAP_DISABLED_THRESHOLD } from '@/constants/misc';
import { SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import { useAllXTokens } from '@/hooks/Tokens';
import { useAssetManagerTokens } from '@/hooks/useAssetManagerTokens';
import { PairState, useV2Pair } from '@/hooks/useV2Pairs';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { parseUnits } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import {
  StellarTrustlineValidation,
  bnJs,
  convertCurrency,
  getXChainType,
  useValidateStellarTrustline,
} from '@balancednetwork/xwagmi';
import { useXAccount } from '@balancednetwork/xwagmi';
import { XChainId, XToken } from '@balancednetwork/xwagmi';
import { StellarAccountValidation, useValidateStellarAccount } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { AppDispatch, AppState } from '../index';
import {
  Field,
  selectChain,
  selectCurrency,
  selectPercent,
  setRecipient,
  switchCurrencies,
  typeInput,
} from './reducer';
import { useTradeExactIn, useTradeExactOut } from './trade';

import { ALLOWED_XCHAIN_IDS, intentService } from '@/lib/intent';
import { PARTNER_FEE_PERCENTAGE } from '@/lib/sodax';
import { calculateExchangeRate, normaliseTokenAmount, scaleTokenAmount } from '@/lib/sodax/utils';
import { useAllTokensByAddress } from '@/queries/backendv2';
import { WithdrawalFloorDataType } from '@/types';
import { CallData } from '@balancednetwork/balanced-js';
import { useQuote } from '@sodax/dapp-kit';
import { SolverIntentQuoteRequest, SpokeChainId } from '@sodax/sdk';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSwapSlippageTolerance } from '../application/hooks';

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap);
}

export function useSwapActionHandlers() {
  const dispatch = useDispatch<AppDispatch>();

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currency: currency instanceof XToken ? currency : XToken.getXToken('0x1.icon', currency),
        }),
      );
    },
    [dispatch],
  );

  const onChainSelection = useCallback(
    (field: Field, xChainId: XChainId) => {
      dispatch(
        selectChain({
          field,
          xChainId,
        }),
      );
    },
    [dispatch],
  );

  const onPercentSelection = useCallback(
    (field: Field, percent: number, value: string) => {
      dispatch(selectPercent({ field, percent, value }));
    },
    [dispatch],
  );

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies());
  }, [dispatch]);

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }));
    },
    [dispatch],
  );

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }));
    },
    [dispatch],
  );

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onPercentSelection,
    onChainSelection,
  };
}

// try to parse a user entered amount for a given token
export function tryParseAmount<T extends Currency>(value?: string, currency?: T): CurrencyAmount<T> | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString();
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, BigInt(typedValueParsed));
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  // necessary for all paths to return a value
  return undefined;
}

// Fetch limits for exchange withdrawals
export function useWithdrawalsFloorDEXData(): UseQueryResult<WithdrawalFloorDataType[]> {
  const { data: allTokens, isSuccess: tokensSuccess } = useAllTokensByAddress();

  const fetchWithdrawalData = async () => {
    if (!allTokens) return;
    const USDC = SUPPORTED_TOKENS_LIST.find(token => token.symbol === 'USDC');
    const stabilityFundTokens = [USDC];
    const tokenAddresses = SUPPORTED_TOKENS_LIST.map(token => token.address);

    const cdsArray: CallData[][] = tokenAddresses.map(address => [
      { target: bnJs.Dex.address, method: 'getCurrentFloor', params: [address] },
      { target: address, method: 'balanceOf', params: [bnJs.Dex.address] },
      { target: bnJs.Dex.address, method: 'getFloorPercentage', params: [address] },
      { target: bnJs.Dex.address, method: 'getTimeDelayMicroSeconds', params: [address] },
    ]);

    const stabilityFundTokensCds = stabilityFundTokens.map(
      token =>
        token && [
          { target: bnJs.StabilityFund.address, method: 'getCurrentFloor', params: [token.address] },
          { target: token.address, method: 'balanceOf', params: [bnJs.StabilityFund.address] },
          { target: bnJs.StabilityFund.address, method: 'getFloorPercentage', params: [] },
          { target: bnJs.StabilityFund.address, method: 'getTimeDelayMicroSeconds', params: [] },
        ],
    );

    const data = await Promise.all(cdsArray.map(cds => bnJs.Multicall.getAggregateData(cds)));
    const stabilityFundData = await Promise.all(
      stabilityFundTokensCds.map(cds => cds && bnJs.Multicall.getAggregateData(cds)),
    );

    const limits = data.map((assetDataSet, index) => {
      try {
        const token = SUPPORTED_TOKENS_LIST.find(token => token.address === tokenAddresses[index]);

        if (!token) return null;

        const floor = new BigNumber(assetDataSet[0]);
        const current = new BigNumber(assetDataSet[1]);
        const percentageFloor = new BigNumber(assetDataSet[2]).div(10000);
        const floorTimeDecayInHours = new BigNumber(assetDataSet[3]).div(1000 * 1000 * 60 * 60);
        const available = CurrencyAmount.fromRawAmount(
          token,
          current.minus(floor).isNaN() ? 0 : current.minus(floor).toFixed(0),
        );

        return {
          token,
          floor,
          current,
          available,
          percentageFloor,
          floorTimeDecayInHours,
        };
      } catch (error) {
        console.error('Error fetching DEX withdrawal limits:', error);
        return null;
      }
    });

    const stabilityFundLimits = stabilityFundData.map((assetDataSet, index) => {
      try {
        const token = stabilityFundTokens[index];
        if (!token) return null;

        const floor = new BigNumber(assetDataSet[0]);
        const current = new BigNumber(assetDataSet[1]);
        const percentageFloor = new BigNumber(assetDataSet[2]).div(10000);
        const floorTimeDecayInHours = new BigNumber(assetDataSet[3]).div(1000 * 1000 * 60 * 60);
        const available = CurrencyAmount.fromRawAmount(
          token,
          current.minus(floor).isNaN() ? 0 : current.minus(floor).toFixed(0),
        );
        return {
          token,
          floor,
          current,
          available,
          percentageFloor,
          floorTimeDecayInHours,
        };
      } catch (error) {
        console.error('Error fetching Stability Fund withdrawal limits:', error);
        return null;
      }
    });

    return [...limits, ...stabilityFundLimits].filter(item => item && item.floor.isGreaterThan(0));
  };

  return useQuery({
    queryKey: [`withdrawalsFloorDEXData-${tokensSuccess ? 'tokens' : ''}`],
    queryFn: fetchWithdrawalData,
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
    enabled: tokensSuccess,
  });
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  account: string | undefined;
  trade: Trade<Currency, Currency, TradeType> | undefined;
  currencies: { [field in Field]?: XToken };
  _currencies: { [field in Field]?: Currency };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount<XToken> | undefined };
  parsedAmount: CurrencyAmount<XToken> | undefined;
  inputError?: string;
  price: Price<Token, Token> | undefined;
  direction: { from: XChainId; to: XChainId };
  dependentField: Field;
  parsedAmounts: {
    [field in Field]: CurrencyAmount<XToken> | undefined;
  };
  formattedAmounts: {
    [field in Field]: string;
  };
  canBridge: boolean;
  maximumBridgeAmount: CurrencyAmount<XToken> | undefined;
  canSwap: boolean;
  maximumOutputAmount: CurrencyAmount<Currency> | undefined;
  stellarValidation?: StellarAccountValidation;
  stellarTrustlineValidation?: StellarTrustlineValidation;
} {
  const {
    independentField,
    typedValue,
    recipient,
    [Field.INPUT]: { currency: inputCurrency, percent: inputPercent },
    [Field.OUTPUT]: { currency: outputCurrency },
  } = useSwapState();
  const account = useXAccount(getXChainType(inputCurrency?.xChainId)).address;

  const crossChainWallet = useCrossChainWalletBalances();

  const { data: withdrawalsFloorData } = useWithdrawalsFloorDEXData();

  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined);
  const currencyBalances: { [field in Field]?: CurrencyAmount<XToken> } = React.useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency ? crossChainWallet[inputCurrency.xChainId]?.[inputCurrency.address] : undefined,
      [Field.OUTPUT]: outputCurrency ? crossChainWallet[outputCurrency.xChainId]?.[outputCurrency.address] : undefined,
    };
  }, [crossChainWallet, inputCurrency, outputCurrency]);

  const currencies: { [field in Field]?: XToken } = useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency ?? undefined,
      [Field.OUTPUT]: outputCurrency ?? undefined,
    };
  }, [inputCurrency, outputCurrency]);

  const percents: { [field in Field]?: number } = React.useMemo(
    () => ({
      [Field.INPUT]: inputPercent,
    }),
    [inputPercent],
  );

  const _currencies: { [field in Field]?: Currency } = useMemo(() => {
    return {
      [Field.INPUT]:
        inputCurrency?.xChainId === '0x1.icon' ? inputCurrency : convertCurrency('0x1.icon', inputCurrency),
      [Field.OUTPUT]:
        outputCurrency?.xChainId === '0x1.icon' ? outputCurrency : convertCurrency('0x1.icon', outputCurrency),
    };
  }, [inputCurrency, outputCurrency]);

  const _parsedAmount = useMemo(
    () => tryParseAmount(typedValue, (isExactIn ? _currencies[Field.INPUT] : _currencies[Field.OUTPUT]) ?? undefined),
    [typedValue, isExactIn, _currencies],
  );

  const trade1 = useTradeExactIn(isExactIn ? _parsedAmount : undefined, _currencies[Field.OUTPUT], {
    maxHops: undefined,
  });

  const trade2 = useTradeExactOut(_currencies[Field.INPUT], !isExactIn ? _parsedAmount : undefined, {
    maxHops: undefined,
  });

  const trade = isExactIn ? trade1 : trade2;

  const swapDisabled = trade?.priceImpact.greaterThan(PRICE_IMPACT_SWAP_DISABLED_THRESHOLD);

  let inputError: string | undefined;
  if (account && !recipient) {
    inputError = t`Choose address`;
  }

  if (account && !parsedAmount) {
    inputError = t`Enter amount`;
  }

  if (account && swapDisabled) {
    inputError = t`Reduce price impact`;
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t`Select a token`;
  }

  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    tryParseAmount(trade?.inputAmount.toFixed(), trade?.inputAmount.currency.wrapped),
  ];

  // decimal scales are different for different chains for the same token
  if (
    (account && !balanceIn && amountIn?.greaterThan(0)) ||
    (balanceIn && amountIn && new BigNumber(balanceIn.toFixed()).isLessThan(amountIn.toFixed()))
  ) {
    inputError = t`Insufficient ${formatSymbol(currencies[Field.INPUT]?.symbol)}`;
  }

  //
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmount?.greaterThan(0),
  );

  if (userHasSpecifiedInputOutput && !trade) inputError = t`Swap not supported`;

  const [pairState, pair] = useV2Pair(_currencies[Field.INPUT], _currencies[Field.OUTPUT]);

  let price: Price<Token, Token> | undefined;
  if (pair && pairState === PairState.EXISTS && _currencies[Field.INPUT]) {
    if (pair.involvesToken(_currencies[Field.INPUT].wrapped)) price = pair.priceOf(_currencies[Field.INPUT].wrapped);
    else price = pair.token0Price; // pair not ready, just set dummy price
  }

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const _parsedAmounts = React.useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? _parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? _parsedAmount : trade?.outputAmount,
    }),
    [independentField, _parsedAmount, trade],
  );

  const formattedAmounts = React.useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: _parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    } as { [field in Field]: string };
  }, [dependentField, independentField, _parsedAmounts, typedValue]);

  const parsedAmounts = React.useMemo(() => {
    return {
      [independentField]: parsedAmount,
      [dependentField]:
        currencies[dependentField] && formattedAmounts[dependentField]
          ? CurrencyAmount.fromRawAmount(
              currencies[dependentField],
              new BigNumber(formattedAmounts[dependentField])
                .times(10 ** currencies[dependentField].wrapped.decimals)
                .toFixed(0),
            )
          : undefined,
    } as { [field in Field]: CurrencyAmount<XToken> | undefined };
  }, [parsedAmount, currencies, dependentField, formattedAmounts, independentField]);

  const { data: assetManager } = useAssetManagerTokens();

  const maximumBridgeAmount = useMemo(() => {
    if (currencies[Field.OUTPUT] instanceof XToken) {
      return assetManager?.[currencies[Field.OUTPUT].id ?? '']?.depositedAmount;
    }
  }, [assetManager, currencies[Field.OUTPUT]]);

  const outputCurrencyAmount = parsedAmounts[Field.OUTPUT];

  const canBridge = useMemo(() => {
    return maximumBridgeAmount && outputCurrencyAmount ? !maximumBridgeAmount.lessThan(outputCurrencyAmount) : true;
  }, [maximumBridgeAmount, outputCurrencyAmount]);

  const direction = {
    from: currencies[Field.INPUT]?.xChainId || '0x1.icon',
    to: currencies[Field.OUTPUT]?.xChainId || '0x1.icon',
  };

  //check for the maximum output amount against the withdrawal limit
  const maximumOutputAmount = useMemo(() => {
    if (withdrawalsFloorData) {
      const limit = withdrawalsFloorData.find(item => item?.token.symbol === currencies[Field.OUTPUT]?.symbol);
      if (limit) {
        return limit.available;
      }
    }
  }, [withdrawalsFloorData, currencies[Field.OUTPUT]]);

  const canSwap = useMemo(() => {
    return maximumOutputAmount && outputCurrencyAmount ? !maximumOutputAmount.lessThan(outputCurrencyAmount) : true;
  }, [maximumOutputAmount, outputCurrencyAmount]);

  //temporary check for valid stellar account
  const stellarValidationQuery = useValidateStellarAccount(direction.to === 'stellar' ? recipient : undefined);
  const { data: stellarValidation } = stellarValidationQuery;

  const stellarTrustlineValidationQuery = useValidateStellarTrustline(
    direction.to === 'stellar' ? recipient : undefined,
    currencies[Field.OUTPUT],
  );
  const { data: stellarTrustlineValidation } = stellarTrustlineValidationQuery;

  if (stellarValidationQuery.isLoading) {
    inputError = t`Validating Stellar wallet`;
  }

  const isSolanaAccountActive = useCheckSolanaAccount(direction.to, parsedAmounts[Field.OUTPUT], recipient ?? '');
  if (!isSolanaAccountActive) {
    inputError = t`Swap`;
  }

  return {
    account,
    trade,
    currencies,
    _currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    percents,
    price,
    direction,
    dependentField,
    parsedAmounts,
    formattedAmounts,
    canBridge,
    maximumBridgeAmount,
    stellarValidation,
    stellarTrustlineValidation,
    maximumOutputAmount,
    canSwap,
  };
}

export function useDerivedTradeInfo(): {
  sourceAddress: string | undefined;
  currencies: { [field in Field]?: XToken };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount<XToken> | undefined };
  parsedAmount: CurrencyAmount<XToken> | undefined;
  inputError?: string;
  direction: { from: XChainId; to: XChainId };
  dependentField: Field;
  parsedAmounts: {
    [field in Field]: CurrencyAmount<XToken> | undefined;
  };
  formattedAmounts: {
    [field in Field]: string;
  };
  stellarValidation?: StellarAccountValidation;
  stellarTrustlineValidation?: StellarTrustlineValidation;
  quote: any | undefined;
  exchangeRate: BigNumber;
  minOutputAmount: BigNumber | undefined;
  formattedFee: string;
} {
  const {
    independentField,
    typedValue,
    recipient,
    [Field.INPUT]: { currency: inputCurrency, percent: inputPercent },
    [Field.OUTPUT]: { currency: outputCurrency },
  } = useSwapState();

  const sourceAddress = useXAccount(getXChainType(inputCurrency?.xChainId)).address;
  const crossChainWallet = useCrossChainWalletBalances();
  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined);

  const currencyBalances: { [field in Field]?: CurrencyAmount<XToken> } = React.useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency ? crossChainWallet[inputCurrency.xChainId]?.[inputCurrency.address] : undefined,
      [Field.OUTPUT]: outputCurrency ? crossChainWallet[outputCurrency.xChainId]?.[outputCurrency.address] : undefined,
    };
  }, [crossChainWallet, inputCurrency, outputCurrency]);

  const currencies: { [field in Field]?: XToken } = useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency ?? undefined,
      [Field.OUTPUT]: outputCurrency ?? undefined,
    };
  }, [inputCurrency, outputCurrency]);

  //!! SODAX start
  const sourceToken = currencies[Field.INPUT];
  const destToken = currencies[Field.OUTPUT];
  const sourceChain = sourceToken?.xChainId;
  const destChain = destToken?.xChainId;
  const sourceAmount = parsedAmount?.toFixed();

  // Calculate the adjusted amount for quote request to account for partner fee
  const adjustedAmountForQuote = useMemo(() => {
    if (!sourceAmount || Number(sourceAmount) <= 0 || !sourceToken) {
      return undefined;
    }

    if (isExactIn) {
      return scaleTokenAmount(sourceAmount, sourceToken.decimals);
    } else {
      // For exact_output: request quote with amount that will result in sourceAmount after partner fee deduction
      // If user wants output Y, we need to request quote for Y / (1 - partner_fee_percentage)
      const adjustedAmount = new BigNumber(sourceAmount)
        .div(new BigNumber(10000).minus(PARTNER_FEE_PERCENTAGE))
        .times(10000);

      return scaleTokenAmount(adjustedAmount.toFixed(), destToken?.decimals || 0);
    }
  }, [sourceAmount, sourceToken, destToken, isExactIn]);

  const payload = useMemo(() => {
    if (!sourceToken || !destToken) {
      return undefined;
    }

    if (!adjustedAmountForQuote) {
      return undefined;
    }

    if (!sourceChain || !destChain) {
      return undefined;
    }

    return {
      token_src: sourceToken.address,
      token_src_blockchain_id: sourceChain as SpokeChainId,
      token_dst: destToken.address,
      token_dst_blockchain_id: destChain as SpokeChainId,
      amount: adjustedAmountForQuote,
      quote_type: isExactIn ? 'exact_input' : 'exact_output',
    } satisfies SolverIntentQuoteRequest;
  }, [sourceToken, destToken, sourceChain, destChain, adjustedAmountForQuote, isExactIn]);

  const quoteQuery = useQuote(payload);

  const quote = useMemo(() => {
    if (quoteQuery.data?.ok) {
      if (isExactIn) {
        return {
          ...quoteQuery.data.value,
          quoted_amount: (quoteQuery.data.value.quoted_amount * BigInt(10000 - PARTNER_FEE_PERCENTAGE)) / BigInt(10000),
        };
      } else {
        return quoteQuery.data.value;
      }
    }
    return undefined;
  }, [quoteQuery, isExactIn]);

  const exchangeRate = useMemo(() => {
    if (!quote?.quoted_amount || !sourceAmount) {
      return new BigNumber(0);
    }

    if (isExactIn) {
      // For exact input: exchange rate = output / input
      return calculateExchangeRate(
        new BigNumber(sourceAmount),
        new BigNumber(normaliseTokenAmount(quote.quoted_amount, destToken?.decimals ?? 0)),
      );
    } else {
      // For exact output: exchange rate = output / input (but we need to invert the calculation)
      // quoted_amount is the input amount needed, sourceAmount is the output amount desired
      return calculateExchangeRate(
        new BigNumber(normaliseTokenAmount(quote.quoted_amount, sourceToken?.decimals ?? 0)),
        new BigNumber(sourceAmount),
      );
    }
  }, [quote, sourceAmount, destToken, sourceToken, isExactIn]);

  const slippageTolerance = useSwapSlippageTolerance();

  const minOutputAmount = useMemo(() => {
    if (!quote?.quoted_amount) {
      return undefined;
    }

    if (isExactIn) {
      // For exact input: min output is the quoted amount minus slippage
      return new BigNumber(quote.quoted_amount.toString())
        .multipliedBy(new BigNumber(100).minus(new BigNumber(slippageTolerance).div(100)))
        .div(100);
    } else {
      // For exact output: min output is the user's typed amount minus slippage
      return new BigNumber(typedValue ?? 0)
        .multipliedBy(10 ** (currencies[Field.OUTPUT]?.decimals ?? 18))
        .multipliedBy(new BigNumber(100).minus(new BigNumber(slippageTolerance).div(100)))
        .div(100);
    }
  }, [quote, slippageTolerance, isExactIn, typedValue, currencies[Field.OUTPUT]?.decimals]);

  const partnerFee = useMemo(() => {
    if (!quote) {
      return BigInt(0);
    }

    if (isExactIn) {
      // For exact input: quoted_amount is the output amount (after partner fee removed, sodax fee included)
      // We need to reconstruct the original output amount to calculate the partner fee
      const amountBeforePartnerFee = (quote.quoted_amount * BigInt(10000)) / BigInt(10000 - PARTNER_FEE_PERCENTAGE);
      const fee = amountBeforePartnerFee - quote.quoted_amount;
      return fee;
    } else {
      // For exact output: quoted_amount is the input amount needed (including both partner and sodax fees)
      // We need to calculate what the output amount would be, then calculate fees from that output amount
      // This is the same approach as exact input, but we need to work backwards from input to output

      // The user wants to receive a specific output amount (sourceAmount)
      // The quoted_amount is what they need to pay (input amount)
      // We need to calculate what the actual output amount would be after fees

      // For exact output, the output amount is what the user typed (sourceAmount)
      // But we need to calculate what the output amount would be after removing partner fee
      const outputAmountAfterPartnerFee = new BigNumber(sourceAmount ?? 0).multipliedBy(
        10 ** (destToken?.decimals ?? 18),
      );

      // Calculate the partner fee from the output amount (same as exact input)
      const fee = (BigInt(outputAmountAfterPartnerFee.toString()) * BigInt(PARTNER_FEE_PERCENTAGE)) / BigInt(10000);
      return fee;
    }
  }, [quote, isExactIn, sourceAmount, destToken?.decimals]);

  const sodaxFee = useMemo(() => {
    if (!quote) {
      return BigInt(0);
    }

    const SODAX_FEE_BASIS_POINTS = 10; // 0.1%

    if (isExactIn) {
      // For exact input: quoted_amount is the output amount (after partner fee removed, sodax fee included)
      // We need to reconstruct the original output amount to calculate the sodax fee
      const amountBeforePartnerFee = (quote.quoted_amount * BigInt(10000)) / BigInt(10000 - PARTNER_FEE_PERCENTAGE);
      const initialAmount = (amountBeforePartnerFee * BigInt(10000)) / BigInt(10000 - SODAX_FEE_BASIS_POINTS);
      const fee = initialAmount - amountBeforePartnerFee;
      return fee;
    } else {
      // For exact output: calculate sodax fee from the output amount (same as exact input)
      // The user wants to receive a specific output amount (sourceAmount)
      // We need to calculate what the output amount would be after removing both fees
      const outputAmountAfterPartnerFee = new BigNumber(sourceAmount ?? 0).multipliedBy(
        10 ** (destToken?.decimals ?? 18),
      );

      // Calculate what the output amount would be before partner fee
      const outputAmountBeforePartnerFee =
        (BigInt(outputAmountAfterPartnerFee.toString()) * BigInt(10000)) / BigInt(10000 - PARTNER_FEE_PERCENTAGE);

      // Calculate what the output amount would be before sodax fee
      const outputAmountBeforeSodaxFee =
        (outputAmountBeforePartnerFee * BigInt(10000)) / BigInt(10000 - SODAX_FEE_BASIS_POINTS);

      // Calculate sodax fee as the difference
      const fee = outputAmountBeforeSodaxFee - outputAmountBeforePartnerFee;
      return fee;
    }
  }, [quote, isExactIn, sourceAmount, destToken?.decimals]);

  const formattedFee = useMemo(() => {
    if (!partnerFee || !sodaxFee || !destToken) {
      return '';
    }

    // For both exact input and exact output: fees are in output token terms
    const bnPartnerFee = new BigNumber(partnerFee.toString()).div(10 ** destToken.decimals);
    const bnSodaxFee = new BigNumber(sodaxFee.toString()).div(10 ** destToken.decimals);
    const totalFee = bnPartnerFee.plus(bnSodaxFee);

    // Format the fee to avoid scientific notation and show proper decimal places
    let formattedAmount: string;
    if (totalFee.isLessThan(0.000001) && totalFee.isGreaterThan(0)) {
      // For very small amounts, show more decimal places
      formattedAmount = totalFee.toFixed(10);
    } else if (totalFee.isLessThan(0.001) && totalFee.isGreaterThan(0)) {
      // For very small amounts, show more decimal places
      formattedAmount = totalFee.toFixed(6);
    } else if (totalFee.isLessThan(1)) {
      // For amounts less than 1, show up to 4 decimal places
      formattedAmount = totalFee.toPrecision(3);
    } else {
      // For amounts 1 or greater, show up to 2 decimal places
      formattedAmount = totalFee.toFormat(2, { groupSeparator: ',' });
    }

    // Remove trailing zeros after decimal point
    formattedAmount = formattedAmount.replace(/\.?0+$/, '');

    return `${formattedAmount} ${destToken.symbol}`;
  }, [destToken, partnerFee, sodaxFee]);
  //!! SODAX end

  const percents: { [field in Field]?: number } = React.useMemo(
    () => ({
      [Field.INPUT]: inputPercent,
    }),
    [inputPercent],
  );

  const _currencies: { [field in Field]?: Currency } = useMemo(() => {
    return {
      [Field.INPUT]:
        inputCurrency?.xChainId === '0x1.icon' ? inputCurrency : convertCurrency('0x1.icon', inputCurrency),
      [Field.OUTPUT]:
        outputCurrency?.xChainId === '0x1.icon' ? outputCurrency : convertCurrency('0x1.icon', outputCurrency),
    };
  }, [inputCurrency, outputCurrency]);

  const _parsedAmount = useMemo(
    () => tryParseAmount(typedValue, (isExactIn ? _currencies[Field.INPUT] : _currencies[Field.OUTPUT]) ?? undefined),
    [typedValue, isExactIn, _currencies],
  );

  let inputError: string | undefined;

  if (sourceAddress && !recipient) {
    inputError = t`Choose address`;
  }

  if (sourceAddress && !parsedAmount) {
    inputError = t`Enter amount`;
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t`Select a token`;
  }

  //check sufficient balance
  if (quote && currencyBalances[Field.INPUT]) {
    if (isExactIn) {
      // For exact input: check if user has enough input currency for the amount they typed
      if (parsedAmount?.greaterThan(currencyBalances[Field.INPUT])) {
        inputError = t`Insufficient ${formatSymbol(currencies[Field.INPUT]?.symbol)}`;
      }
    } else {
      // For exact output: check if user has enough input currency for the required input amount from quote
      const requiredInputAmount = CurrencyAmount.fromRawAmount(currencies[Field.INPUT]!, quote.quoted_amount);
      if (requiredInputAmount.greaterThan(currencyBalances[Field.INPUT])) {
        inputError = t`Insufficient ${formatSymbol(currencies[Field.INPUT]?.symbol)}`;
      }
    }
  }

  // decimal scales are different for different chains for the same token
  // if (

  // ) {
  //   inputError = t`Insufficient ${formatSymbol(currencies[Field.INPUT]?.symbol)}`;
  // }

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmount?.greaterThan(0),
  );

  if (userHasSpecifiedInputOutput && !quote) inputError = t`Swap not supported`;

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const _parsedAmounts = React.useMemo(
    () =>
      destToken &&
      sourceToken && {
        [Field.INPUT]:
          independentField === Field.INPUT
            ? _parsedAmount
            : CurrencyAmount.fromRawAmount(sourceToken, quote?.quoted_amount || 0n),
        [Field.OUTPUT]:
          independentField === Field.OUTPUT
            ? _parsedAmount
            : CurrencyAmount.fromRawAmount(destToken, quote?.quoted_amount || 0n),
      },
    [independentField, _parsedAmount, quote, sourceToken, destToken],
  );

  const formattedAmounts = React.useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: _parsedAmounts?.[dependentField]?.toSignificant(6) ?? '',
    } as { [field in Field]: string };
  }, [dependentField, independentField, _parsedAmounts, typedValue]);

  const parsedAmounts = React.useMemo(() => {
    return {
      [independentField]: parsedAmount,
      [dependentField]:
        currencies[dependentField] && formattedAmounts[dependentField]
          ? CurrencyAmount.fromRawAmount(
              currencies[dependentField]!,
              new BigNumber(formattedAmounts[dependentField])
                .times(10 ** currencies[dependentField]!.wrapped.decimals)
                .toFixed(0),
            )
          : undefined,
    } as { [field in Field]: CurrencyAmount<XToken> | undefined };
  }, [parsedAmount, currencies, dependentField, formattedAmounts, independentField]);

  const direction = {
    from: currencies[Field.INPUT]?.xChainId || '0x1.icon', //TODO: remove hardcoded ICON
    to: currencies[Field.OUTPUT]?.xChainId || '0x1.icon',
  };

  const stellarValidationQuery = useValidateStellarAccount(direction.to === 'stellar' ? recipient : undefined);
  const { data: stellarValidation } = stellarValidationQuery;

  const stellarTrustlineValidationQuery = useValidateStellarTrustline(
    direction.to === 'stellar' ? recipient : undefined,
    currencies[Field.OUTPUT],
  );
  const { data: stellarTrustlineValidation } = stellarTrustlineValidationQuery;

  if (stellarValidationQuery.isLoading) {
    inputError = t`Validating Stellar wallet`;
  }

  //TODO: solana check
  // const isSolanaAccountActive = useCheckSolanaAccount(direction.to, parsedAmounts[Field.OUTPUT], recipient ?? '');
  // if (!isSolanaAccountActive) {
  //   inputError = t`Swap`;
  // }

  return {
    sourceAddress,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    percents,
    direction,
    dependentField,
    parsedAmounts,
    formattedAmounts,
    stellarValidation,
    stellarTrustlineValidation,
    quote,
    exchangeRate,
    minOutputAmount,
    formattedFee,
  };
}

export function useInitialSwapLoad(): void {
  const [firstLoad, setFirstLoad] = React.useState<boolean>(true);
  const navigate = useNavigate();
  const tokens = useAllXTokens();
  const { pair = '' } = useParams<{ pair: string }>();
  const { onCurrencySelection } = useSwapActionHandlers();
  const { currencies } = useDerivedSwapInfo();

  useEffect(() => {
    if (firstLoad && Object.values(tokens).length > 0) {
      const tokensArray = Object.values(tokens);

      const inputToken = pair.split('_')[0] || '';
      const outputToken = pair.split('_')[1] || '';
      const [currentBase, currentBaseXChainId] = inputToken.split(':');
      const [currentQuote, currentQuoteXChainId] = outputToken.split(':');

      const quote = tokensArray.find(
        x => x.symbol.toLowerCase() === currentQuote.toLowerCase() && x.xChainId === currentQuoteXChainId,
      );
      const base = tokensArray.find(
        x => x.symbol.toLowerCase() === currentBase.toLowerCase() && x.xChainId === currentBaseXChainId,
      );

      if (quote && base) {
        onCurrencySelection(Field.INPUT, base);
        onCurrencySelection(Field.OUTPUT, quote);
      }
      setFirstLoad(false);
    }
  }, [firstLoad, tokens, onCurrencySelection, pair]);

  useEffect(() => {
    if (!firstLoad && currencies.INPUT && currencies.OUTPUT) {
      const inputXChainId = currencies.INPUT instanceof XToken ? currencies.INPUT.xChainId : undefined;
      const outputXChainId = currencies.OUTPUT instanceof XToken ? currencies.OUTPUT.xChainId : undefined;

      const inputCurrency = `${currencies.INPUT.symbol}${inputXChainId ? `:${inputXChainId}` : ''}`;
      const outputCurrency = `${currencies.OUTPUT.symbol}${outputXChainId ? `:${outputXChainId}` : ''}`;
      const newPair = `${inputCurrency}_${outputCurrency}`;

      if (pair !== newPair) {
        navigate(`/trade/${newPair}`, { replace: true });
      }
    }
  }, [currencies, pair, navigate, firstLoad]);
}

export interface MMTrade {
  inputAmount: CurrencyAmount<XToken>;
  outputAmount: CurrencyAmount<XToken>;
  fee: CurrencyAmount<XToken>;
  executionPrice: Price<Token, Token>;
  uuid: string;
}

export enum QuoteType {
  EXACT_INPUT = 'exact_input',
  EXACT_OUTPUT = 'exact_output',
}

export function useMMTrade(
  queriedCurrencyAmount: CurrencyAmount<XToken> | undefined,
  otherCurrency: XToken | undefined,
  quoteType: QuoteType,
) {
  return useQuery<MMTrade | undefined>({
    queryKey: [
      'quote',
      `${quoteType}-${queriedCurrencyAmount?.currency.address}-${queriedCurrencyAmount?.currency.xChainId}-${queriedCurrencyAmount?.toFixed()}`,
      `${otherCurrency?.address}-${otherCurrency?.xChainId}`,
    ],
    queryFn: async () => {
      if (!queriedCurrencyAmount || !otherCurrency) {
        return;
      }

      const isExactInput = quoteType === QuoteType.EXACT_INPUT;

      //check for allowed intent xchain ids
      if (
        !ALLOWED_XCHAIN_IDS.includes(queriedCurrencyAmount.currency.xChainId) ||
        !ALLOWED_XCHAIN_IDS.includes(otherCurrency.xChainId)
      ) {
        return;
      }

      // For exact_output, increase the amount by 0.1% to account for intent contract fee
      let finalAmount = queriedCurrencyAmount;
      if (quoteType === QuoteType.EXACT_OUTPUT) {
        finalAmount = queriedCurrencyAmount.multiply(new Fraction(1001, 1000)) as CurrencyAmount<XToken>;
      }

      const res = await intentService.getQuote({
        token_src: isExactInput ? queriedCurrencyAmount.currency.address : otherCurrency.address,
        token_src_blockchain_id: isExactInput ? queriedCurrencyAmount.currency.xChainId : otherCurrency.xChainId,
        token_dst: isExactInput ? otherCurrency.address : queriedCurrencyAmount.currency.address,
        token_dst_blockchain_id: isExactInput ? otherCurrency.xChainId : queriedCurrencyAmount.currency.xChainId,
        amount: finalAmount.quotient,
        quote_type: quoteType,
      });

      if (res.ok) {
        const quoteAmount = CurrencyAmount.fromRawAmount(otherCurrency, BigInt(res.value.quoted_amount ?? 0));

        // For exact_input: queriedCurrencyAmount is input, quoteAmount is output
        // For exact_output: quoteAmount is input, queriedCurrencyAmount is output
        const inputAmount = isExactInput ? finalAmount : quoteAmount;
        const outputAmount = isExactInput ? quoteAmount : finalAmount;

        return {
          inputAmount,
          outputAmount,
          executionPrice: new Price({ baseAmount: inputAmount, quoteAmount: outputAmount }),
          uuid: res.value.uuid,
          fee: outputAmount.multiply(new Fraction(3, 1_000)),
        };
      }

      return;
    },
    refetchInterval: 10_000,
    enabled: !!queriedCurrencyAmount && !!otherCurrency,
  });
}

const convert = (currency: XToken | undefined, amount: CurrencyAmount<Currency> | undefined) => {
  if (!currency || !amount) {
    return;
  }
  return CurrencyAmount.fromRawAmount(
    currency,
    new BigNumber(amount.toFixed()).times(10 ** currency.wrapped.decimals).toFixed(0),
  );
};

export function useDerivedMMTradeInfo(trade: Trade<Currency, Currency, TradeType> | undefined) {
  const {
    [Field.INPUT]: { currency: inputCurrency },
    [Field.OUTPUT]: { currency: outputCurrency },
    independentField,
    typedValue,
  } = useSwapState();

  const tradeType = independentField === Field.INPUT ? QuoteType.EXACT_INPUT : QuoteType.EXACT_OUTPUT;
  const isExactInput = tradeType === QuoteType.EXACT_INPUT;

  const mmTradeQuery = useMMTrade(
    tryParseAmount(typedValue, isExactInput ? inputCurrency?.wrapped : outputCurrency?.wrapped),
    isExactInput ? outputCurrency?.wrapped : inputCurrency?.wrapped,
    tradeType,
  );

  // compare mmTradeQuery result and trade
  const mmTrade = mmTradeQuery.data;

  const swapOutput = convert(outputCurrency?.wrapped, trade?.outputAmount);
  const swapInput = convert(inputCurrency?.wrapped, trade?.inputAmount);

  return {
    isMMBetter: isExactInput
      ? mmTrade?.outputAmount && (swapOutput ? mmTrade.outputAmount.greaterThan(swapOutput) : true)
      : mmTrade?.inputAmount && (swapInput ? mmTrade.inputAmount.lessThan(swapInput) : true),
    trade: mmTrade,
  };
}
