export type Color = string;
export interface Colors {
  // base
  white: Color;
  black: Color;

  // text
  text: Color;
  text1: Color;
  text2: Color;
  // text3: Color;
  // text4: Color;
  // text5: Color;

  // backgrounds / greys
  bg1: Color;
  bg2: Color;
  bg3: Color;
  bg4: Color;
  bg5: Color;

  modalBG: Color;
  advancedBG: Color;

  //blues
  primary: Color;
  primaryBright: Color;
  // primary1: Color;
  // primary2: Color;
  // primary3: Color;
  // primary4: Color;
  // primary5: Color;

  // primaryText1: Color;

  // // pinks
  // secondary1: Color;
  // secondary2: Color;
  // secondary3: Color;

  // // other
  // red1: Color;
  // red2: Color;
  // green1: Color;
  // yellow1: Color;
  // yellow2: Color;
  // blue1: Color;
  divider: Color;

  alert: Color;

  paginationButtonBG: Color;
}

export interface Grids {
  sm: number;
  md: number;
  lg: number;
}

declare module 'styled-components' {
  /*
   * @types/styled-component is not working properly as explained in the github issue referenced above.
   * We must overcome this with custom typings, however, this might not work in time as the styled-components update.
   * Be carefull and keep an eye on the issue and the possible improvements
   */
  export type MediaFunction = <P extends object>(
    first: TemplateStringsArray | CSSObject | InterpolationFunction<ThemedStyledProps<P, DefaultTheme>>,
    ...interpolations: Array<Interpolation<ThemedStyledProps<P, DefaultTheme>>>
  ) => FlattenInterpolation<ThemedStyledProps<P, DefaultTheme>>;

  /* Example
  const SomeDiv = styled.div`
    display: flex;
    ....
    ${media.medium`
      display: block
    `}
  `;
  */

  export interface DefaultTheme {
    colors: Colors;

    grids?: Grids;

    fontSizes: number[];

    space: number[];

    // shadows
    shadow1: string;

    // media queries
    mediaWidth: {
      upExtraSmall: MediaFunction;
      upSmall: MediaFunction;
      upMedium: MediaFunction;
      upLarge: MediaFunction;
      up360: MediaFunction;
      up420: MediaFunction;
      up500: MediaFunction;
    };

    // breakpoints
    breakpoints: string[];

    // z-index
    zIndices: {
      appBar: number;
      drawer: number;
      modal: number;
      snackbar: number;
      tooltip: number;
    };
  }
}
