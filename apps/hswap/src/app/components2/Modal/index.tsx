import * as React from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { isMobile } from 'react-device-detect';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

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
          className={cn('p-4 border-none top-[136px] translate-y-0 !rounded-3xl', className, dialogClassName)}
          showOverlay={showOverlay}
        >
          {!hideCloseIcon && (
            <DialogClose asChild>
              <div className="absolute right-6 top-8 cursor-pointer rounded-sm opacity-70 !mt-0 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <XIcon className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </div>
            </DialogClose>
          )}
          <DialogHeader>
            {title ? (
              <DialogTitle className="text-subtitle">{title}</DialogTitle>
            ) : (
              <VisuallyHidden.Root>
                <DialogTitle className="text-subtitle">{title}</DialogTitle>
              </VisuallyHidden.Root>
            )}
            <DialogDescription />
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={_ => onDismiss()}>
      <SheetContent className={cn('p-4 border-border', className)} side={'bottom'}>
        <SheetHeader className="text-left px-0">
          {title ? (
            <SheetTitle>{title}</SheetTitle>
          ) : (
            <VisuallyHidden.Root>
              <SheetTitle>{title}</SheetTitle>
            </VisuallyHidden.Root>
          )}
          <SheetDescription />
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
