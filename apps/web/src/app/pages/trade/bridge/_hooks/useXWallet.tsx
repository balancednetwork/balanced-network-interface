import { xChainMap } from '@/constants/xChains';
import useWallets from '@/hooks/useWallets';
import { XChainId } from '@/types';

const useXWallet = (xChainId: XChainId | undefined) => {
  const chain = xChainId ? xChainMap[xChainId] : undefined;
  const wallets = useWallets();
  return chain ? wallets[chain.xWalletType] : undefined;
};

export default useXWallet;
