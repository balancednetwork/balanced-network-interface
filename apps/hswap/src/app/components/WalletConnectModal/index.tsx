import React, { useCallback, useMemo } from 'react';

import { ArrowIcon, SubtractIcon } from '@/app/components2/Icons';
import { Modal } from '@/app/components2/Modal';
import { WalletLogo } from '@/app/components2/WalletLogo';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { cn } from '@/lib/utils';
import { useXConnectAllChains } from '@balancednetwork/xwagmi';
import { WalletId } from '@balancednetwork/xwagmi';
import { EVMWalletModal } from './EVMWalletModal';
import { InjectiveWalletOptionsModal } from './InjectiveWalletOptionsModal';
import { SuiWalletOptionsModal } from './SuiWalletOptionsModal';

export const wallets: {
  id: WalletId;
  name: string;
  description: string;
}[] = [
  {
    id: WalletId.SUI,
    name: 'Sui Wallet',
    description: 'MOVE',
  },
  {
    id: WalletId.HAVAH,
    name: 'HAVAH',
    description: 'JVM',
  },
  {
    id: WalletId.METAMASK,
    name: 'MetaMask',
    description: 'EVM & COSMOS',
  },
  {
    id: WalletId.PHANTOM,
    name: 'Phantom',
    description: 'EVM & SOLANA',
  },
  {
    id: WalletId.KEPLR,
    name: 'Keplr',
    description: 'COSMOS',
  },
];

export default function WalletConnectModal({ modalId = MODAL_ID.WALLET_CONNECT_MODAL }) {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  const isHanaWalletInstalled = useMemo(() => {
    // @ts-ignore
    return !!window?.hanaWallet;
  }, []);

  const xConnectAllChains = useXConnectAllChains();
  const handleConnect = async (walletId: WalletId) => {
    await xConnectAllChains(walletId);
    onDismiss();
  };

  return (
    <>
      <Modal
        open={open}
        onDismiss={onDismiss}
        dialogClassName="max-w-[375px]"
        className="bg-[#0d0229] p-0"
        showOverlay={true}
      >
        <div
          className={cn(
            'grid grid-cols-2 gap-2 p-2 bg-no-repeat pt-[280px] pb-10 px-6',
            isHanaWalletInstalled
              ? "bg-[url('/marsh-flying-2.png')]"
              : "bg-[url('/marsh-with-stick.png')] bg-[right_0_top_54px]",
          )}
        >
          <div
            className="relative h-36 bg-[#221542] rounded-3xl w-full gap-2 col-span-2 flex items-end p-6 cursor-pointer"
            onClick={() => handleConnect(WalletId.HANA)}
          >
            {isHanaWalletInstalled ? (
              <>
                <div className="absolute right-0 top-[-110px] text-right text-title-gradient text-[28px] font-extrabold leading-[30px] cursor-default">
                  <div>Choose</div>
                  <div>your wallet.</div>
                </div>
                <div className={cn('absolute top-[-16px] right-[45px]')}>
                  <SubtractIcon className="fill-[#221542]" />
                </div>
                <div className="flex gap-2 items-center">
                  <WalletLogo walletId={WalletId.HANA} />
                  <div className="flex flex-col gap-1">
                    <div className="text-[#685682] text-[10px] font-semibold uppercase leading-3">ALL CHAINS</div>
                    <div className="text-[#e6e0f7] text-xs font-bold leading-none">Hana Wallet</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="absolute left-0 top-[-140px] flex flex-col gap-1 cursor-default">
                  <div className="text-title-gradient text-[28px] font-extrabold leading-[30px]">
                    <div>All chains,</div>
                    <div>one wallet.</div>
                  </div>
                  <div className="text-[#d4c5f9] text-xs font-medium leading-4">
                    Interact with different chains
                    <br /> from just one wallet.
                  </div>
                </div>
                <div className={cn('absolute top-[-16px] left-[45px]')}>
                  <SubtractIcon className="fill-[#221542]" />
                </div>
                <div className="w-full flex flex-col gap-1">
                  <div className="flex gap-2 items-center">
                    <WalletLogo walletId={WalletId.HANA} />
                    <div className="flex flex-col gap-1">
                      <div className="text-[#e6e0f7] text-xs font-bold leading-none">Try Hana</div>
                      <div className="text-[#e6e0f7] text-xs font-bold leading-none">multi-chain!</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[#685682] text-[10px] font-medium leading-3">
                      Manage SUI, SOL, BTC, ETH, INJ, and more,
                      <br /> with full control of your keys.
                    </div>
                    <ArrowIcon className="fill-[#685682]" />
                  </div>
                </div>
              </>
            )}
          </div>
          {wallets.map(wallet => (
            <div
              key={wallet.name}
              className="h-[88px] bg-[#221542] rounded-3xl flex items-end p-4 pr-0 cursor-pointer"
              onClick={() => handleConnect(wallet.id)}
            >
              <div className="flex gap-2 items-center">
                <WalletLogo walletId={wallet.id} />
                <div className="flex flex-col gap-1">
                  <div className="text-[#685682] text-[10px] font-semibold uppercase leading-3">
                    {wallet.description}
                  </div>
                  <div className="text-[#e6e0f7] text-xs font-bold leading-none">{wallet.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <EVMWalletModal />
      <InjectiveWalletOptionsModal />
      <SuiWalletOptionsModal />
    </>
  );
}
