import React from 'react';

export const ChevronUpIcon: React.FC<React.ComponentProps<'svg'>> = props => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg width="12" height="8" viewBox="0 0 12 8" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 2.51859e-05L12 6.00002L10.6 7.40002L6 2.80002L1.4 7.40002L1.2517e-06 6.00002L6 2.51859e-05Z" />
    </svg>
  );
};
