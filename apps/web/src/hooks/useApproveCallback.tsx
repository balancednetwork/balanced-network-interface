import { useCallback, useMemo, useState } from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import { useQuery } from '@tanstack/react-query';
import { Abi, Address, WriteContractReturnType, erc20Abi, getContract } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';

import { openToast } from '@/btp/src/connectors/transactionToast';
import { transactionActions } from '@/hooks/useTransactionStore';
import { TransactionStatus } from '@/store/transactions/hooks';
import { getXChainType } from '@/xwagmi/actions/getXChainType';
import { getXWalletClient } from '@/xwagmi/actions/getXWalletClient';
import { NATIVE_ADDRESS } from '@/xwagmi/constants';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXAccount, useXService } from '@/xwagmi/hooks';
import { ArchwayXService } from '@/xwagmi/xchains/archway';
import { isDenomAsset } from '@/xwagmi/xchains/archway/utils';
import { XToken } from '../xwagmi/types';

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

  const [isPendingError, setIsPendingError] = useState<boolean>(false);

  const [pending, setPending] = useState<boolean>(false);

  const { address: account } = useXAccount(getXChainType(amountToApprove?.currency.xChainId));

  const xChainId = amountToApprove?.currency.xChainId;
  const xChainType = xChainId ? xChainMap[xChainId].xChainType : undefined;

  // evm stuff
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const tokenContract = useTokenContract(token?.address as `0x${string}`);
  const { allowance: currentAllowance, refetch } = useTokenAllowance(token, account, spender);

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender || !xChainType) return ApprovalState.UNKNOWN;

    if (xChainType === 'ICON') return ApprovalState.APPROVED;

    const isBnUSD = amountToApprove.currency.symbol === 'bnUSD';
    if (isBnUSD) return ApprovalState.APPROVED;

    const isNative = amountToApprove.currency.wrapped.address === NATIVE_ADDRESS;
    if (isNative) return ApprovalState.APPROVED;

    if (xChainType === 'ARCHWAY') {
      const isDenom = isDenomAsset(amountToApprove.currency);
      if (isDenom || isBnUSD) return ApprovalState.APPROVED;
    }

    if (xChainType === 'EVM' && isBnUSD) return ApprovalState.APPROVED;

    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN;

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pending
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED;
  }, [amountToApprove, currentAllowance, pending, spender, xChainType]);

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
    const xWalletClient = getXWalletClient(xChainId);

    if (!xWalletClient) {
      // toastError(t('Error'), t('No xService'));
      console.error('no archway WalletXService');
      return undefined;
    }

    try {
      const hash = await xWalletClient.approve(token, account as `0x${string}`, spender, amountToApprove);

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
  const archwayXService: ArchwayXService = useXService('ARCHWAY') as ArchwayXService;
  const archwayPublicClient = archwayXService.publicClient;

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

      const xChain = xChainMap[token.xChainId];

      // EVM
      if (xChain.xChainType === 'EVM') {
        return evmPublicClient.readContract({
          abi: erc20Abi,
          address: token?.address as `0x${string}`,
          functionName: 'allowance',
          args: inputs,
        });
      }

      // Archway
      if (xChain.xChainType === 'ARCHWAY') {
        const res = await archwayPublicClient.queryContractSmart(token?.address, {
          allowance: { owner, spender },
        });

        return res.allowance;
      }

      // ICON & Injective & Havah
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
