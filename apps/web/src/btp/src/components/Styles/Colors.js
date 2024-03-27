const globalColors = {
  white: '#ffffff',
  black: '#000000',
  solitude: '#f0f2f5',
  primaryBlue: '#1890ff',
  primaryBrand: '#5465FF',
  brandSecondaryBG: '#F4F4F6',
  brandSecondaryBase: '#28262F',
  // Tertiary
  tertiaryBase: '#7FDEFF',
  tertiaryDark: '#00a1d7',
  // Gray
  grayBG: '#1D1B22',
  grayText: '#EFF1ED',
  darkBG: '#131217',
  primaryBrandLight: '#99A3FF',
  primaryBrandBase: '#5465FF',
  primaryBrandBG: '#EBEDFF',

  graySubText: '#878490',
  grayLine: '#353242',
  grayDark: '#131314',
  grayAccent: '#312F39',
  grayScaleLoading: '#3E3C46',
  grayScaleSubText: '#85838E',
  grayScaleDisabled: '#D0CED8',

  // states
  successState: '#5EF38C',
  warningState: '#FFBA49',
  errorState: '#F05365',
};

export const colors = (() => {
  const lightTheme = {
    // Text
    textColor: 'rgba(0,0,0,.85)',
    textColorWhite: 'rba(255,255,255,.85)',
    //background
    backgroundColor: globalColors.white,
    contentBgColor: globalColors.solitude,
    settingThemeBackgroundColor: globalColors.primaryBlue,
    ...globalColors,
  };

  return lightTheme;
})();
