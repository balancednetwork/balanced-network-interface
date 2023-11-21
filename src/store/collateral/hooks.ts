import React, { useMemo } from 'react';

import { addresses, CallData } from '@balancednetwork/balanced-js';
import BigNumber from 'bignumber.js';
import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { MINIMUM_ICX_FOR_ACTION } from 'constants/index';
import { HIGH_PRICE_ASSET_DP, NULL_CONTRACT_ADDRESS, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useBorrowedAmounts, useLoanParameters, useLockingRatios } from 'store/loan/hooks';
import { useOraclePrice, useOraclePrices } from 'store/oracle/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useICONWalletBalances } from 'store/wallet/hooks';
import { CurrencyKey, IcxDisplayType } from 'types';
import { formatUnits, toBigNumber } from 'utils';

import { AppState } from '../index';
import {
  adjust,
  cancel,
  changeDepositedAmount,
  changeCollateralType,
  changeIcxDisplayType,
  type,
  Field,
} from './actions';

export const DEFAULT_COLLATERAL_TOKEN = 'sICX';

export function useCollateralChangeDepositedAmount(): (depositedAmount: BigNumber, token?: string) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (depositedAmount: BigNumber, token: string = DEFAULT_COLLATERAL_TOKEN) => {
      dispatch(changeDepositedAmount({ depositedAmount, token }));
    },
    [dispatch],
  );
}

export function useCollateralChangeCollateralType(): (collateralType: CurrencyKey) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (collateralType: CurrencyKey) => {
      dispatch(changeCollateralType({ collateralType }));
    },
    [dispatch],
  );
}

export function useCollateralChangeIcxDisplayType(): (icxDisplayType: IcxDisplayType) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (icxDisplayType: IcxDisplayType) => {
      dispatch(changeIcxDisplayType({ icxDisplayType }));
    },
    [dispatch],
  );
}

export function useCollateralType() {
  return useSelector((state: AppState) => state.collateral.collateralType);
}

export function useIcxDisplayType() {
  return useSelector((state: AppState) => state.collateral.icxDisplayType);
}

export function useCollateralAvailableAmount() {
  const icxAddress = bnJs.ICX.address;
  const balances = useICONWalletBalances();
  const ICXAmountCA = balances[icxAddress];
  const ICXAmount = toBigNumber(ICXAmountCA);

  return React.useMemo(() => {
    return BigNumber.max(ICXAmount.minus(MINIMUM_ICX_FOR_ACTION), new BigNumber(0));
  }, [ICXAmount]);
}

export function useCollateralAvailableAmountinSICX() {
  const sicxAddress = bnJs.sICX.address;
  const balances = useICONWalletBalances();
  const sICXAmountCA = balances[sicxAddress];
  const sICXAmount = toBigNumber(sICXAmountCA);

  return sICXAmount;
}

export function useCollateralAmounts(): { [key in string]: BigNumber } {
  return useSelector((state: AppState) => state.collateral.depositedAmounts);
}

export function useCollateralFetchInfo(account?: string | null) {
  const changeDepositedAmount = useCollateralChangeDepositedAmount();
  const transactions = useAllTransactions();
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();

  const fetchCollateralInfo = React.useCallback(
    async (account: string) => {
      bnJs.Loans.getAccountPositions(account)
        .then(res => {
          // console.log('Fetched collateral info: ', res);
          supportedCollateralTokens &&
            res.holdings &&
            Object.keys(res.holdings).forEach(async symbol => {
              const decimals: string = await bnJs.getContract(supportedCollateralTokens[symbol]).decimals();
              const depositedAmount = new BigNumber(
                formatUnits(res.holdings[symbol][symbol] || 0, Number(decimals), 18),
              );
              changeDepositedAmount(depositedAmount, symbol);
            });
        })
        .catch(e => {
          if (e.toString().indexOf('does not have a position')) {
            supportedCollateralTokens &&
              Object.keys(supportedCollateralTokens).forEach(symbol => changeDepositedAmount(new BigNumber(0), symbol));
          }
        });
    },
    [changeDepositedAmount, supportedCollateralTokens],
  );

  React.useEffect(() => {
    if (account) {
      fetchCollateralInfo(account);
    }
  }, [fetchCollateralInfo, account, transactions]);
}

export function useCollateralState() {
  return useSelector((state: AppState) => state.collateral.state);
}

export function useCollateralActionHandlers() {
  const dispatch = useDispatch();

  const onFieldAInput = React.useCallback(
    (value: string) => {
      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'text' }));
    },
    [dispatch],
  );

  const onFieldBInput = React.useCallback(
    (value: string) => {
      dispatch(type({ independentField: Field.RIGHT, typedValue: value, inputType: 'text' }));
    },
    [dispatch],
  );

  const onSlide = React.useCallback(
    (values: string[], handle: number) => {
      const value = values[handle];
      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'slider' }));
    },
    [dispatch],
  );

  const onAdjust = React.useCallback(
    isAdjust => {
      if (isAdjust) {
        dispatch(adjust());
      } else {
        dispatch(cancel());
      }
    },
    [dispatch],
  );

  return {
    onFieldAInput,
    onFieldBInput,
    onSlide,
    onAdjust,
  };
}

export function useCollateralDepositedAmount() {
  const depositedAmounts = useCollateralAmounts();
  const collateralType = useCollateralType();
  return depositedAmounts[collateralType] || new BigNumber(0);
}

export function useCollateralDepositedAmountInICX() {
  const sICXAmount = useCollateralDepositedAmount();

  const ratio = useRatio();

  return React.useMemo(() => {
    return sICXAmount.multipliedBy(ratio.sICXICXratio);
  }, [sICXAmount, ratio.sICXICXratio]);
}

export function useCollateralTotalICXAmount() {
  const ICXAmount = useCollateralAvailableAmount();

  const stakedICXAmount = useCollateralDepositedAmountInICX();

  return React.useMemo(() => {
    const totalICXAmount = stakedICXAmount.plus(ICXAmount);
    return totalICXAmount;
  }, [stakedICXAmount, ICXAmount]);
}

export function useCollateralTotalAmount() {
  const sICXAmount = useCollateralAvailableAmountinSICX();

  const collateralSICXAmount = useCollateralDepositedAmount();

  return React.useMemo(() => {
    const totalSICXAmount = sICXAmount.plus(collateralSICXAmount);
    return totalSICXAmount;
  }, [sICXAmount, collateralSICXAmount]);
}

export function useCollateralInputAmount() {
  const { independentField, typedValue } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;
  const collateralTotal = useTotalCollateral() || new BigNumber(0);
  const collateralDecimalPlaces = useCollateralDecimalPlaces();

  const roundedTypedValue =
    Math.round(new BigNumber(typedValue || '0').times(10 ** collateralDecimalPlaces).toNumber()) /
    10 ** collateralDecimalPlaces;

  const currentAmount = collateralTotal.minus(new BigNumber(roundedTypedValue));

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(roundedTypedValue),
    [dependentField]: currentAmount,
  };

  return parsedAmount[Field.LEFT];
}

export function useCollateralInputAmountAbsolute() {
  const collateralInputAmount = useCollateralInputAmount();
  const isHandlingICX = useIsHandlingICX();
  const ratio = useRatio();

  return useMemo(() => {
    if (ratio) {
      return isHandlingICX ? collateralInputAmount.div(ratio.sICXICXratio) : collateralInputAmount;
    }
  }, [ratio, isHandlingICX, collateralInputAmount]);
}

export function useCollateralInputAmountInSICX() {
  const { independentField, typedValue } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const totalSICXAmount = useCollateralTotalAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalSICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  return parsedAmount[Field.LEFT];
}

export function useCollateralInputAmountInUSD() {
  const collateralInputAmount = useCollateralInputAmountAbsolute();
  const oraclePrice = useOraclePrice();

  return React.useMemo(() => {
    if (oraclePrice && collateralInputAmount) return collateralInputAmount.multipliedBy(oraclePrice);
  }, [collateralInputAmount, oraclePrice]);
}

type CollateralInfo = {
  symbol: string;
  name: string;
  displayName?: string;
  collateralDeposit: BigNumber;
  collateralAvailable: BigNumber;
  loanTaken: BigNumber;
  loanAvailable: BigNumber;
};

export function useAllCollateralData(): CollateralInfo[] | undefined {
  const { data: collateralTokens } = useSupportedCollateralTokens();
  const depositedAmounts = useCollateralAmounts();
  const borrowedAmounts = useBorrowedAmounts();
  const lockingRatios = useLockingRatios();
  const oraclePrices = useOraclePrices();
  const balances = useICONWalletBalances();
  const { originationFee = 0 } = useLoanParameters() || {};

  return useMemo(() => {
    const allCollateralInfo: CollateralInfo[] | undefined =
      collateralTokens &&
      Object.values(collateralTokens)
        .filter(address => SUPPORTED_TOKENS_MAP_BY_ADDRESS[address])
        .map(address => {
          const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address];

          const collateralDepositUSDValue =
            depositedAmounts && oraclePrices && depositedAmounts[token.symbol!]
              ? depositedAmounts[token.symbol!].times(oraclePrices[token.symbol!])
              : new BigNumber(0);

          const availableCollateral =
            token.symbol === 'sICX'
              ? toBigNumber(balances[address])
                  .plus(toBigNumber(balances[NULL_CONTRACT_ADDRESS]))
                  .multipliedBy(oraclePrices[token.symbol!])
              : toBigNumber(balances[address]).multipliedBy(oraclePrices[token.symbol!] || 1);

          const loanTaken =
            borrowedAmounts && borrowedAmounts[token.symbol!] ? borrowedAmounts[token.symbol!] : new BigNumber(0);

          const loanAvailable =
            (lockingRatios[token.symbol!] &&
              depositedAmounts[token.symbol!] &&
              depositedAmounts[token.symbol!]
                .multipliedBy(oraclePrices[token.symbol!])
                .div(lockingRatios[token.symbol!])
                .dividedBy(1 + originationFee)
                .minus(loanTaken)) ||
            new BigNumber(0);

          return {
            symbol: token.symbol!,
            name: token.name!,
            displayName: token.symbol === 'sICX' ? 'ICX / sICX' : '',
            collateralDeposit: collateralDepositUSDValue,
            collateralAvailable: availableCollateral,
            loanTaken: loanTaken,
            loanAvailable: loanAvailable.isGreaterThan(0) ? loanAvailable : new BigNumber(0),
          };
        });
    return allCollateralInfo;
  }, [collateralTokens, depositedAmounts, borrowedAmounts, oraclePrices, balances, lockingRatios, originationFee]);
}

export function useSupportedCollateralTokens(): UseQueryResult<{ [key in string]: string }> {
  return useQuery('getCollateralTokens', async () => {
    const data = await bnJs.Loans.getCollateralTokens();

    const cds: CallData[] = Object.keys(data).map(symbol => ({
      target: addresses[NETWORK_ID].loans,
      method: 'getDebtCeiling',
      params: [symbol],
    }));

    const debtCeilingsData = await bnJs.Multicall.getAggregateData(cds);

    const debtCeilings = debtCeilingsData.map(ceiling => (ceiling === null ? 1 : parseInt(formatUnits(ceiling))));

    const supportedTokens = {};
    Object.keys(data).forEach((symbol, index) => {
      if (debtCeilings[index] > 0) {
        supportedTokens[symbol] = data[symbol];
      }
    });

    return supportedTokens;
  });
}

export function useDepositedCollateral() {
  const collateralType = useCollateralType();
  const icxDisplayType = useIcxDisplayType();
  const collateralAmounts = useCollateralAmounts();
  const ratio = useRatio();

  return useMemo(() => {
    if (collateralAmounts[collateralType]) {
      if (collateralType !== 'sICX') {
        return collateralAmounts[collateralType];
      } else {
        return icxDisplayType === 'sICX'
          ? collateralAmounts[collateralType]
          : collateralAmounts[collateralType] && ratio && collateralAmounts[collateralType].times(ratio.sICXICXratio);
      }
    } else {
      return new BigNumber(0);
    }
  }, [collateralType, collateralAmounts, ratio, icxDisplayType]);
}

export function useAvailableCollateral() {
  const collateralType = useCollateralType();
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();
  const icxDisplayType = useIcxDisplayType();
  const balances = useICONWalletBalances();
  const shouldGetIcx = collateralType === 'sICX' && icxDisplayType === 'ICX';
  const icxAddress = bnJs.ICX.address;
  const amount = useMemo(
    () =>
      toBigNumber(
        supportedCollateralTokens && balances[shouldGetIcx ? icxAddress : supportedCollateralTokens[collateralType]],
      ),
    [balances, shouldGetIcx, icxAddress, supportedCollateralTokens, collateralType],
  );

  return useMemo(() => {
    return shouldGetIcx ? BigNumber.max(amount.minus(MINIMUM_ICX_FOR_ACTION), new BigNumber(0)) : amount;
  }, [shouldGetIcx, amount]);
}

export function useTotalCollateral() {
  const availableCollateral = useAvailableCollateral();
  const depositedCollateral = useDepositedCollateral();

  return useMemo(() => {
    return availableCollateral.plus(depositedCollateral);
  }, [availableCollateral, depositedCollateral]);
}

export function useIsHandlingICX() {
  const collateralType = useCollateralType();
  const icxDisplayType = useIcxDisplayType();

  return collateralType === 'sICX' && icxDisplayType === 'ICX';
}

export function useCollateralDecimalPlaces() {
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();
  const collateralType = useCollateralType();

  return supportedCollateralTokens && HIGH_PRICE_ASSET_DP[supportedCollateralTokens[collateralType]]
    ? HIGH_PRICE_ASSET_DP[supportedCollateralTokens[collateralType]]
    : 2;
}
