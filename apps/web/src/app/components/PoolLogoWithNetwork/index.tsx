import React from 'react';

import { Currency, XChainId } from '@balancednetwork/sdk-core';
import { Box } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { xChainMap } from '@balancednetwork/xwagmi';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogo from '../CurrencyLogo';

const IconWrapper = styled(Box)<{ $respoVersion?: boolean; $compactVersion?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgb(12, 42, 77);
  background-color: rgb(20, 74, 104);
  display: flex;
  justify-content: center;
  align-items: center;

  ${({ $respoVersion, theme }) =>
    $respoVersion &&
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

  ${({ $compactVersion }) =>
    $compactVersion &&
    css`
      width: 25px;
      height: 25px;
      background-color: rgb(12, 42, 77);
    `}
`;

const NetworkWrap = styled.div<{ $compactVersion?: boolean }>`
  position: absolute;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  left: 50%;
  bottom: 0;
  margin-left: -7px;

  background: #0c2a4d;
  outline: 5px solid #0f395a;

  img {
    position: absolute;
    top: 0;
    left: 0;
  }

  ${({ $compactVersion }) =>
    $compactVersion &&
    css`
      width: 10px;
      height: 10px;
      outline: 1px solid #0c2a4d;
      bottom: -3px;
      margin-left: -6px;

      img {
        width: 10px;
        height: 10px;
      }
    `}
`;

export const PoolLogoWrapper = styled(Box)<{ $compactVersion?: boolean }>`
  position: relative;
  display: flex;
  min-width: 80px;

  ${({ $compactVersion }) =>
    $compactVersion &&
    css`
      min-width: 40px;
    `}
`;

function PoolLogoWithNetwork({
  baseCurrency,
  quoteCurrency,
  respoVersion,
  chainId,
  compactVersion,
}: {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  respoVersion?: boolean;
  chainId: XChainId;
  compactVersion?: boolean;
}) {
  return (
    <PoolLogoWrapper $compactVersion={compactVersion}>
      <IconWrapper $respoVersion={respoVersion} $compactVersion={compactVersion}>
        <CurrencyLogo currency={baseCurrency} />
      </IconWrapper>
      <IconWrapper ml={-2} $respoVersion={respoVersion} $compactVersion={compactVersion}>
        <CurrencyLogo currency={quoteCurrency} />
      </IconWrapper>
      <NetworkWrap $compactVersion={compactVersion}>
        <ChainLogo chain={xChainMap[chainId]} size="14px" />
      </NetworkWrap>
    </PoolLogoWrapper>
  );
}

export default PoolLogoWithNetwork;
