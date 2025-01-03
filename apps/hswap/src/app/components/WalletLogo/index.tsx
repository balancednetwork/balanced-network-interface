import React from 'react';
import { WalletId } from '@balancednetwork/xwagmi';
import { cn } from '@/lib/utils';

const HanaIcon = 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/hana.svg';
const HavahIcon = 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/havah.svg';
const KeplrIcon = 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/keplr.svg';
const MetaMaskIcon = 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/metamask.svg';
const PhantomIcon = 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/phantom.svg';
const SuiIcon = 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/sui.svg';

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
