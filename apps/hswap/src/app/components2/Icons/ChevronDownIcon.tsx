import React from 'react';

export const ChevronDownIcon: React.FC<React.ComponentProps<'svg'>> = props => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg width="12" height="8" viewBox="0 0 12 8" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 7.4L12 1.4L10.6 0L6 4.6L1.4 0L1.43051e-06 1.4L6 7.4Z" />
    </svg>
  );
};
