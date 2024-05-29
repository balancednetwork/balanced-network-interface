import React, { useEffect, useMemo, useState, useCallback } from 'react';

import { Currency, Fraction } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';

import { useArchwayContext } from '../../../../_xcall/archway/ArchwayProvider';
import { getFeeParam, isDenomAsset } from '../../../../_xcall/archway/utils';

import { Token, CurrencyAmount } from '@balancednetwork/sdk-core';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { erc20Abi, Address, getContract, Abi, WriteContractReturnType } from 'viem';

import { XToken } from 'app/pages/trade/bridge/types';
import { archway, xChainMap } from '../_config/xChains';

import { useBridgeDirection } from 'store/bridge/hooks';
import { NATIVE_ADDRESS } from 'constants/index';
import useXWallet from './useXWallet';
import { openToast } from 'btp/src/connectors/transactionToast';
import { TransactionStatus } from 'store/transactions/hooks';
import { xCallServiceActions } from '../_zustand/useXServiceStore';
import { transactionActions } from '../_zustand/useTransactionStore';

export const FAST_INTERVAL = 10000;

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

export function useContract<TAbi extends Abi>(address?: Address, abi?: TAbi) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!address || !publicClient || !abi) return null;

    try {
      return getContract({
        abi,
        address,
        client: { public: publicClient, wallet: walletClient },
      });
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [abi, walletClient, publicClient, address]);
}

export function useTokenContract(tokenAddress?: Address) {
  return useContract(tokenAddress, erc20Abi);
}

export const MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export const useApproveCallback = (amountToApprove?: CurrencyAmount<XToken>, spender?: string) => {
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined;
  // const pendingApproval = useHasPendingApproval(token?.address, spender);
  const [isPendingError, setIsPendingError] = useState<boolean>(false);

  const [pending, setPending] = useState<boolean>(false);

  const xWallet = useXWallet(amountToApprove?.currency.xChainId);

  const account = xWallet?.account;

  const xChainId = amountToApprove?.currency.xChainId;
  const xChainType = xChainId ? xChainMap[xChainId].xChainType : undefined;

  // archway stuff
  // const { signingClient } = useArchwayContext();

  // evm stuff
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const tokenContract = useTokenContract(token?.address as `0x${string}`);
  const { allowance: currentAllowance, refetch } = useTokenAllowance(token, account, spender);

  // !TODO: temporary solution. revisit it later
  // const [hash, setHash] = useState<string>();
  // const { data } = useWaitForTransactionReceipt({ hash: hash as `0x${string}` | undefined });
  // const pendingApproval = hash ? !data : false;
  // const pendingApproval = hash ? !data : false;

  // useEffect(() => {
  //   if (pendingApproval) {
  //     setPending(true);
  //   } else if (pending) {
  //     refetch().then(() => {
  //       setPending(false);
  //     });
  //   }
  // }, [pendingApproval, pending, refetch]);

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN;

    const xChainId = amountToApprove.currency.xChainId;

    if (xChainId === '0x1.icon') return ApprovalState.APPROVED;

    const isBnUSD = amountToApprove.currency.symbol === 'bnUSD';

    if (xChainId === 'archway-1') {
      const isDenom = isDenomAsset(amountToApprove.currency);
      if (isDenom || isBnUSD) return ApprovalState.APPROVED;
    }

    if (xChainId === '0xa86a.avax' && isBnUSD) return ApprovalState.APPROVED;

    const isNative = amountToApprove.currency.wrapped.address === NATIVE_ADDRESS;
    if (isNative) return ApprovalState.APPROVED;
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN;

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pending
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED;
  }, [amountToApprove, currentAllowance, pending, spender]);

  const approveEvm = useCallback(
    async (overrideAmountApprove?: bigint): Promise<WriteContractReturnType | undefined> => {
      if (approvalState !== ApprovalState.NOT_APPROVED && overrideAmountApprove) {
        // toastError(t('Error'), t('Approve was called unnecessarily'));
        console.error('approve was called unnecessarily');
        setIsPendingError(true);
        return undefined;
      }

      if (!token) {
        // toastError(t('Error'), t('No token'));
        console.error('no token');
        return undefined;
      }

      if (!tokenContract) {
        // toastError(t('Error'), t('Cannot find contract of the token %tokenAddress%', { tokenAddress: token?.address }));
        console.error('tokenContract is null');
        setIsPendingError(true);
        return undefined;
      }

      if (!amountToApprove && overrideAmountApprove) {
        // toastError(t('Error'), t('Missing amount to approve'));
        console.error('missing amount to approve');
        setIsPendingError(true);
        return undefined;
      }

      if (!spender) {
        // toastError(t('Error'), t('No spender'));
        console.error('no spender');
        setIsPendingError(true);
        return undefined;
      }

      if (!account) {
        console.error('no account');
        setIsPendingError(true);
        return undefined;
      }

      if (!walletClient) {
        console.error('no wallet client');
        setIsPendingError(true);
        return undefined;
      }

      if (!publicClient) {
        console.error('no public client');
        setIsPendingError(true);
        return undefined;
      }

      const { request } = await tokenContract.simulate.approve(
        [
          spender as `0x${string}`,
          overrideAmountApprove ??
            (amountToApprove?.quotient ? BigInt(amountToApprove.quotient.toString()) : MaxUint256),
        ],
        {
          account: account as `0x${string}`,
        },
      );

      try {
        const hash = await walletClient?.writeContract({ ...request, account: account as `0x${string}` });

        //add transaction - onSuccess(refetch) callback

        openToast({
          id: hash,
          message: t`Approving ${token.symbol} for cross-chain transfer...`,
          transactionStatus: TransactionStatus.pending,
        });
        setPending(true);
        await publicClient?.waitForTransactionReceipt({ hash: hash });
        await refetch();
        setPending(false);
        openToast({
          id: hash,
          message: t`${token.symbol} approved for cross-chain transfer.`,
          transactionStatus: TransactionStatus.success,
        });

        return hash;
      } catch (e) {
        openToast({
          message: t`${token.symbol} transfer approval failed.`,
          transactionStatus: TransactionStatus.failure,
        });

        return;
      }
    },
    [account, approvalState, token, tokenContract, amountToApprove, spender, walletClient, publicClient, refetch],
  );

  const approveArchway = useCallback(async () => {
    if (!token) {
      // toastError(t('Error'), t('No token'));
      console.error('no token');
      return undefined;
    }

    // if (!account) {
    //   console.error('No Account');
    //   return undefined;
    // }

    // if (!signingClient) {
    //   console.error('No archway wallet client');
    //   return undefined;
    // }

    const xChainId = token.xChainId;
    const xCallService = xCallServiceActions.getXService(xChainId);

    try {
      const hash = await xCallService.approve(token, account as `0x${string}`, spender, amountToApprove);

      setPending(true);

      if (hash) {
        transactionActions.add(xChainId, {
          hash: hash,
          pendingMessage: t`Approving ${token.symbol} for cross-chain transfer...`,
          successMessage: t`${token.symbol} approved for cross-chain transfer.`,
          errorMessage: t`${token.symbol} transfer approval failed.`,
          onSuccess: async () => {
            await refetch();
            setPending(false);
          },
        });
      }
    } catch (e) {
      openToast({
        message: t`${token.symbol} transfer approval failed.`,
        transactionStatus: TransactionStatus.failure,
      });
    }
  }, [spender, token, account, amountToApprove, refetch]);

  const approveCallback = useCallback(() => {
    if (!xChainType) return;

    if (xChainType === 'EVM') {
      return approveEvm();
    } else if (xChainType === 'ARCHWAY') {
      return approveArchway();
    } else if (xChainType === 'ICON') return;
  }, [xChainType, approveEvm, approveArchway]);

  const revokeCallback = useCallback(() => {
    return approveEvm(0n);
  }, [approveEvm]);

  return { approvalState, approveCallback, revokeCallback, currentAllowance, isPendingError };
};

export function useTokenAllowance(
  token?: XToken,
  owner?: string | null,
  spender?: string,
): {
  allowance: CurrencyAmount<Token> | undefined;
  refetch: () => Promise<any>;
} {
  const inputs = useMemo(() => [owner, spender] as [`0x${string}`, `0x${string}`], [owner, spender]);
  const evmPublicClient = usePublicClient();
  const { client: archwayPublicClient } = useArchwayContext();

  const { data: allowance, refetch } = useQuery({
    queryKey: [token?.xChainId, token?.address, owner, spender],
    queryFn: async () => {
      if (!token) {
        throw new Error('No token');
      }
      if (!evmPublicClient) {
        throw new Error('No EVM client');
      }

      if (!archwayPublicClient) {
        throw new Error('No Archway client');
      }

      // EVM
      if (token.xChainId === '0xa86a.avax' || token.xChainId === '0xa869.fuji') {
        return evmPublicClient.readContract({
          abi: erc20Abi,
          address: token?.address as `0x${string}`,
          functionName: 'allowance',
          args: inputs,
        });
      }

      // Archway
      if (token.xChainId === 'archway' || token.xChainId === 'archway-1') {
        const res = await archwayPublicClient.queryContractSmart(token?.address, {
          allowance: { owner, spender },
        });

        return res.allowance;
      }

      // ICON
      return MaxUint256.toString();
    },
    refetchInterval: FAST_INTERVAL,
    retry: true,
    refetchOnWindowFocus: false,
    enabled: Boolean(spender && owner && token),
  });

  return useMemo(
    () => ({
      allowance:
        token && typeof allowance !== 'undefined'
          ? CurrencyAmount.fromRawAmount(token, allowance.toString())
          : undefined,
      refetch,
    }),
    [token, refetch, allowance],
  );
}

const useAllowanceHandler = (
  token: Currency | undefined,
  amountNeeded: string,
  spenderAddress: string = archway.contracts.assetManager,
  callback?: (success: boolean) => void,
) => {
  const { address, signingClient } = useArchwayContext();
  const addTransactionResult = useAddTransactionResult();
  const initTransaction = useInitTransaction();
  const { transactions } = useArchwayTransactionsState();
  const [allowance, setAllowance] = React.useState<string>('0');
  const [allowanceIncreased, setAllowanceIncreased] = React.useState<boolean>(false);
  const tokenAddress = token?.wrapped.address;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (address && tokenAddress && tokenAddress.includes('archway-1') && signingClient) {
      signingClient
        .queryContractSmart(tokenAddress, {
          allowance: { owner: address, spender: spenderAddress },
        })
        .then(res => {
          setAllowance(res.allowance);
        });
    }
  }, [address, signingClient, spenderAddress, tokenAddress, transactions.length]);

  React.useEffect(() => {
    if (Number(allowance) < Number(amountNeeded)) {
      setAllowanceIncreased(false);
    }
  }, [allowance, amountNeeded]);

  const actualIncreaseNeeded = React.useMemo(() => {
    return `${new Fraction(amountNeeded).subtract(new Fraction(allowance)).quotient}`;
  }, [allowance, amountNeeded]);

  const isIncreaseNeeded = React.useMemo(() => {
    return tokenAddress !== archway.contracts.bnUSD && new BigNumber(actualIncreaseNeeded).gt(0);
  }, [tokenAddress, actualIncreaseNeeded]);

  const increaseAllowance = async () => {
    if (signingClient && address && tokenAddress) {
      const msg = {
        increase_allowance: {
          spender: spenderAddress,
          amount: actualIncreaseNeeded,
        },
      };
      try {
        initTransaction('archway-1', t`Approving ${token.symbol} for cross-chain transfer...`);

        const res = await signingClient.execute(address, tokenAddress, msg, getFeeParam(400000));
        setAllowanceIncreased(true);
        addTransactionResult('archway-1', res, t`${token.symbol} approved for cross-chain transfer.`);

        callback && callback(true);
      } catch (e) {
        console.error(e);
        addTransactionResult('archway-1', null, t`${token.symbol} transfer approval failed.`);
      }
    }
  };

  if (!tokenAddress || amountNeeded === '0') {
    return {
      allowance: '0',
      isIncreaseNeeded: false,
      increaseAllowance: () => {},
    };
  }

  return {
    allowance,
    allowanceIncreased,
    isIncreaseNeeded,
    increaseAllowance,
  };
};

export default useAllowanceHandler;
