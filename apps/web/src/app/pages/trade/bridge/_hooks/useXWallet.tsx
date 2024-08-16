import { XChainId } from '@/types';
import { xChainMap } from '../_config/xChains';
import useWallets from './useWallets';

const useXWallet = (xChainId: XChainId | undefined) => {
  const chain = xChainId ? xChainMap[xChainId] : undefined;
  const wallets = useWallets();
  return chain ? wallets[chain.xWalletType] : undefined;
};

export default useXWallet;
