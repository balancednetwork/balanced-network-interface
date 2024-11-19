import * as React from 'react';

import { Dialog, DialogClose, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { XIcon } from 'lucide-react';
import { isMobile } from 'react-device-detect';
import { cn } from '@/lib/utils';

//ModalProps
interface ModalProps {
  open: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  title?: string;
  hideCloseIcon?: boolean;
  className?: string;
  dialogClassName?: string;
  showOverlay?: boolean;
}

export function Modal({
  open,
  onDismiss,
  children,
  title,
  hideCloseIcon = false,
  className,
  dialogClassName,
  showOverlay = false,
}: ModalProps) {
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={_ => onDismiss()}>
        <DialogContent
          className={cn('p-4 border-none top-[136px] translate-y-0', className, dialogClassName)}
          showOverlay={showOverlay}
        >
          {(title || !hideCloseIcon) && (
            <DialogHeader className="flex flex-row-reverse justify-between items-center">
              {!hideCloseIcon && (
                <DialogClose asChild>
                  <div className="cursor-pointer rounded-sm opacity-70 !mt-0 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <XIcon className="h-6 w-6" />
                    <span className="sr-only">Close</span>
                  </div>
                </DialogClose>
              )}
              {title && <div className="text-subtitle">{title}</div>}
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={_ => onDismiss()}>
      <DrawerContent className={cn('p-4 border-border', className)}>
        <DrawerHeader className="text-left px-0">{title && <DrawerTitle>{title}</DrawerTitle>}</DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
