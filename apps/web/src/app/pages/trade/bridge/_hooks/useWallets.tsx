import { XChainId, XWalletType } from '../types';
import { useArchwayContext } from 'packages/archway/ArchwayProvider';
import { useIconReact } from 'packages/icon-react';
import { useMemo } from 'react';
import useEVMReact from './useEVMReact';
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
      Object.values(wallets)
        .filter(w => !!w.account)
        .map(w => ({ xChainId: w.xChainId, address: w.account! })),
    [wallets],
  );
}
