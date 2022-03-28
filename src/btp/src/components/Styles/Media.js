import { css } from 'styled-components/macro';

export const sizes = {
  xxs: '375',
  xs: '480',
  sm: '576',
  md: '768',
  lg: '992',
  minWidthHeader: '1050',
  xl: '1200',
  smallDesktop: '1366',
  xxl: '1600',
};

export const mediumSize = () => window.innerWidth <= +sizes.md;
export const extraSmallSize = () => window.innerWidth <= +sizes.xs;

export const media = Object.keys(sizes).reduce((accumulator, label) => {
  const pxSize = sizes[label];

  accumulator[label] = (...args) => css`
    @media (max-width: ${pxSize}px) {
      ${css(...args)};
    }
  `;

  return accumulator;
}, {});
