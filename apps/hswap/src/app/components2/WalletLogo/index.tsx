import React from 'react';
import { cn } from '@/lib/utils';

import HanaIcon from '@/xwagmi/assets/wallets/hana.svg?inline';
import KeplrIcon from '@/xwagmi/assets/wallets/keplr.svg?inline';
import MetaMaskIcon from '@/xwagmi/assets/wallets/metamask.svg?inline';
import HavahIcon from '@/xwagmi/assets/wallets/havah.svg?inline';
import PhantomIcon from '@/xwagmi/assets/wallets/phantom.svg?inline';
import SuiIcon from '@/xwagmi/assets/wallets/sui.svg?inline';

export type WalletId = 'metamask' | 'keplr' | 'phantom' | 'sui' | 'havah' | 'hana';

const walletIcons: Record<WalletId, any> = {
  hana: HanaIcon,
  metamask: MetaMaskIcon,
  keplr: KeplrIcon,
  phantom: PhantomIcon,
  sui: SuiIcon,
  havah: HavahIcon,
};

export const WalletLogo = ({ walletId, className }: { walletId: WalletId; className?: string }) => {
  return (
    <div
      className={cn(
        'overflow-hidden w-10 h-10 border-[3px] rounded-full justify-center items-center inline-flex',
        className,
      )}
    >
      <img width="100%" height="100%" src={walletIcons[walletId]} alt={walletId} />
    </div>
  );
};
