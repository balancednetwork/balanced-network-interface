import { XChainId, XWalletType } from '../types';
import { useArchwayContext } from '../../../../_xcall/archway/ArchwayProvider';
import { useIconReact } from 'packages/icon-react';
import { useMemo } from 'react';
import useEVMReact from './useEVMReact';

const useWallets = (): {
  [key in XWalletType]: { account: string | undefined | null; xChainId: XChainId | undefined; disconnect: () => void };
} => {
  const arch = useArchwayContext();
  const icon = useIconReact();
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
    }),
    [arch, icon, evm],
  );
};

export default useWallets;
