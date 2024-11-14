import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ArrowIcon from '@/assets/icons2/arrow.svg';
import ArrowWhiteIcon from '@/assets/icons2/arrow-white.svg';

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
  icon = <ArrowIcon />,
  hoverIcon = <ArrowWhiteIcon />,
  ...props
}: BlueButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      {...props}
      className="blue-button-bg-gradient hover:blue-button-bg-gradient-hover rounded-full group px-8 py-[14px] w-full"
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
