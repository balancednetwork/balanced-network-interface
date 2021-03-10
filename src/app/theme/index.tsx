import React from 'react';

import { TextProps } from 'rebass';
import { Text } from 'rebass/styled-components';
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, MediaFunction } from 'styled-components';
import { css, DefaultTheme } from 'styled-components/macro';

import texGyeAdventorBoldWoff from 'assets/font/tex-gyre-adventor-bold/tex-gyre-adventor-bold.woff';
import texGyeAdventorBoldWoff2 from 'assets/font/tex-gyre-adventor-bold/tex-gyre-adventor-bold.woff2';
import texGyeAdventorRegularWoff from 'assets/font/tex-gyre-adventor-regular/tex-gyre-adventor-regular.woff';
import texGyeAdventorRegularWoff2 from 'assets/font/tex-gyre-adventor-regular/tex-gyre-adventor-regular.woff2';

// Update your breakpoints if you want
export const sizes = {
  upToExtraSmall: 600,
  upToSmall: 800,
  upToMedium: 1000,
  upToLarge: 1280,
};

// Iterate through the sizes and create a media template
export const media = (Object.keys(sizes) as Array<keyof typeof sizes>).reduce((acc, label) => {
  acc[label] = (first: any, ...interpolations: any[]) => css`
    @media (max-width: ${sizes[label]}px) {
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

      // Balanced turqoise
      primary: '#2ca9b7',

      //specialty colors
      modalBG: 'rgba(1, 0, 42, 0.75)',
      advancedBG: 'rgba(255,255,255,0.6)',

      // divider
      divider: 'rgba(255, 255, 255, 0.15)',
    },

    fontSizes: [12, 14, 16, 20, 25, 35],

    space: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],

    // media queries
    mediaWidth: media,

    // shadows
    shadow1: '#2F80ED',

    // breakpoints
    breakpoints: Object.values(sizes).map(size => `${size}px`),
  };
}

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'label' | 'body';

export const Typography = (props: TextProps & { variant?: TypographyVariant }) => {
  const { variant, ...rest } = props;

  switch (variant) {
    case 'h1':
      return <Text as="h1" color="text" fontSize={35} fontWeight="bold" {...rest} />;
    case 'h2':
      return <Text as="h2" color="text" fontSize={25} fontWeight="bold" {...rest} />;
    case 'h3':
      return <Text as="h3" color="text" fontSize={20} fontWeight="bold" {...rest} />;
    case 'p':
      return <Text as="p" color="text" fontSize={16} {...rest} />;
    case 'label':
      return <Text as="label" fontSize={14} {...rest} />;
    case 'body':
      return <Text as="p" fontSize={14} {...rest} />;
    default:
      return <Text as="p" fontSize={14} {...rest} />;
  }
};

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
    width: 100%;
    line-height: 1.4;
  }

  body,button {
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

  .list {
    width: 100%;
    border-collapse: collapse;
  }

  /* Default Table style */
  .list th {
    text-align: left;
    text-transform: uppercase;
    font-size: 14px;
    font-weight: normal;
    letter-spacing: 3px;
    color: #d5d7db;
  }
  .list tbody tr {
    border-bottom: 1px solid #304a68;
  }
  .list tbody tr:last-of-type {
    border-bottom: none;
  }
  .list td {
    padding-top: 20px;
    padding-bottom: 20px;
  }
  .list tbody tr:last-of-type td {
    padding-bottom: 0;
  }

  /* Liquidity Table style */
  .list.liquidity thead th,
  .list.liquidity tbody td {
    text-align: right;
  }
  .list.liquidity thead th:first-of-type,
  .list.liquidity tbody td:first-of-type {
    text-align: left;
  }
  .list.liquidity tbody td:first-of-type {
    font-weight: bold;
  }

  /* Asset list */
  .list.assets tbody tr {
    border-bottom: 1px solid #304a68;
    transition: color 0.3s ease, border-bottom 0.3s ease;
  }
  .list.assets tbody tr:last-of-type {
    border-bottom: none !important;
  }
  .list.assets tbody tr:hover {
    cursor: pointer;
    color: #2ca9b7;
    transition: color 0.2s ease, border-bottom 0.2s ease;
  }
  .list.assets thead th,
  .list.assets tbody td {
    text-align: right;
  }
  .list.assets tbody tr:last-of-type td {
    padding-bottom: 20px;
  }
  .list.assets thead th:first-of-type,
  .list.assets tbody td:first-of-type {
    text-align: left;
    display: flex;
  }
  .list.assets tbody td:first-of-type {
    font-weight: bold;
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
`;

export const ThemedGlobalStyle = createGlobalStyle`
  html {
    color: ${({ theme }) => theme.colors.text1};
    background-color: ${({ theme }) => theme.colors.bg1};
  }

  body {
    min-height: 100vh;
    background: ${({ theme }) => theme.colors.bg1}
  }

  /* ==========================================================================
    Slider (noUISlider.JS)
  ========================================================================== */

  .noUi-target,
  .noUi-target * {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-user-select: none;
    -ms-touch-action: none;
    touch-action: none;
    -ms-user-select: none;
    -moz-user-select: none;
    user-select: none;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }
  .noUi-target {
    position: relative;
  }
  .noUi-base,
  .noUi-connects {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
  }

  /* Wrapper for all connect elements. */

  .noUi-connects {
    overflow: hidden;
    z-index: 0;
  }
  .noUi-connect,
  .noUi-origin {
    will-change: transform;
    position: absolute;
    z-index: 1;
    top: 0;
    right: 0;
    -ms-transform-origin: 0 0;
    -webkit-transform-origin: 0 0;
    -webkit-transform-style: preserve-3d;
    transform-origin: 0 0;
    transform-style: flat;
  }
  .noUi-connect {
    height: 100%;
    width: 100%;
  }
  .noUi-origin {
    height: 10%;
    width: 10%;
  }

  /* Offset direction */

  .noUi-txt-dir-rtl.noUi-horizontal .noUi-origin {
    left: 0;
    right: auto;
  }

  /* Give origins 0 height/width so they don't interfere with clicking the connect elements. */

  .noUi-vertical .noUi-origin {
    width: 0;
  }
  .noUi-horizontal .noUi-origin {
    height: 0;
  }
  .noUi-handle {
    backface-visibility: hidden;
    position: absolute;
  }
  .noUi-touch-area {
    height: 100%;
    width: 100%;
  }
  .noUi-state-tap .noUi-connect,
  .noUi-state-tap .noUi-origin {
    transition: transform 0.3s;
  }
  .noUi-state-drag * {
    cursor: inherit !important;
  }

  /* Slider size and handle placement */

  .noUi-horizontal {
    height: 5px;
  }
  .noUi-horizontal .noUi-handle {
    width: 20px;
    height: 20px;
    right: -10px;
    top: -8px;
    background-color: #03334f;
    border: 3px solid #2ca9b7;
  }
  .noUi-vertical {
    width: 18px;
  }
  .noUi-vertical .noUi-handle {
    width: 28px;
    height: 34px;
    right: -6px;
    top: -17px;
  }
  .noUi-txt-dir-rtl.noUi-horizontal .noUi-handle {
    left: -17px;
    right: auto;
  }

  /* Styling: Giving the connect element a border radius causes issues with using transform: scale */

  .noUi-target {
    background: #03334f;
    border-radius: 4px;
  }
  .noUi-connects {
    border-radius: 3px;
  }
  .noUi-connect {
    background: #2ca9b7;
  }

  /* Handles and cursors */

  .noUi-draggable {
    cursor: ew-resize;
  }
  .noUi-vertical .noUi-draggable {
    cursor: ns-resize;
  }
  .noUi-handle {
    border: 1px solid #D9D9D9;
    border-radius: 100px;
    background: #FFF;
    cursor: pointer;
  }
  .noUi-active {
    box-shadow: inset 0 0 1px #FFF, inset 0 1px 7px #DDD, 0 3px 6px -3px #BBB;
  }

  /* Handle stripes */

  .noUi-vertical .noUi-handle:before,
  .noUi-vertical .noUi-handle:after {
    width: 14px;
    height: 1px;
    left: 6px;
    top: 14px;
  }
  .noUi-vertical .noUi-handle:after {
    top: 17px;
  }

  /* Disabled state */

  .panel-parent [disabled].noUi-horizontal {
    background: #03334f;
  }
  .panel [disabled].noUi-horizontal{
    background: #144a68;
  }
  [disabled] .noUi-handle {
    opacity: 0;
    cursor: default;
  }
  [disabled].noUi-horizontal {
    height: 15px;
    transition: height 0.3s ease;
  }
  [disabled] .noUi-handle {
    transition: opacity 0.3s ease;
  }

  /* [disabled] .noUi-connect {
    background: #B8B8B8;
  } */
  [disabled].noUi-target,
  [disabled].noUi-handle,
  [disabled] .noUi-handle {
    cursor: default;
  }

  /* Base */

  .noUi-pips,
  .noUi-pips * {
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }
  .noUi-pips {
    position: absolute;
    color: #999;
  }

  /* Values */

  .noUi-value {
    position: absolute;
    white-space: nowrap;
    text-align: center;
  }
  .noUi-value-sub {
    color: #ccc;
    font-size: 10px;
  }

  /* Markings */

  .noUi-marker {
    position: absolute;
    background: #CCC;
  }
  .noUi-marker-sub {
    background: #AAA;
  }
  .noUi-marker-large {
    background: #AAA;
  }

  /* Horizontal layout */

  .noUi-pips-horizontal {
    padding: 10px 0;
    height: 80px;
    top: 100%;
    left: 0;
    width: 100%;
  }
  .noUi-value-horizontal {
    transform: translate(-50%, 50%);
  }
  .noUi-rtl .noUi-value-horizontal {
    transform: translate(50%, 50%);
  }
  .noUi-marker-horizontal.noUi-marker {
    margin-left: -1px;
    width: 2px;
    height: 5px;
  }
  .noUi-marker-horizontal.noUi-marker-sub {
    height: 10px;
  }
  .noUi-marker-horizontal.noUi-marker-large {
    height: 15px;
  }

  /* Vertical layout */

  .noUi-pips-vertical {
    padding: 0 10px;
    height: 100%;
    top: 0;
    left: 100%;
  }
  .noUi-value-vertical {
    transform: translate(0, -50%);
    padding-left: 25px;
  }
  .noUi-rtl .noUi-value-vertical {
    transform: translate(0, 50%);
  }
  .noUi-marker-vertical.noUi-marker {
    width: 5px;
    height: 2px;
    margin-top: -1px;
  }
  .noUi-marker-vertical.noUi-marker-sub {
    width: 10px;
  }
  .noUi-marker-vertical.noUi-marker-large {
    width: 15px;
  }
  .noUi-tooltip {
    display: block;
    position: absolute;
    border: 2px solid #2ca9b7;
    border-radius: 10px;
    background: #0b284c;
    color: #ffffff;
    padding: 15px;
    text-align: center;
    white-space: nowrap;
  }
  .noUi-horizontal .noUi-tooltip {
    -webkit-transform: translate(-50%, 0);
    transform: translate(-50%, 0);
    left: 50%;
    bottom: 120%;
  }
  .noUi-vertical .noUi-tooltip {
    -webkit-transform: translate(0, -50%);
    transform: translate(0, -50%);
    top: 50%;
    right: 120%;
  }
  .noUi-horizontal .noUi-origin > .noUi-tooltip {
    -webkit-transform: translate(50%, 0);
    transform: translate(50%, 0);
    left: auto;
    bottom: 10px;
  }
  .noUi-vertical .noUi-origin > .noUi-tooltip {
    -webkit-transform: translate(0, -18px);
    transform: translate(0, -18px);
    top: auto;
    right: 28px;
  }
  .noUi-tooltip {
    display: none;
  }
  .noUi-active .noUi-tooltip {
    display: block;
  }

`;
