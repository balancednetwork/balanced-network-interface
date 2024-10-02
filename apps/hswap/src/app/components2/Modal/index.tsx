import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogClose } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { isMobile } from 'react-device-detect';
import { X } from 'lucide-react';

export function Modal({ open, onDismiss, children, title, hideCloseIcon = false }) {
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={_ => onDismiss()}>
        <DialogContent className="p-4 sm:max-w-[425px] border-[rgba(255,255,255,0.25)]">
          {title && !hideCloseIcon && (
            <DialogHeader className="flex flex-row-reverse justify-between items-center">
              {!hideCloseIcon && (
                <DialogClose asChild>
                  <div className="rounded-sm opacity-70 !mt-0 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-6 w-6" />
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
      <DrawerContent className="border-[rgba(255,255,255,0.25)]">
        <DrawerHeader className="text-left">{title && <DrawerTitle>{title}</DrawerTitle>}</DrawerHeader>
        {children}
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
