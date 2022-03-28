import { css } from 'styled-components/macro';

import * as commonMixins from '../commonMixnins';

export const normal = css`
  letter-spacing: 1px;
  ${commonMixins.normal}
`;

export const sm = css`
  font-size: 14px;
  line-height: 20px;
`;

export const md = css`
  font-size: 16px;
  line-height: 24px;
`;

export const lg = css`
  font-size: 18px;
  line-height: 24px;
`;

export const bold = css`
  ${commonMixins.bold}
`;

export const smBold = css`
  ${normal};
  ${sm};
  ${commonMixins.bold}
`;

export const mdBold = css`
  ${normal};
  ${md};
  ${commonMixins.bold}
`;
