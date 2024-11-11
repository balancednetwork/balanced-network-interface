import React, { useCallback, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { Trans } from '@lingui/macro';
import { ChevronsRightIcon, HeartIcon, LogsIcon, PowerIcon, SettingsIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { cn } from '@/lib/utils';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { xChainTypes } from '../WalletConnectModal';
import WalletItem from '../WalletConnectModal/WalletItem';
import HistoryItemList from './HistoryItemList';
import { IconWithConfirmTextButton } from './IconWithConfirmTextButton';
import XTokenList from './XTokenList';
import HideIcon from '@/assets/icons2/hide.svg';
import ShutdownIcon from '@/assets/icons2/shutdown.svg';

const WalletModalContent = ({ onDismiss }) => {
  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    onDismiss();
    await xDisconnectAll();
  };

  const [step, setStep] = useState(1);

  return (
    <>
      <div className="flex items-center justify-between gap-2 mt-[60px] mb-[44px] px-12">
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <HideIcon />
        </Button>
        <IconWithConfirmTextButton
          Icon={<ShutdownIcon />}
          text="Disconnect"
          dismissOnHoverOut={true}
          onConfirm={handleDisconnectWallet}
        />
      </div>

      <div className="flex gap-2 justify-center">
        <button
          type="button"
          className={cn(
            'h-12 px-3 rounded-[64px] flex items-center justify-center hover:bg-white/80 overflow-hidden',
            step === 1 ? 'bg-white' : 'bg-white/60',
          )}
          onClick={() => setStep(1)}
        >
          <HeartIcon className="text-[#695682]" />
          <span
            className={cn(
              'text-[#695682] text-sm font-bold overflow-hidden',
              step === 1 ? 'w-16 transition-all duration-500' : 'w-0 transition-all duration-500',
            )}
          >
            Tokens
          </span>
        </button>

        <button
          type="button"
          className={cn(
            'h-12 px-3 rounded-[64px] flex items-center justify-center hover:bg-white/80 overflow-hidden',
            step === 2 ? 'bg-white' : 'bg-white/60',
          )}
          onClick={() => setStep(2)}
        >
          <LogsIcon className="text-[#695682]" />
          <span
            className={cn(
              'text-[#695682] text-sm font-bold overflow-hidden',
              step === 2 ? 'w-16 transition-all duration-500' : 'w-0 transition-all duration-500',
            )}
          >
            History
          </span>
        </button>

        <button
          type="button"
          className={cn(
            'h-12 px-3 rounded-[64px] flex items-center justify-center hover:bg-white/80 overflow-hidden',
            step === 3 ? 'bg-white' : 'bg-white/60',
          )}
          onClick={() => setStep(3)}
        >
          <SettingsIcon className="text-[#695682]" />
          <span
            className={cn(
              'text-[#695682] text-sm font-bold overflow-hidden',
              step === 3 ? 'w-16 transition-all duration-500' : 'w-0 transition-all duration-500',
            )}
          >
            Setting
          </span>
        </button>
      </div>

      {step === 1 && (
        <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
          <ScrollArea>
            <XTokenList />
          </ScrollArea>
        </div>
      )}

      {step === 2 && (
        <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
          <ScrollArea>
            <HistoryItemList />
          </ScrollArea>
        </div>
      )}

      {step === 3 && (
        <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
          <ScrollArea className="h-full">
            <div className="w-full flex flex-col gap-4 mt-2">
              {xChainTypes.map(wallet => (
                <WalletItem key={wallet.xChainType} {...wallet} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* <Tabs defaultValue="tokens">
        <TabsList className="gap-2">
      <Tabs defaultValue="tokens">
        <TabsList className="gap-2 justify-center flex">
          <TabsTrigger
            value="tokens"
            className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
          >
            <div className="text-base font-bold font-['Montserrat']">
              <Trans>Tokens</Trans>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
          >
            <div className="text-base font-bold font-['Montserrat']">
              <Trans>History</Trans>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="wallets"
            className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
          >
            <div className="text-base font-bold font-['Montserrat']">
              <Trans>Wallets</Trans>
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tokens" className="mt-4">
          <div
            className={cn('flex flex-col justify-between text-black', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}
          >
            <ScrollArea>
              <XTokenList />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
            <ScrollArea>
              <HistoryItemList />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="wallets" className="mt-4">
          <div className={cn('flex flex-col justify-between', isMobile ? 'h-[500px]' : 'h-[calc(100vh-130px)]')}>
            <ScrollArea className="h-full">
              <div className="w-full flex flex-col gap-4 mt-2">
                {xChainTypes.map(wallet => (
                  <WalletItem key={wallet.xChainType} {...wallet} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs> */}
    </>
  );
};

const WalletModal = ({ modalId = MODAL_ID.WALLET_MODAL }) => {
  const open = useModalOpen(modalId);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
  }, [modalId]);

  if (!isMobile) {
    return (
      <Sheet open={open} modal={false}>
        <SheetContent className="flex flex-col gap-2 px-0 py-4 w-96 bg-gradient-to-b from-[#f5e7f5] via-[#d29fff] to-[#a079fd] rounded-tl-3xl rounded-bl-3xl">
          <WalletModalContent onDismiss={onDismiss} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={_ => onDismiss()}>
      <DrawerContent className="p-4 border-border">
        {/* <DrawerHeader className="text-left px-0">{<DrawerTitle>{title}</DrawerTitle>}</DrawerHeader> */}
        <WalletModalContent onDismiss={onDismiss} />
      </DrawerContent>
    </Drawer>
  );
};

export default WalletModal;
