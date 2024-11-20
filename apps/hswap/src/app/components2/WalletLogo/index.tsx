import React from 'react';
import { cn } from '@/lib/utils';

import HanaIcon from '@/xwagmi/assets/wallets/hana.svg?inline';
import KeplrIcon from '@/xwagmi/assets/wallets/keplr.svg?inline';
import MetaMaskIcon from '@/xwagmi/assets/wallets/metamask.svg?inline';
import HavahIcon from '@/xwagmi/assets/wallets/havah.svg?inline';
import PhantomIcon from '@/xwagmi/assets/wallets/phantom.svg?inline';
import SuiIcon from '@/xwagmi/assets/wallets/sui.svg?inline';
import { WalletId } from '@/xwagmi/types';

const walletIcons: Record<WalletId, any> = {
  [WalletId.METAMASK]: MetaMaskIcon,
  [WalletId.HANA]: HanaIcon,
  [WalletId.KEPLR]: KeplrIcon,
  [WalletId.PHANTOM]: PhantomIcon,
  [WalletId.SUI]: SuiIcon,
  [WalletId.HAVAH]: HavahIcon,
};
interface WalletLogoPropsBase {
  className?: string;
}

interface WalletLogoWithIdProps extends WalletLogoPropsBase {
  walletId: WalletId;
  logo?: never;
}

interface WalletLogoWithLogoProps extends WalletLogoPropsBase {
  walletId?: never;
  logo: any;
}

type WalletLogoProps = WalletLogoWithIdProps | WalletLogoWithLogoProps;

export const WalletLogo = ({ walletId, logo, className }: WalletLogoProps) => {
  const icon = logo || (walletId && walletIcons[walletId]);

  return (
    <div
      className={cn(
        'overflow-hidden w-10 h-10 border-[3px] rounded-full justify-center items-center inline-flex',
        className,
      )}
    >
      {icon && <img width="100%" height="100%" src={icon} alt={walletId || 'wallet logo'} />}
    </div>
  );
};
