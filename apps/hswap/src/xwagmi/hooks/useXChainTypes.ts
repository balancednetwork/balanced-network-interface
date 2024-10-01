import { useXWagmiStore } from '../useXWagmiStore';

export function useXChainTypes() {
  const xChainTypes = useXWagmiStore(state => Object.keys(state.xServices));
  return xChainTypes;
}
