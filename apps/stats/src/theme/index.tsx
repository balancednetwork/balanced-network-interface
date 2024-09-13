import React from 'react';

import { TextProps } from 'rebass';
import { Text } from 'rebass/styled-components';
import { MediaFunction, ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle } from 'styled-components';
import { DefaultTheme, css } from 'styled-components';

import texGyeAdventorBoldWoff from '@/assets/font/tex-gyre-adventor-bold/tex-gyre-adventor-bold.woff';
import texGyeAdventorBoldWoff2 from '@/assets/font/tex-gyre-adventor-bold/tex-gyre-adventor-bold.woff2';
import texGyeAdventorRegularWoff from '@/assets/font/tex-gyre-adventor-regular/tex-gyre-adventor-regular.woff';
import texGyeAdventorRegularWoff2 from '@/assets/font/tex-gyre-adventor-regular/tex-gyre-adventor-regular.woff2';

// Update your breakpoints if you want
export const sizes = {
  upToExtraSmall: 600,
  upToSmall: 800,
  upToMedium: 1000,
  upToLarge: 1280,
  upToSuperExtraSmall: 385,
};

// Iterate through the sizes and create a media template
export const media = (Object.keys(sizes) as Array<keyof typeof sizes>).reduce(
  (acc, label) => {
    acc[label] = (first: any, ...interpolations: any[]) => css`
    @media (max-width: ${sizes[label]}px) {
      ${css(first, ...interpolations)}
    }
  `;

    return acc;
  },
  {} as { [key in keyof typeof sizes]: MediaFunction },
);

export function theme(): DefaultTheme {
  return {
    colors: {
      //base
      white: '#FFFFFF',
      black: '#000000',

      // text white
      text: '#FFFFFF',

      // balanced dark grey
      text1: '#D5D7DB',

      // backgrounds
      // Balanced navy blue
      bg1: '#01002A',

      // Balanced panel
      bg2: '#0c2a4d',

      // Balanced parent paenl
      bg3: '#144a68',

      bg4: '#0b284c',

      bg5: '#021338',

      // Balanced turquoise
      primary: '#2ca9b7',

      primaryBright: '#2fccdc',

      //specialty colors
      modalBG: 'rgba(1, 0, 42, 0.75)',
      advancedBG: 'rgba(255,255,255,0.6)',

      // divider
      divider: 'rgba(255, 255, 255, 0.15)',

      // alert
      alert: '#fb6a6a',
    },

    fontSizes: [12, 14, 16, 20, 25, 35],

    space: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],

    // media queries
    mediaWidth: media,

    // shadows
    shadow1: '#2F80ED',

    // breakpoints
    breakpoints: Object.values(sizes).map(size => `${size}px`),

    // z-index
    zIndices: {
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
  };
}

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'label' | 'body';

export const Typography = React.forwardRef((props: TextProps & { variant?: TypographyVariant }, ref) => {
  const { variant, ...rest } = props;

  switch (variant) {
    case 'h1':
      return <Text ref={ref} as="h1" color="text" fontSize={35} fontWeight="bold" {...rest} />;
    case 'h2':
      return <Text ref={ref} as="h2" color="text" fontSize={25} fontWeight="bold" {...rest} />;
    case 'h3':
      return <Text ref={ref} as="h3" color="text" fontSize={20} fontWeight="bold" {...rest} />;
    case 'p':
      return <Text ref={ref} as="p" color="text" fontSize={16} {...rest} />;
    case 'label':
      return <Text ref={ref} as="label" fontSize={14} {...rest} />;
    case 'body':
      return <Text ref={ref} as="p" fontSize={14} {...rest} />;
    default:
      return <Text ref={ref} as="p" fontSize={14} {...rest} />;
  }
});

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeObject = theme();

  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>;
}

export const FixedGlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'tex-gyre-adventor';
    src: url(${texGyeAdventorRegularWoff2}) format('woff2'),
    url(${texGyeAdventorRegularWoff}) format('woff');
    font-weight: normal;
    font-style: normal;
  }

  @font-face {
    font-family: 'tex-gyre-adventor';
    src: url(${texGyeAdventorBoldWoff2}) format('woff2'),
    url(${texGyeAdventorBoldWoff}) format('woff');
    font-weight: bold;
    font-style: normal;
  }

  html,
  body {
    height: 100%;
    max-width: 100%;
    overflow-x: hidden;
    line-height: 1.4;
  }

  body,button {
    line-height: 1.4;
    font-family: 'tex-gyre-adventor', Arial, sans-serif;
  }

  #root {
    min-height: 100%;
    min-width: 100%;
  }

  input, select {
    font-family: inherit;
    font-size: inherit;
  }

  div, button:focus {
    outline: none;
  }

  /* Borders */

  .border-left {
    border-left: 1px solid rgba(255, 255, 255, 0.15);
  }
  .border-right {
    border-right: 1px solid rgba(255, 255, 255, 0.15);
  }
  .border-top {
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }
  .border-bottom {
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  /* Utils */
  .alert {
    color: #fb6a6a;
  }

  .white {
    color: #FFFFFF;
  }

  .actived {
    border-color: #2ca9b7 !important;
  }

  [hidden] {
    display: none !important;
  }

`;

export const ThemedGlobalStyle = createGlobalStyle`
  html {
    color: ${({ theme }) => theme.colors.text1};
    background-color: ${({ theme }) => theme.colors.bg1};
  }

  body {
    min-height: 100vh;
  }

`;
