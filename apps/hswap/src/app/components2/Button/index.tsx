import React from 'react';
import { Button } from '@/components/ui/button';

interface WhiteButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const WhiteButton = ({ children, className, ...props }: WhiteButtonProps) => {
  return (
    <Button {...props} className="bg-[#E6E0F7] hover:bg-foreground rounded-full group px-8 py-[14px]">
      <span className="font-bold text-title-gradient group-hover:text-title-gradient-hover flex gap-2 items-center">
        {children}
      </span>
    </Button>
  );
};
