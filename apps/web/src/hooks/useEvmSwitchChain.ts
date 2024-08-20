import { xChainMap } from '@/constants/xChains';
import { XChainId } from '@/types';
import { getXChainType } from '@/xwagmi/actions';
import { useAccount, useSwitchChain } from 'wagmi';

export const useEvmSwitchChain = (expectedXChainId: XChainId) => {
  const xChainType = getXChainType(expectedXChainId);
  const expectedChainId = xChainMap[expectedXChainId].id as number;

  const { chainId } = useAccount();
  const isWrongChain = xChainType === 'EVM' && chainId !== expectedChainId;

  const { switchChain } = useSwitchChain();
  const handleSwitchChain = () => {
    switchChain({ chainId: expectedChainId });
  };

  return { isWrongChain, handleSwitchChain };
};
