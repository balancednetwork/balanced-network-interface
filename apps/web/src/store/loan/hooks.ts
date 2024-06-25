import React, { useMemo } from 'react';

import { addresses, BalancedJs, CallData } from '@balancednetwork/balanced-js';
import BigNumber from 'bignumber.js';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { ICON_XCALL_NETWORK_ID, NETWORK_ID } from 'constants/config';
import { ZERO } from 'constants/index';
import { useBnJsContractQuery } from 'queries/utils';
import {
  DEFAULT_COLLATERAL_TOKEN,
  useCollateralDecimalPlaces,
  useCollateralInputAmountAbsolute,
  useCollateralState,
  useCollateralType,
  useCollateralXChain,
  useDepositedCollateral,
  useIsHandlingICX,
  useSupportedCollateralTokens,
} from 'store/collateral/hooks';
import { useOraclePrice } from 'store/oracle/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useRewards } from 'store/reward/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useCrossChainWalletBalances, useICONWalletBalances } from 'store/wallet/hooks';
import { formatUnits, toBigNumber } from 'utils';

import { AppState } from '..';
import {
  changeBorrowedAmount,
  changeBadDebt,
  changeTotalSupply,
  Field,
  adjust,
  cancel,
  type,
  setLockingRatio,
  setRecipientNetwork,
} from './reducer';
import {
  useAllDerivedWallets,
  useAvailableWallets,
  useSignedInWallets,
} from 'app/pages/trade/bridge/_hooks/useWallets';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { XChainId } from 'app/pages/trade/bridge/types';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { bnUSD } from 'constants/tokens';
import { getCrossChainTokenAddress } from 'app/pages/trade/bridge/utils';
import { useDestinationEvents } from 'app/pages/trade/bridge/_zustand/useXCallEventStore';

export function useLoanBorrowedAmount(address?: string): BigNumber {
  const borrowedAmounts = useBorrowedAmounts();
  const collateralType = useCollateralType();
  if (!address) return new BigNumber(0);
  if (!borrowedAmounts[collateralType] || !borrowedAmounts[collateralType][address]) return new BigNumber(0);

  return borrowedAmounts[collateralType][address];
}

export function useBorrowedAmounts(): AppState['loan']['borrowedAmounts'] {
  return useSelector((state: AppState) => state.loan.borrowedAmounts);
}

export function useLockingRatios(): AppState['loan']['lockingRatios'] {
  return useSelector((state: AppState) => state.loan.lockingRatios);
}

export function useLoanRecipientNetwork(): AppState['loan']['recipientNetwork'] {
  return useSelector((state: AppState) => state.loan.recipientNetwork);
}

export function useLoanBadDebt(): AppState['loan']['badDebt'] {
  return useSelector((state: AppState) => state.loan.badDebt);
}

export function useLoanTotalSupply(): AppState['loan']['totalSupply'] {
  return useSelector((state: AppState) => state.loan.totalSupply);
}

export function useActiveLoanAddress(): string | undefined {
  const collateralXChain = useCollateralXChain();
  const signedInWallets = useSignedInWallets();
  const account = signedInWallets.find(
    w => xChainMap[w.xChainId || ICON_XCALL_NETWORK_ID].xWalletType === xChainMap[collateralXChain].xWalletType,
  )?.address;

  return collateralXChain === ICON_XCALL_NETWORK_ID ? account : `${collateralXChain}/${account}`;
}

export function useLoanChangeBorrowedAmount(): (
  borrowedAmount: BigNumber,
  address: string,
  collateralType?: string,
) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (borrowedAmount: BigNumber, address: string, collateralType: string = DEFAULT_COLLATERAL_TOKEN) => {
      dispatch(changeBorrowedAmount({ borrowedAmount, address, collateralType }));
    },
    [dispatch],
  );
}

export function useLoanChangeBadDebt(): (badDebt: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (badDebt: BigNumber) => {
      dispatch(changeBadDebt({ badDebt }));
    },
    [dispatch],
  );
}

export function useLoanChangeTotalSupply(): (totalSupply: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (totalSupply: BigNumber) => {
      dispatch(changeTotalSupply({ totalSupply }));
    },
    [dispatch],
  );
}

export function useSetLoanRecipientNetwork(): (recipientNetwork: XChainId) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (recipientNetwork: XChainId) => {
      dispatch(setRecipientNetwork({ recipientNetwork }));
    },
    [dispatch],
  );
}

export function useLoanFetchInfo(account?: string | null) {
  const dispatch = useDispatch();
  const changeBorrowedAmount = useLoanChangeBorrowedAmount();
  const changeBadDebt = useLoanChangeBadDebt();
  const changeTotalSupply = useLoanChangeTotalSupply();
  const { data: collateralTokens } = useSupportedCollateralTokens();
  const supportedSymbols = React.useMemo(() => collateralTokens && Object.keys(collateralTokens), [collateralTokens]);
  const pendingXCalls = useDestinationEvents(ICON_XCALL_NETWORK_ID);

  const transactions = useAllTransactions();
  const allWallets = useAllDerivedWallets();

  const fetchLoanInfo = React.useCallback(
    (wallet: {
      address: string;
      xChainId: XChainId | undefined;
    }) => {
      const address =
        wallet.xChainId === '0x1.icon' || wallet.xChainId === '0x2.icon'
          ? wallet.address
          : `${wallet.xChainId}/${wallet.address}`;
      if (address) {
        Promise.all([
          bnJs.Loans.getAvailableAssets(),
          bnJs.bnUSD.totalSupply(),
          bnJs.Loans.getAccountPositions(address),
        ])
          .then(([resultAvailableAssets, resultTotalSupply, resultDebt]: Array<any>) => {
            const bnUSDbadDebt = resultAvailableAssets['bnUSD']
              ? BalancedJs.utils.toIcx(resultAvailableAssets['bnUSD']['bad_debt'] || '0')
              : new BigNumber(0);
            const bnUSDTotalSupply = BalancedJs.utils.toIcx(resultTotalSupply);

            resultDebt.holdings &&
              Object.keys(resultDebt.holdings).forEach(token => {
                const depositedAmount = new BigNumber(formatUnits(resultDebt.holdings[token]['bnUSD'] || 0, 18, 18));
                changeBorrowedAmount(depositedAmount, address, token);
              });

            changeBadDebt(bnUSDbadDebt);
            changeTotalSupply(bnUSDTotalSupply);
          })
          .catch(e => {
            if (e.toString().indexOf('does not have a position')) {
              supportedSymbols?.forEach(token => changeBorrowedAmount(new BigNumber(0), address, token));
            }
          });
      }
    },
    [changeBadDebt, changeTotalSupply, changeBorrowedAmount, supportedSymbols],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all(allWallets.map(fetchLoanInfo));
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [fetchLoanInfo, allWallets, transactions, pendingXCalls.length]);

  React.useEffect(() => {
    (async () => {
      if (supportedSymbols) {
        const cds: CallData[] = supportedSymbols.map(symbol => {
          return {
            target: addresses[NETWORK_ID].loans,
            method: 'getLockingRatio',
            params: [symbol],
          };
        });

        const data: string[] = await bnJs.Multicall.getAggregateData(cds);

        data.forEach((ratio, index) => {
          ratio != null &&
            dispatch(
              setLockingRatio({
                lockingRatio: Number(formatUnits(ratio, 4, 6)),
                collateralType: supportedSymbols[index],
              }),
            );
        });
      }
    })();
  }, [supportedSymbols, dispatch]);
}

export function useLoanState() {
  const state = useSelector((state: AppState) => state.loan.state);
  return state;
}

export function useLoanActionHandlers() {
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
      dispatch(type({ independentField: Field.LEFT, typedValue: values[handle], inputType: 'slider' }));
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

export function useLoanTotalBorrowableAmount() {
  const collateralAmount = useCollateralInputAmountAbsolute();
  const lockingRatio = useLockingRatio();
  const oraclePrice = useOraclePrice();

  return useMemo(() => {
    if (collateralAmount && lockingRatio && oraclePrice) {
      return collateralAmount.multipliedBy(oraclePrice).div(lockingRatio);
    } else {
      return ZERO;
    }
  }, [lockingRatio, collateralAmount, oraclePrice]);
}

export function useLoanInputAmount() {
  const { independentField, typedValue } = useLoanState();
  const activeLoanAddress = useActiveLoanAddress();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;
  const borrowableAmountWithReserve = useBorrowableAmountWithReserve(activeLoanAddress);

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: borrowableAmountWithReserve.minus(new BigNumber(typedValue || '0')),
  };

  return parsedAmount[Field.LEFT];
}

export function useLoanAvailableAmount() {
  const inputAmount = useLoanInputAmount();
  const activeLoanAddress = useActiveLoanAddress();
  const borrowableAmount = useBorrowableAmountWithReserve(activeLoanAddress);

  return borrowableAmount.minus(inputAmount).dp(2);
}

export function useLockedICXAmount() {
  const ratio = useRatio();

  const bnUSDLoanAmount = useLoanInputAmount();
  const loanParameters = useLoanParameters();
  const { lockingRatio } = loanParameters || {};

  return React.useMemo(() => {
    const price = ratio.ICXUSDratio.isZero() ? new BigNumber(1) : ratio.ICXUSDratio;
    return bnUSDLoanAmount.multipliedBy(lockingRatio || 0).div(price);
  }, [bnUSDLoanAmount, ratio.ICXUSDratio, lockingRatio]);
}

export function useLockedSICXAmount() {
  const ratio = useRatio();
  const loanParameters = useLoanParameters();
  const { lockingRatio } = loanParameters || {};

  const bnUSDLoanAmount = useLoanInputAmount();

  return React.useMemo(() => {
    const price = ratio.ICXUSDratio.isZero() ? new BigNumber(1) : ratio.ICXUSDratio;
    const sicxIcxRatio = ratio.sICXICXratio.isZero() ? new BigNumber(1) : ratio.sICXICXratio;
    const icxLockedAmount = bnUSDLoanAmount.multipliedBy(lockingRatio || 0).div(price);
    return icxLockedAmount.div(sicxIcxRatio);
  }, [bnUSDLoanAmount, ratio.ICXUSDratio, ratio.sICXICXratio, lockingRatio]);
}

export function useLockedCollateralAmount() {
  const oraclePrice = useOraclePrice();
  const bnUSDLoanAmount = useLoanInputAmount();
  const lockingRatio = useLockingRatio();
  const isHandlingICX = useIsHandlingICX();
  const ratio = useRatio();

  return useMemo(() => {
    if (lockingRatio && oraclePrice && bnUSDLoanAmount && ratio?.sICXICXratio) {
      const lockedAmount = bnUSDLoanAmount.multipliedBy(lockingRatio).div(oraclePrice);
      return isHandlingICX ? lockedAmount.multipliedBy(ratio.sICXICXratio) : lockedAmount;
    } else {
      return new BigNumber(0);
    }
  }, [bnUSDLoanAmount, lockingRatio, oraclePrice, isHandlingICX, ratio]);
}

export function useLoanDebtHoldingShare() {
  const loanInputAmount = useLoanInputAmount();
  const loanBadDebt = useLoanBadDebt();
  const loanTotalSupply = useLoanTotalSupply();

  return React.useMemo(() => {
    return loanInputAmount.div(loanTotalSupply.minus(loanBadDebt)).multipliedBy(100);
  }, [loanInputAmount, loanBadDebt, loanTotalSupply]);
}

export function useLoanUsedAmount(address?: string): BigNumber {
  const loanNetwork = useLoanRecipientNetwork();
  const borrowedAmount = useLoanBorrowedAmount(address);
  const xBalances = useCrossChainWalletBalances();
  const balances = xBalances[loanNetwork];

  return React.useMemo(() => {
    const xBnUSDAddress = getCrossChainTokenAddress(loanNetwork, 'bnUSD');

    if (!balances || !address || !xBnUSDAddress) return ZERO;

    const remainingAmountCA = balances[xBnUSDAddress];
    const remainingAmount = toBigNumber(remainingAmountCA);
    return borrowedAmount.isGreaterThan(remainingAmount) ? borrowedAmount.minus(remainingAmount).plus(0.1) : ZERO;
  }, [balances, address, borrowedAmount, loanNetwork]);
}

export function useLoanTotalbnUSDDebt() {
  const loanBadDebt = useLoanBadDebt();
  const loanTotalSupply = useLoanTotalSupply();

  return React.useMemo(() => {
    return loanTotalSupply.minus(loanBadDebt);
  }, [loanTotalSupply, loanBadDebt]);
}

// calculate loans apy in frontend
// https://github.com/balancednetwork/balanced-network-interface/issues/363
export function useLoanAPY(): BigNumber | undefined {
  const rewards = useRewards();
  const totalLoanDailyRewards = React.useMemo(() => rewards['Loans'] || ZERO, [rewards]);
  const ratio = useRatio();
  const totalbnUSDDebt = useLoanTotalbnUSDDebt();

  return React.useMemo(() => {
    if (totalbnUSDDebt.isGreaterThan(ZERO))
      return totalLoanDailyRewards.times(365).times(ratio.BALNbnUSDratio).div(totalbnUSDDebt);
    else return;
  }, [totalLoanDailyRewards, ratio.BALNbnUSDratio, totalbnUSDDebt]);
}

export function useLockingRatio() {
  const collateralType = useCollateralType();
  const ratios = useLockingRatios();
  return ratios && ratios[collateralType];
}

function useLiquidationRatioRaw() {
  const collateralType = useCollateralType();
  return useQuery({
    queryKey: [collateralType, `LiquidationRatio`],
    queryFn: async () => {
      const data = await bnJs.Loans.getLiquidationRatio(collateralType);
      return data;
    },
  });
}

export function useLiquidationRatio() {
  const { data: rawRatio } = useLiquidationRatioRaw();
  return rawRatio && Number(formatUnits(rawRatio, 4, 6));
}

//deprecate
export function useLoanParameters() {
  const query = useBnJsContractQuery<any>('Loans', 'getParameters', [], false);

  if (query.isSuccess) {
    const data = query.data;

    return {
      lockingRatio: parseInt(data['locking ratio'], 16) / 10_000,
      liquidationRatio: parseInt(data['liquidation ratio'], 16) / 10_000,
      originationFee: parseInt(data['origination fee'], 16) / 10_000,
      redemptionFee: parseInt(data['redemption fee'], 16) / 10_000,
    };
  }
}

export const useThresholdPrices = (): [BigNumber, BigNumber] => {
  const collateralInputAmount = useCollateralInputAmountAbsolute();
  const loanInputAmount = useLoanInputAmount();
  const lockingRatio = useLockingRatio();
  const liquidationRatio = useLiquidationRatio();
  const collateralType = useCollateralType();
  const ratio = useRatio();

  return React.useMemo(() => {
    if (collateralInputAmount && !collateralInputAmount.isZero() && lockingRatio && liquidationRatio && ratio) {
      return collateralType === 'sICX'
        ? [
            loanInputAmount.div(collateralInputAmount).times(lockingRatio).dividedBy(ratio.sICXICXratio),
            loanInputAmount.div(collateralInputAmount).times(liquidationRatio).dividedBy(ratio.sICXICXratio),
          ]
        : [
            loanInputAmount.div(collateralInputAmount).times(lockingRatio),
            loanInputAmount.div(collateralInputAmount).times(liquidationRatio),
          ];
    }

    return [new BigNumber(0), new BigNumber(0)];
  }, [collateralInputAmount, loanInputAmount, lockingRatio, liquidationRatio, ratio, collateralType]);
};

export const useOwnDailyRewards = (): BigNumber => {
  const debtHoldShare = useLoanDebtHoldingShare();

  const rewards = useRewards();

  const totalDailyRewards = rewards['Loans'] || ZERO;

  return totalDailyRewards.times(debtHoldShare).div(100);
};

export const useCollateralLockedSliderPos = () => {
  const lockingRatio = useLockingRatio();
  const liquidationRatio = useLiquidationRatio();

  return React.useMemo(() => {
    if (lockingRatio && liquidationRatio) {
      return (lockingRatio - liquidationRatio) / (9 - liquidationRatio);
    }

    return 0;
  }, [lockingRatio, liquidationRatio]);
};

export function useBorrowableAmountWithReserve(address?: string) {
  const borrowedAmount = useLoanBorrowedAmount(address);
  const totalBorrowableAmount = useLoanTotalBorrowableAmount();
  const { originationFee = 0 } = useLoanParameters() || {};

  return BigNumber.max(totalBorrowableAmount.dividedBy(1 + originationFee), borrowedAmount);
}

export function useInterestRate(symbol: string): UseQueryResult<BigNumber> {
  return useQuery({
    queryKey: [`interestRate`, symbol],
    queryFn: async () => {
      const data = await bnJs.Loans.getInterestRate(symbol);

      if (data) {
        return new BigNumber(data).div(10000);
      } else {
        return new BigNumber(0);
      }
    },
  });
}

export function useRedemptionFee(): UseQueryResult<number> {
  return useQuery({
    queryKey: [`redemptionFee`],
    queryFn: async () => {
      const data = await bnJs.Loans.getRedemptionFee();

      if (data) {
        return Number.parseInt(data);
      } else {
        return 0;
      }
    },
  });
}

export function useRedemptionDaoFee(): UseQueryResult<number> {
  return useQuery({
    queryKey: [`redemptionDaoFee`],
    queryFn: async () => {
      const data = await bnJs.Loans.getRedemptionDaoFee();

      if (data) {
        return Number.parseInt(data);
      } else {
        return 0;
      }
    },
  });
}

export function useDerivedLoanInfo(): {
  account: string | undefined;
  receiver: string | undefined;
  differenceAmount: BigNumber;
  borrowedAmount: BigNumber;
  borrowableAmountWithReserve: BigNumber;
  totalBorrowableAmount: BigNumber;
  bnUSDAmount: CurrencyAmount<Token> | undefined;
  direction: {
    from: XChainId;
    to: XChainId;
  };
  formattedAmounts: {
    [x: string]: string;
  };
  parsedAmount: {
    [x: string]: BigNumber;
    [x: number]: BigNumber;
  };
} {
  const sourceChain = useCollateralXChain();
  const signedInWallets = useAvailableWallets();
  const collateralType = useCollateralType();
  const crossChainWallet = useCrossChainWalletBalances();
  const activeLoanAddress = useActiveLoanAddress();

  const { independentField, typedValue, isAdjusting, inputType } = useLoanState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;
  const recipientNetwork = useLoanRecipientNetwork();

  const receiver = undefined;

  //todo: xRefactor refactor
  const borrowedAmount = useLoanBorrowedAmount(activeLoanAddress);
  const totalBorrowableAmount = useLoanTotalBorrowableAmount();
  const borrowableAmountWithReserve = useBorrowableAmountWithReserve(activeLoanAddress);
  //end of xRefactor

  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: borrowableAmountWithReserve.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]:
      parsedAmount[dependentField].isZero() || parsedAmount[dependentField].isNegative()
        ? '0'
        : parsedAmount[dependentField].toFixed(2),
  };

  const differenceAmount = parsedAmount[Field.LEFT].minus(borrowedAmount);

  const bnUSDAmount = differenceAmount
    ? CurrencyAmount.fromRawAmount(
        bnUSD[NETWORK_ID],
        differenceAmount.times(10 ** bnUSD[NETWORK_ID].decimals).toFixed(0),
      )
    : undefined;

  const direction = {
    from: sourceChain,
    //todo: switch to this after Loan contract update
    // to: recipientNetwork,
    to: sourceChain,
  };

  return {
    account: activeLoanAddress,
    receiver,
    borrowedAmount,
    parsedAmount,
    formattedAmounts,
    borrowableAmountWithReserve,
    totalBorrowableAmount,
    differenceAmount,
    bnUSDAmount,
    direction,
  };
}
