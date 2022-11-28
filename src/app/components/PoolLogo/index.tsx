import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { Box } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import CurrencyLogo from '../CurrencyLogo';

export const IconWrapper = styled(Box)<{ respoVersion?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgb(12, 42, 77);
  background-color: rgb(20, 74, 104);
  display: flex;
  justify-content: center;
  align-items: center;

  ${({ respoVersion, theme }) =>
    respoVersion &&
    css`
      width: 30px;
      height: 30px;

      img {
        width: 18px;
        height: 18px;
      }

      ${theme.mediaWidth.upMedium`
      width: 48px;
      height: 48px;

      img {
        width: 24px;
        height: 24px;
      }
    `}
    `};
`;

export const PoolLogoWrapper = styled(Box)`
  display: flex;
  min-width: 80px;
`;

function PoolLogo({
  baseCurrency,
  quoteCurrency,
  respoVersion,
}: {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  respoVersion?: boolean;
}) {
  return (
    <PoolLogoWrapper>
      <IconWrapper respoVersion={respoVersion}>
        <CurrencyLogo currency={baseCurrency} />
      </IconWrapper>
      <IconWrapper ml={-2} respoVersion={respoVersion}>
        <CurrencyLogo currency={quoteCurrency} />
      </IconWrapper>
    </PoolLogoWrapper>
  );
}

export default PoolLogo;
