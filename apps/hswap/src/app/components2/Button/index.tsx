import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowIcon, ArrowWhiteIcon } from '../Icons';
import { cn } from '@/lib/utils';

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

interface BlueButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
  [key: string]: any;
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
