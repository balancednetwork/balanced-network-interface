import React from 'react';

interface LockBarProps {
  disabled: boolean;
  percent: number;
  text?: string;
}

export default function LockBar({ disabled, percent, text = 'Locked' }: LockBarProps) {
  return (
    <div id="indicator-locked-container">
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
