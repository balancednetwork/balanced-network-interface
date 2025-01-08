import React, { useState } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowIcon, ArrowWhiteIcon } from '../Icons';

interface WhiteButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const WhiteButton = ({ children, className, ...props }: WhiteButtonProps) => {
  return (
    <Button {...props} className={cn('bg-[#E6E0F7] hover:bg-foreground rounded-full group px-8 py-[14px]', className)}>
      <span className="font-bold text-title-gradient group-hover:text-title-gradient-hover flex gap-2 items-center">
        {children}
      </span>
    </Button>
  );
};

interface BlueButtonProps extends ButtonProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
}

export const BlueButton = ({
  children,
  className,
  icon = <ArrowIcon className="fill-[#e6e0f7] opacity-40" />,
  hoverIcon = <ArrowWhiteIcon />,
  ...props
}: BlueButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      {...props}
      className={cn(
        'blue-button-bg-gradient hover:blue-button-bg-gradient-hover rounded-full group px-8 py-[14px] w-full h-[48px]',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-[#e6e0f7] text-sm font-bold leading-tight group-hover:text-white flex gap-2 items-center">
        {children}
        {isHovered && hoverIcon ? hoverIcon : icon}
      </span>
    </Button>
  );
};
