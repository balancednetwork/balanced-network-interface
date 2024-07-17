import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import CurrencyLogo from '../CurrencyLogo';
import React from 'react';
import styled from 'styled-components';

const Wrap = styled.span`
  display: inline-block;
  position: relative;
  margin-right: 5px;
  transform: translateY(-2px);
`;

const CollateralIcon = ({ icon }: { icon: string }) => {
  return (
    <Wrap>
      <CurrencyLogo currency={SUPPORTED_TOKENS_LIST.find(token => token.symbol === icon)} size={'18px'} />
    </Wrap>
  );
};

export default CollateralIcon;
