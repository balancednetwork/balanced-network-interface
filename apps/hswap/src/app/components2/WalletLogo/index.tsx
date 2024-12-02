import { cn } from '@/lib/utils';
import React from 'react';

import HanaIcon from '@balancednetwork/xwagmi';
import HavahIcon from '@balancednetwork/xwagmi';
import KeplrIcon from '@balancednetwork/xwagmi';
import MetaMaskIcon from '@balancednetwork/xwagmi';
import PhantomIcon from '@balancednetwork/xwagmi';
import SuiIcon from '@balancednetwork/xwagmi';
import { WalletId } from '@balancednetwork/xwagmi';

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
