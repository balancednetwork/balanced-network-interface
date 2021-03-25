import React from 'react';

interface LockBarProps {
  disabled: boolean;
  percent: number;
}

export default function LockBar({ disabled, percent }: LockBarProps) {
  return (
    <div id="indicator-locked-container">
      <div id="indicator-locked" className={disabled ? '' : 'disabled'} style={{ left: `${percent}%` }}>
        <p className="label">Locked</p>
      </div>
    </div>
  );
}
