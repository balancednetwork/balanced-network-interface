import React from 'react';

import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, MediaFunction } from 'styled-components';
import { css, DefaultTheme } from 'styled-components/macro';

// Update your breakpoints if you want
export const sizes = {
  upToExtraSmall: 500,
  upToSmall: 720,
  upToMedium: 960,
  upToLarge: 1280,
};

// Iterate through the sizes and create a media template
export const media = (Object.keys(sizes) as Array<keyof typeof sizes>).reduce((acc, label) => {
  acc[label] = (first: any, ...interpolations: any[]) => css`
    @media (min-width: ${sizes[label]}px) {
      ${css(first, ...interpolations)}
    }
  `;

  return acc;
}, {} as { [key in keyof typeof sizes]: MediaFunction });

export function theme(): DefaultTheme {
  return {
    colors: {
      //base
      white: '#FFFFFF',
      black: '#000000',

      // text
      text: '#FFFFFF',
      text1: '#FFFFFF',

      // backgrounds
      bg1: '#01002A',
      bg2: '#0c2a4d',
      bg3: '#144a68',
      bg4: '#0b284c',

      //
      primary: '#2ca9b7',
    },

    fontSizes: [12, 14, 16, 20, 25, 35],

    space: [0, 4, 8, 16, 32, 64, 128, 256],

    // media queries
    mediaWidth: media,
  };
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeObject = theme();

  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>;
}

export const FixedGlobalStyle = createGlobalStyle`
  html,
  body {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  #root {
    min-height: 100%;
    min-width: 100%;
  }

  p,
  label {
    font-family: Georgia, Times, 'Times New Roman', serif;
    line-height: 1.5em;
  }

  input, select {
    font-family: inherit;
    font-size: inherit;
  }
`;

export const ThemedGlobalStyle = createGlobalStyle`
html {
  color: ${({ theme }) => theme.colors.text1};
  background-color: ${({ theme }) => theme.colors.bg2};
}

body {
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg1}
}
`;
