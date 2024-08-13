import React from 'react';

import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { CurrencyLogoFromURI } from '../CurrencyLogo';

export const IconWrapper = styled(Box)`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgb(12, 42, 77);
  background-color: rgb(20, 74, 104);
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const PoolLogoWrapper = styled(Box)`
  display: flex;
  min-width: 80px;
`;

function PoolLogo({ baseCurrency, quoteCurrency }: { baseCurrency: string; quoteCurrency: string }) {
  return (
    <PoolLogoWrapper>
      <IconWrapper>
        <CurrencyLogoFromURI address={baseCurrency} /*width={25} height={25}*/ />
      </IconWrapper>
      <IconWrapper ml={-2}>
        <CurrencyLogoFromURI address={quoteCurrency} /*width={25} height={25}*/ />
      </IconWrapper>
    </PoolLogoWrapper>
  );
}

export default PoolLogo;
