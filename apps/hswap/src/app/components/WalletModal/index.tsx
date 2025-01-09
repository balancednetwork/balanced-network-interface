import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import React, { useCallback, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { AnimateButton } from '@/app/components/Button/AnimateButton';
import {
  HeartGradientIcon,
  HeartIcon,
  HideIcon,
  LogsGradientIcon,
  LogsIcon,
  ShutdownGradientIcon,
  ShutdownIcon,
  WalletGradientIcon,
  WalletIcon,
} from '@/app/components/Icons';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { cn } from '@/lib/utils';
import { useXDisconnectAll } from '@balancednetwork/xwagmi';
import WalletItem, { WalletItemProps } from '../WalletConnectModal/WalletItem';
import HistoryItemList from './HistoryItemList';
import { IconWithConfirmTextButton } from './IconWithConfirmTextButton';
import XTokenList from './XTokenList';

export const xChainTypes: WalletItemProps[] = [
  {
    name: 'EVM',
    xChainType: 'EVM',
  },
  {
    name: 'Solana',
    xChainType: 'SOLANA',
  },
  {
    name: 'Sui',
    xChainType: 'SUI',
  },
  {
    name: 'Injective',
    xChainType: 'INJECTIVE',
  },
  {
    name: 'Stellar',
    xChainType: 'STELLAR',
  },
  {
    name: 'ICON',
    xChainType: 'ICON',
  },
  {
    name: 'Archway',
    xChainType: 'ARCHWAY',
  },
  {
    name: 'Havah',
    xChainType: 'HAVAH',
  },
];

const WalletModalContent = ({ onDismiss }) => {
  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    onDismiss();
    await xDisconnectAll();
  };

  const [step, setStep] = useState(1);

  const [showText, setShowText] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mt-[60px] mb-[44px] px-12">
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <HideIcon />
        </Button>
        <IconWithConfirmTextButton
          Icon={showText ? <ShutdownGradientIcon /> : <ShutdownIcon />}
          text="Disconnect"
          dismissOnHoverOut={true}
          onConfirm={handleDisconnectWallet}
          onShowConfirm={setShowText}
        />
      </div>

      <div className="flex gap-2 justify-center mb-[66px]">
        <AnimateButton
          Icon={step === 1 ? <HeartGradientIcon /> : <HeartIcon />}
          text="Tokens"
          showText={step === 1}
          onClick={() => setStep(1)}
        />
        <AnimateButton
          Icon={step === 2 ? <LogsGradientIcon /> : <LogsIcon />}
          text="History"
          showText={step === 2}
          onClick={() => setStep(2)}
        />
        <AnimateButton
          Icon={step === 3 ? <WalletGradientIcon /> : <WalletIcon />}
          text="Wallets"
          showText={step === 3}
          onClick={() => setStep(3)}
        />
      </div>

      {step === 1 && (
        <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-290px)]')}>
          <ScrollArea>
            <XTokenList />
          </ScrollArea>
        </div>
      )}

      {step === 2 && (
        <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-290px)]')}>
          <ScrollArea>
            <HistoryItemList />
          </ScrollArea>
        </div>
      )}

      {step === 3 && (
        <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-290px)]')}>
          <ScrollArea className="h-full">
            <div className="w-full flex flex-col gap-4 mt-2">
              <Separator className="h-1 bg-[#ffffff59]" />

              {xChainTypes.map(wallet => (
                <>
                  <WalletItem key={'wallet_' + wallet.xChainType} {...wallet} />
                  <Separator key={'wallet_' + wallet.xChainType + '_separator'} className="h-1 bg-[#ffffff59]" />
                </>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
};

const WalletModal = ({ modalId = MODAL_ID.WALLET_MODAL }) => {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  return (
    <Sheet open={open} onOpenChange={_ => isMobile && onDismiss()} modal={isMobile}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col gap-2 px-0 py-4 w-96 bg-gradient-to-b from-[#f5e7f5] via-[#d29fff] to-[#a079fd] ',
          isMobile ? 'w-full' : 'rounded-tl-3xl rounded-bl-3xl',
        )}
      >
        <VisuallyHidden.Root>
          <SheetTitle>Wallet Modal</SheetTitle>
          <SheetDescription>Wallet Modal</SheetDescription>
        </VisuallyHidden.Root>
        <WalletModalContent onDismiss={onDismiss} />
      </SheetContent>
    </Sheet>
  );
};

export default WalletModal;
