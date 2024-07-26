import { XChainId, XWalletType } from '../types';
import { useArchwayContext } from 'packages/archway/ArchwayProvider';
import { useIconReact } from 'packages/icon-react';
import { useMemo } from 'react';
import useEVMReact from './useEVMReact';
import { XWallet } from '../_xcall/types';
import { addAllEvmChains } from 'utils';
import { useHavahContext } from 'packages/havah/HavahProvider';

const useWallets = (): {
  [key in XWalletType]: { account: string | undefined | null; xChainId: XChainId | undefined; disconnect: () => void };
} => {
  const arch = useArchwayContext();
  const icon = useIconReact();
  const havah = useHavahContext();
  const evm = useEVMReact();

  return useMemo(
    () => ({
      [XWalletType.ICON]: {
        account: icon.account,
        xChainId: '0x1.icon',
        disconnect: icon.disconnect,
      },
      [XWalletType.COSMOS]: {
        account: arch.address,
        xChainId: 'archway-1',
        disconnect: arch.disconnect,
      },
      [XWalletType.EVM]: {
        account: evm.account,
        xChainId: evm.xChainId,
        disconnect: evm.disconnect,
      },
      [XWalletType.EVM_ARBITRUM]: {
        account: evm.xChainId === '0xa4b1.arbitrum' ? undefined : evm.account,
        xChainId: '0xa4b1.arbitrum',
        disconnect: evm.disconnect,
      },
      [XWalletType.EVM_AVALANCHE]: {
        account: evm.xChainId === '0xa86a.avax' ? undefined : evm.account,
        xChainId: '0xa86a.avax',
        disconnect: evm.disconnect,
      },
      [XWalletType.EVM_BSC]: {
        account: evm.xChainId === '0x38.bsc' ? undefined : evm.account,
        xChainId: '0x38.bsc',
        disconnect: evm.disconnect,
      },
      [XWalletType.EVM_BASE]: {
        account: evm.xChainId === '0x2105.base' ? undefined : evm.account,
        xChainId: '0x2105.base',
        disconnect: evm.disconnect,
      },
      [XWalletType.HAVAH]: {
        account: havah.address,
        xChainId: '0x100.icon',
        disconnect: havah.disconnect,
      },
    }),
    [arch, icon, evm, havah],
  );
};

export default useWallets;

export function useSignedInWallets(): { address: string; xChainId: XChainId | undefined }[] {
  const wallets = useWallets();

  return useMemo(
    () =>
      Object.entries(wallets)
        .filter(
          ([key, w]) =>
            !!w.account &&
            (Number(key) === XWalletType.ICON || Number(key) === XWalletType.COSMOS || Number(key) === XWalletType.EVM),
        )
        .map(([, w]) => ({ xChainId: w.xChainId, address: w.account! })),
    [wallets],
  );
}

export function useAllDerivedWallets(): XWallet[] {
  const signedInWallets = useSignedInWallets();

  return useMemo(() => addAllEvmChains(signedInWallets), [signedInWallets]);
}

export function useAvailableWallets(): { address: string; xChainId: XChainId }[] {
  const wallets = useWallets();
  return useMemo(
    () =>
      Object.values(wallets)
        .filter(w => !!w.account && !!w.xChainId)
        .map(w => ({ xChainId: w.xChainId!, address: w.account! })),
    [wallets],
  );
}
