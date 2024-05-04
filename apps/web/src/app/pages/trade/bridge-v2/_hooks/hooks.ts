import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import {
  BridgePair,
  IXCallFee,
  MessagingProtocol,
  MessagingProtocolId,
  XChainId,
  XChainType,
  XWalletType,
} from '../../../../_xcall/types';
import { useArchwayContext } from '../../../../_xcall/archway/ArchwayProvider';
import bnJs from 'bnJs';
import { archway, BRIDGE_PAIRS, sortChains, xChainMap, xChains } from '../config';
import { useIconReact } from 'packages/icon-react';
import { useAccount, useDisconnect, usePublicClient } from 'wagmi';
import { useMemo } from 'react';
import { xTokenMap } from '../../../../_xcall/config';
import { ArchwayClient } from '@archwayhq/arch3.js/build';
import { BalancedJs } from '@balancednetwork/balanced-js';
import { formatEther, getContract, PublicClient } from 'viem';
import { xCallContractAbi } from 'app/pages/trade/bridge-v2/_xcall/EvmXCallService';

export function useXCallGasChecker(
  chain1: XChainId,
  chain2: XChainId,
  icon: boolean = false,
): UseQueryResult<{ hasEnoughGas: boolean; errorMessage: string }> {
  const wallets = useSignedInWallets();
  const balances = useCrossChainWalletBalances();

  return useQuery<{ hasEnoughGas: boolean; errorMessage: string }>({
    queryKey: ['gasChecker', chain1, chain2, icon, wallets, balances],
    queryFn: async () => {
      let errorMessage = '';
      const hasEnoughGasAllArray: boolean[] = [];

      [chain1, chain2].forEach(chain => {
        const xChain = xChains[chain];
        const nativeCurrency = xChain.nativeCurrency;
        // !TODO: use native property to fetch native currency balance
        const gasAmount = balances[chain] && balances[chain]?.['native'];
        const hasEnoughGas =
          xChain.autoExecution ||
          (gasAmount
            ? !CurrencyAmount.fromRawAmount(
                gasAmount.currency,
                xChain.gasThreshold * 10 ** nativeCurrency.decimals,
              ).greaterThan(gasAmount)
            : false);
        hasEnoughGasAllArray.push(hasEnoughGas);
        if (!hasEnoughGas) {
          errorMessage = `You need at least ${xChain.gasThreshold} ${nativeCurrency.symbol} to pay for transaction fees on ${nativeCurrency.name}.`;
        }
      });

      const hasEnoughGas = !hasEnoughGasAllArray.some(hasEnough => !hasEnough);

      return { hasEnoughGas, errorMessage };
    },
    placeholderData: keepPreviousData,
    refetchInterval: 3000,
  });
}

const fetchFee = async (
  from: XChainId,
  to: XChainId,
  rollback: boolean,
  client: ArchwayClient | BalancedJs | PublicClient,
): Promise<bigint> => {
  const xChain = xChainMap[from];
  const xChainType = xChainMap[from].xChainType;
  const nId = to;

  if (xChainType === 'ICON') {
    const res = await (client as BalancedJs).XCall.getFee(nId, rollback);
    return BigInt(res);
  }

  if (xChainType === 'ARCHWAY') {
    const res = await (client as ArchwayClient)?.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: nId, rollback: rollback },
    });
    return BigInt(res);
  }

  if (xChainType === 'EVM') {
    const contract = getContract({
      abi: xCallContractAbi,
      address: xChain.contracts.xCall as `0x${string}`,
      client: client as PublicClient,
    });
    return contract.read.getProtocolFee();
  }

  return 0n;
};

// TODO: improve this hook
export const useXCallFee = (
  from: XChainId,
  to: XChainId,
): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const { client } = useArchwayContext();
  const publicClient = usePublicClient();

  const publicClientMap: { [key in XChainType]?: PublicClient | ArchwayClient | BalancedJs } = useMemo(
    () => ({
      ICON: bnJs,
      ARCHWAY: client,
      EVM: publicClient,
    }),
    [publicClient, client],
  );

  const xChainType = xChainMap[from].xChainType;
  const pClient = publicClientMap[xChainType];

  const query = useQuery({
    queryKey: [`xcall-fees`, from, to, pClient],
    queryFn: async () => {
      if (!pClient) return;

      const feeWithRollback = await fetchFee(from, to, true, pClient);
      const feeNoRollback = await fetchFee(from, to, false, pClient);

      return {
        noRollback: feeNoRollback,
        rollback: feeWithRollback,
      };
    },
    enabled: !!pClient,
  });

  const { data: xCallFee } = query;

  const chain = xChainMap[from];

  const formattedXCallFee: string = xCallFee ? formatEther(xCallFee.rollback) + ' ' + chain.nativeCurrency.symbol : '';

  return { xCallFee, formattedXCallFee };
};

const MESSAGING_PROTOCOLS: { [key in MessagingProtocolId]: MessagingProtocol } = {
  [MessagingProtocolId.BTP]: {
    id: MessagingProtocolId.BTP,
    name: 'BTP',
    description: 'is the Icon interoperability protocol',
  },
  [MessagingProtocolId.IBC]: {
    id: MessagingProtocolId.IBC,
    name: 'IBC',
    description: 'is the Cosmos interoperability protocol',
  },
  [MessagingProtocolId.C_RELAY]: {
    id: MessagingProtocolId.C_RELAY,
    name: 'Centralised Relay',
    description: 'is the interoperability protocol based on centralized relay',
  },
};

export const useXCallPair = (from: XChainId, to: XChainId): BridgePair | undefined => {
  const chains = sortChains(from, to);
  return BRIDGE_PAIRS.find(pair => pair.chains[0] === chains[0] && pair.chains[1] === chains[1]);
};

/**
 * This hook returns the fundamental messaging protocol information of xCall from x chain to y chain.
 * @constructor
 * @param {XChainId} from - bridge from.
 * @param {XChainId} to - bridge to.
 */

export const useXCallProtocol = (from: XChainId, to: XChainId): MessagingProtocol | undefined => {
  const pair = useXCallPair(from, to);
  const id = pair?.protocol;
  if (id) return MESSAGING_PROTOCOLS[id];
};

export const useXWallet = (chainId: XChainId) => {
  const chain = xChainMap[chainId];
  const wallets = useWallets();
  return wallets[chain.xWalletType];
};

export const useEVMReact = () => {
  const { address } = useAccount();
  const { disconnectAsync } = useDisconnect();

  return useMemo(
    () => ({
      account: address,
      disconnect: disconnectAsync,
    }),
    [address, disconnectAsync],
  );
};

export const useWallets = () => {
  const arch = useArchwayContext();
  const icon = useIconReact();
  const avax = useEVMReact();

  return useMemo(
    () => ({
      [XWalletType.ICON]: {
        account: icon.account,
        chain: xChainMap['0x1.icon'],
        disconnect: icon.disconnect,
      },
      [XWalletType.COSMOS]: {
        account: arch.address,
        chain: xChainMap['archway-1'],
        disconnect: arch.disconnect,
      },
      [XWalletType.EVM]: {
        account: avax.account,
        chain: xChainMap['0xa86a.avax'],
        disconnect: avax.disconnect,
      },
    }),
    [arch, icon, avax],
  );
};

export const useXTokens = (from: XChainId, to?: XChainId) => {
  if (to) {
    return xTokenMap[from]?.[to];
  } else {
    return Object.values(xTokenMap[from] || {}).flat();
  }
};
