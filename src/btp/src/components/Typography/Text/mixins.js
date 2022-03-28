import { css } from 'styled-components/macro';

import * as commonMixins from '../commonMixnins';

export const normal = css`
  letter-spacing: 0.75px;
  ${commonMixins.normal}
`;

export const xs = css`
  font-size: 12px;
  line-height: 16px;
`;

export const sm = css`
  ${normal};
  font-size: 14px;
  line-height: 20px;
`;

export const md = css`
  ${normal};
  font-size: 16px;
  line-height: 24px;
`;

export const lg = css`
  font-size: 50px;
  line-height: 68px;
`;

export const bold = css`
  ${commonMixins.bold}
`;

export const smBold = css`
  ${normal}
  ${sm};
  ${commonMixins.bold}
`;

export const xsBold = css`
  ${normal};
  ${xs};
  ${commonMixins.bold}
`;
