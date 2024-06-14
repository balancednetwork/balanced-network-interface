import { XWalletType } from '../types';
import { useArchwayContext } from '../../../../_xcall/archway/ArchwayProvider';
import { xChainMap } from '../_config/xChains';
import { useIconReact } from 'packages/icon-react';
import { useMemo } from 'react';
import useEVMReact from './useEVMReact';
import { useHavahContext } from 'app/_xcall/havah/HavahProvider';

const useWallets = () => {
  const arch = useArchwayContext();
  const icon = useIconReact();
  const avax = useEVMReact();
  const havah = useHavahContext();

  return useMemo(
    () => ({
      [XWalletType.ICON]: {
        account: icon.account,
        chain: xChainMap['0x1.icon'],
        disconnect: icon.disconnect,
      },
      [XWalletType.COSMOS]: {
        account: arch.address,
        chain: xChainMap['archway-1'],
        disconnect: arch.disconnect,
      },
      [XWalletType.EVM]: {
        account: avax.account,
        chain: xChainMap['0xa86a.avax'],
        disconnect: avax.disconnect,
      },
      [XWalletType.HAVAH]: {
        account: havah.address,
        chain: xChainMap['0x100.havah'],
        disconnect: havah.disconnect,
      },
    }),
    [arch, icon, avax, havah],
  );
};

export default useWallets;
