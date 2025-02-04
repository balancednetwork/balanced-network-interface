import { EvmProvider, SuiProvider } from '@balancednetwork/intents-sdk';
import {
  EvmXService,
  XToken,
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useXService,
} from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

const useIntentProvider = (currency?: XToken): UseQueryResult<EvmProvider | SuiProvider | null> => {
  const evmXService = useXService('EVM') as unknown as EvmXService;
  const suiClient = useSuiClient();
  const { currentWallet: suiWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();

  async function getProvider() {
    if (!currency) return null;

    const chain = xChainMap[currency.xChainId];
    if (!chain) return null;

    if (chain.xChainType === 'EVM') {
      const evmWalletClient = await evmXService.getWalletClient(xChainMap[currency.chainId]);
      const evmPublicClient = evmXService.getPublicClient(xChainMap[currency.chainId]);

      // @ts-ignore
      return new EvmProvider({ walletClient: evmWalletClient, publicClient: evmPublicClient });
    } else if (chain.xChainType === 'SUI') {
      // @ts-ignore
      return new SuiProvider({ client: suiClient, wallet: suiWallet, account: suiAccount });
    }

    return null;
  }

  return useQuery({
    queryKey: ['provider', currency],
    queryFn: getProvider,
  });
};

export default useIntentProvider;
