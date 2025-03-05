import { NETWORK_ID } from '@/constants/config';
import { useIconReact } from '@/packages/icon-react';
import { CHAIN_INFO } from '@balancednetwork/balanced-js';
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
import { EvmProvider, IconProvider, SuiProvider } from 'icon-intents-sdk';
import IconService, { HttpProvider } from 'icon-sdk-js';

const useIntentProvider = (currency?: XToken): UseQueryResult<EvmProvider | SuiProvider | null> => {
  const evmXService = useXService('EVM') as unknown as EvmXService;
  const suiClient = useSuiClient();
  const { currentWallet: suiWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  const { account: iconAccount } = useIconReact();

  async function getProvider() {
    if (!currency) return null;

    const chain = xChainMap[currency.xChainId];
    if (!chain) return null;

    if (chain.xChainType === 'EVM' && chain.intentChainId && chain.id) {
      const evmWalletClient = await evmXService.getWalletClient(chain.id);
      const evmPublicClient = evmXService.getPublicClient(chain.id);

      // @ts-ignore
      return new EvmProvider({ walletClient: evmWalletClient, publicClient: evmPublicClient });
    } else if (chain.xChainType === 'SUI') {
      // @ts-ignore
      return new SuiProvider({ client: suiClient, wallet: suiWallet, account: suiAccount });
    } else if (chain.xChainType === 'ICON' && iconAccount) {
      return new IconProvider({
        iconService: new IconService(new HttpProvider(CHAIN_INFO[NETWORK_ID].APIEndpoint)),
        iconDebugRpcUrl: CHAIN_INFO[NETWORK_ID].debugAPIEndpoint as `http${string}`,
        http: new HttpProvider(CHAIN_INFO[NETWORK_ID].APIEndpoint),
        wallet: iconAccount as `hx${string}`,
      });
    }

    return null;
  }

  return useQuery({
    queryKey: ['provider', currency],
    queryFn: getProvider,
  });
};

export default useIntentProvider;
