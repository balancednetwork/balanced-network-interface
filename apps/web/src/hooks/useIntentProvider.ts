import { NETWORK_ID } from '@/constants/config';
import { useIconReact } from '@/packages/icon-react';
import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import {
  EvmXService,
  Networks,
  StellarXService,
  XToken,
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useXService,
} from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { EvmProvider, IconProvider, StellarProvider, SuiProvider } from 'icon-intents-sdk';
import IconService, { HttpProvider } from 'icon-sdk-js';
import { useSignedInWallets } from './useWallets';

const useIntentProvider = (
  currency?: XToken,
): UseQueryResult<EvmProvider | SuiProvider | IconProvider | StellarProvider | null> => {
  const evmXService = useXService('EVM') as unknown as EvmXService;
  const stellarService = useXService('STELLAR') as unknown as StellarXService;
  const suiClient = useSuiClient();
  const { currentWallet: suiWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  const { account: iconAccount } = useIconReact();
  const signedInWallets = useSignedInWallets();
  const stellarAccount = signedInWallets.find(wallet => wallet.xChainId === 'stellar')?.address;

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
    } else if (chain.xChainType === 'STELLAR' && stellarAccount) {
      return new StellarProvider({
        sorobanUrl: 'https://stellar-soroban-public.nodies.app',
        networkPassphrase: Networks.PUBLIC,
        wallet: {
          address: stellarAccount,
        },
        provider: (window as any).stellar || window.hanaWallet?.stellar,
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
