import { createGlobalStyle } from 'styled-components/macro';

import { colors } from './Colors';

export default createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    outline: 0; 
    border: 0;
    box-sizing: border-box;
    font-family: 'Poppins', 'Roboto', sans-serif;
  }

  *:focus {
    outline: 0;
  }

  html {
    font-size: 62.5%; //10px;
    height: 100%;
  }

  body {
    height: 100%;
  }

  a {
    text-decoration: none;
  }

  ul {
    list-style: none;
  }

  button {
    cursor: pointer;
  }

  p.err-msg {
    color: ${colors.errorState} !important;
    margin-top: 7px;
  }
`;
