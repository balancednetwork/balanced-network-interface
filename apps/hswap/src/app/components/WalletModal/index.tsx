import React, { useCallback, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { HeartIcon, LogsIcon, SettingsIcon } from 'lucide-react';

import { AnimateButton } from '@/app/components2/Button/AnimateButton';
import HideIcon from '@/assets/icons2/hide.svg';
import ShutdownIcon from '@/assets/icons2/shutdown.svg';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { cn } from '@/lib/utils';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { xChainTypes } from '../WalletConnectModal';
import WalletItem from '../WalletConnectModal/WalletItem';
import HistoryItemList from './HistoryItemList';
import { IconWithConfirmTextButton } from './IconWithConfirmTextButton';
import XTokenList from './XTokenList';

const WalletModalContent = ({ onDismiss }) => {
  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    onDismiss();
    await xDisconnectAll();
  };

  const [step, setStep] = useState(1);

  return (
    <>
      <div className="flex items-center justify-between mt-[60px] mb-[44px] px-12">
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

      <div className="flex gap-2 justify-center mb-[66px]">
        <AnimateButton
          Icon={<HeartIcon className="text-[#695682]" />}
          text="Tokens"
          showText={step === 1}
          onClick={() => setStep(1)}
        />
        <AnimateButton
          Icon={<LogsIcon className="text-[#695682]" />}
          text="History"
          showText={step === 2}
          onClick={() => setStep(2)}
        />
        <AnimateButton
          Icon={<SettingsIcon className="text-[#695682]" />}
          text="Setting"
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
              {xChainTypes.map(wallet => (
                <WalletItem key={wallet.xChainType} {...wallet} />
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
