import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { AnalyticsEvents } from '../utils/analytics';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trackingId?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, trackingId, onClick, ...props }) => {
  const { track } = useAnalytics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Track the button click
    track('BUTTON_CLICK', {
      buttonId: trackingId,
      buttonText: typeof children === 'string' ? children : undefined,
    });

    // Call the original onClick handler if it exists
    onClick?.(e);
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
};
