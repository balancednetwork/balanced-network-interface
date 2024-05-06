import { XChainId } from '../types';
import { xChainMap } from '../_config/xChains';
import useWallets from './useWallets';

const useXWallet = (chainId: XChainId) => {
  const chain = xChainMap[chainId];
  const wallets = useWallets();
  return wallets[chain.xWalletType];
};

export default useXWallet;
