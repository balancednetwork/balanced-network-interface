import React from 'react';

interface LockBarProps {
  disabled: boolean;
  percent: number;
  text?: string;
}

export default function LockBar({ disabled, percent, text = 'Locked' }: LockBarProps) {
  const className = percent < 9 ? 'left-aligned' : percent > 91 ? 'right-aligned' : '';
  return (
    <div id="indicator-locked-container" className={className}>
      <div
        id="indicator-locked"
        className={disabled ? `text-${text.toLowerCase()}` : `text-${text.toLowerCase()} disabled`}
        style={{ left: `${Math.min(percent, 100)}%` }}
      >
        <p className="label">{text}</p>
      </div>
    </div>
  );
}
