import { XWalletType } from '../types';
import { useArchwayContext } from '../../../../_xcall/archway/ArchwayProvider';
import { xChainMap } from '../_config/xChains';
import { useIconReact } from 'packages/icon-react';
import { useMemo } from 'react';
import useEVMReact from './useEVMReact';

const useWallets = () => {
  const arch = useArchwayContext();
  const icon = useIconReact();
  const avax = useEVMReact();

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
    }),
    [arch, icon, avax],
  );
};

export default useWallets;
