import { css } from 'styled-components/macro';

import * as commonMixins from '../commonMixnins';

export const normal = css`
  letter-spacing: 1px;
  ${commonMixins.normal}
`;

export const xs = css`
  font-size: 21px;
  line-height: 28px;
`;

export const sm = css`
  font-size: 25px;
  line-height: 36px;
`;

export const md = css`
  font-size: 36px;
  line-height: 48px;
`;

export const lg = css`
  font-size: 50px;
  line-height: 68px;
`;

export const bold = css`
  ${commonMixins.bold}
`;

export const mdBold = css`
  ${normal};
  ${md};
  ${commonMixins.bold}
`;

export const smBold = css`
  ${normal};
  ${sm};
  ${commonMixins.bold}
`;
