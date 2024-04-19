import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { useQuery, UseQueryResult } from 'react-query';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { BridgePair, IXCallFee, MessagingProtocol, MessagingProtocolId, SupportedXCallChains } from './types';
import { useArchwayContext } from './archway/ArchwayProvider';
import bnJs from 'bnJs';
import { archway, xChains } from './archway/config1';

export function useXCallGasChecker(
  chain1: SupportedXCallChains,
  chain2: SupportedXCallChains,
  icon: boolean = false,
): UseQueryResult<{ hasEnoughGas: boolean; errorMessage: string }> {
  const wallets = useSignedInWallets();
  const balances = useCrossChainWalletBalances();

  return useQuery<{ hasEnoughGas: boolean; errorMessage: string }>(
    ['gasChecker', chain1, chain2, icon, wallets, balances],
    async () => {
      let errorMessage = '';
      const hasEnoughGasAllArray: boolean[] = [];

      {
        const xChain = xChains[chain1];
        const nativeCurrency = xChain.nativeCurrency;
        const gasAmount = balances[chain1] && balances[chain1]['native'];
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
      }

      {
        const xChain = xChains[chain2];
        const nativeCurrency = xChain.nativeCurrency;
        const gasAmount = balances[chain2] && balances[chain2]['native'];
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
      }

      const hasEnoughGas = !hasEnoughGasAllArray.some(hasEnough => !hasEnough);

      return { hasEnoughGas, errorMessage };
    },
    {
      keepPreviousData: true,
      refetchInterval: 3000,
    },
  );
}

const xCallTable = {
  icon: {
    archway: 'archway-1',
    avalanche: '',
  },
  archway: {
    icon: '0x1.icon',
  },
};

const getXCallId = (from, to) => {
  return xCallTable[from][to];
};

const fetchFee = async (from: SupportedXCallChains, to: SupportedXCallChains, rollback: boolean, client?: any) => {
  if (from === 'archway') {
    return await client.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: getXCallId(from, to), rollback: rollback },
    });
  } else if (from === 'icon') {
    return await bnJs.XCall.getFee(getXCallId(from, to), rollback);
  }
};

// TODO: improve this hook
export const useXCallFee = (
  from: SupportedXCallChains,
  to: SupportedXCallChains,
): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const { client } = useArchwayContext();

  const query = useQuery(
    [`xcall-fees`, from, to],
    async () => {
      if (client) {
        const feeWithRollback = await fetchFee(from, to, true, client);
        const feeNoRollback = await fetchFee(from, to, false, client);

        return {
          noRollback: feeNoRollback,
          rollback: feeWithRollback,
        };
      }
    },
    { enabled: !!client, keepPreviousData: true },
  );

  const { data: xCallFee } = query;

  const chain = xChains[from];
  const formattedXCallFee: string =
    (Number(xCallFee?.rollback) / 10 ** 18).toPrecision(3) + ' ' + chain.nativeCurrency.symbol;

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

const sortChains = (a: SupportedXCallChains, b: SupportedXCallChains): [SupportedXCallChains, SupportedXCallChains] => {
  return a.localeCompare(b) > 0 ? [a, b] : [b, a];
};

const BRIDGE_PAIRS: BridgePair[] = [
  { chains: sortChains('icon', 'archway'), protocol: MessagingProtocolId.IBC },
  // { chains: sortChains('icon', 'avax'), protocol: MessagingProtocolId.C_RELAY },
];

export const useXCallPair = (from: SupportedXCallChains, to: SupportedXCallChains): BridgePair | undefined => {
  const chains = sortChains(from, to);
  return BRIDGE_PAIRS.find(pair => pair.chains[0] === chains[0] && pair.chains[1] === chains[1]);
};

/**
 * This hook returns the fundamental messaging protocol information of xCall from x chain to y chain.
 * @constructor
 * @param {SupportedXCallChains} from - bridge from.
 * @param {SupportedXCallChains} to - bridge to.
 */

export const useXCallProtocol = (
  from: SupportedXCallChains,
  to: SupportedXCallChains,
): MessagingProtocol | undefined => {
  const pair = useXCallPair(from, to);
  const id = pair?.protocol;
  if (id) return MESSAGING_PROTOCOLS[id];
};
