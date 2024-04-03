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
  upExtraSmall: 600,
  upSmall: 800,
  upMedium: 1000,
  upLarge: 1200,
  up360: 360,
  up420: 420,
  up500: 500,
};

export const media = (Object.keys(sizes) as Array<keyof typeof sizes>).reduce((acc, label) => {
  acc[label] = (first: any, ...interpolations: any[]) =>
    css`
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

      // text white
      text: '#FFFFFF',

      // balanced dark grey
      text1: '#D5D7DB',

      // light grey for vote content
      text2: '#A9BAC7',

      // backgrounds
      // Balanced navy blue
      bg1: '#01002A',

      // Balanced panel
      bg2: '#0c2a4d',

      // Balanced parent paenl
      bg3: '#144a68',

      bg4: '#0b284c',

      bg5: '#021338',

      // Balanced turqoise
      primary: '#2ca9b7',

      primaryBright: '#2fccdc',

      //specialty colors
      modalBG: 'rgba(1, 0, 42, 0.75)',
      advancedBG: 'rgba(255,255,255,0.6)',

      // divider
      divider: 'rgba(255, 255, 255, 0.15)',

      // alert
      alert: '#fb6a6a',

      paginationButtonBG: '#087083',
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
      modal: 5600,
      snackbar: 1400,
      tooltip: 1500,
    },
  };
}

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'label' | 'body' | 'content' | 'span';

export const Typography = React.forwardRef((props: TextProps & { variant?: TypographyVariant }, ref) => {
  const { variant, ...rest } = props;

  switch (variant) {
    case 'h1':
      return <Text ref={ref} as="h1" color="text" fontSize={35} fontWeight="bold" {...rest} />;
    case 'h2':
      return <Text ref={ref} as="h2" color="text" fontSize={25} fontWeight="bold" {...rest} />;
    case 'h3':
      return <Text ref={ref} as="h3" color="text" fontSize={20} fontWeight="bold" {...rest} />;
    case 'h4':
      return <Text ref={ref} as="h4" color="text" fontSize={18} fontWeight="bold" {...rest} />;
    case 'p':
      return <Text ref={ref} as="p" color="text" fontSize={16} {...rest} />;
    case 'label':
      return <Text ref={ref} as="label" fontSize={14} {...rest} />;
    case 'body':
      return <Text ref={ref} as="p" fontSize={14} {...rest} />;
    case 'content':
      return <Text ref={ref} as="p" fontSize="0.875em" {...rest} />;
    case 'span':
      return <Text ref={ref} as="span" fontSize={14} {...rest} />;
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
    width: 100%;
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

  /* Ledger Wallet style */
  .wallet tbody tr {
    border-bottom: 0px;
    border-radius: 10px;
  }

  .wallet tbody tr:hover, .wallet tbody tr.active {
    background-color: #2ca9b7;
  }

  .wallet tbody tr:hover td {
    cursor: pointer;
  }

  .wallet td {
    color: white;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 15px;
    padding-right: 15px;
  }

  .wallet td:first-of-type {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }

  .wallet td:last-of-type {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  ul.pagination {
    display: block;
    padding: 0;
    text-align: center;
    margin: 0;
    margin-top: 15px;
  }

  ul.pagination li {
    display: inline-block;
    padding: 5px;
    border: 2px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    width: 35px;
    text-align: center;
    transition: border 0.2s ease;
  }

  ul.pagination li:hover {
    border: 2px solid #2ca9b7;
    cursor: pointer;
    transition: border 0.3s ease;
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
    border-radius: 5px;
  }
  .noUi-connects {
    border-radius: 5px;
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

  /*  */
  #indicator-locked-container,
  #indicator-used-container {
    position: relative;
  }
  #indicator-locked,
  #indicator-used {
    position: absolute;
    width: 1px;
    height: 20px;
    margin-top: 25px;
    background-color: #ffffff;
    z-index: 2;
    opacity: 1;
    transition: height 0.2s ease, opacity 0.2s ease;
  }
  #indicator-used {
    margin-top: -5px;
  }
  #indicator-locked.disabled,
  #indicator-used.disabled {
    height: 10px;
    transition: height 0.2s ease;
  }
  #indicator-locked .label,
  #indicator-used .label {
    font-size: 14px;
    margin-top: -20px;
    margin-left: -23px;
    width: 100px;
  }
  #indicator-used .label {
    margin-left: -17px;
  }
  #indicator-locked.active,
  #indicator-used.active {
    opacity: 1;
    transition: opacity 0.3s ease;
  }

/* Slider Warning */
  .withdraw-warning .noUi-connect {
    background: #fb6a6a;
  }

  .withdraw-warning .noUi-horizontal .noUi-handle {
    border: 3px solid #fb6a6a;
  }

  .slider-warning-true .noUi-connects {
    background-color: #fb6a6a;
  }


/* Risk */

  #slider-risk {
    /* height: 17px; */
    border-radius: 0;
  }
  #slider-risk .noUi-connects {
    border-radius: 0;
  }
  #slider-risk[disabled].noUi-horizontal {
    background: #2ca9b7;
    border-radius: 0;
  }
  #slider-risk[disabled].noUi-horizontal .noUi-connect {
    background: #144a68;
  }

  /* scrollbar */
  .scrollbar {
    overflow-y: auto;
  }
  .scrollbar-primary {
    scrollbar-color: #2ca9b7 #144a68;
  }
  .scrollbar-primary::-webkit-scrollbar {
    border-radius: 10px;
    width: 10px;
    background-color: #144a68; 
  }
  .scrollbar-primary::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
    background-color: #2ca9b7; 
  }

  .error-anim {
    @keyframes wiggle {
        0% { transform: translate3d(0, 0, 0); }
      10% { transform:translate3d(-3px, 0, 0); }
      30% { transform: translate3d(3px, 0, 0); }
      50% { transform: translate3d(-2px, 0, 0); }
      70% { transform: translate3d(2px, 0, 0); }
      90% { transform: translate3d(-1px, 0, 0); }
      100% { transform: translate3d(0, 0, 0); }
    }
    display: inline-block;
    animation: wiggle 0.5s forwards;
  }
`;
