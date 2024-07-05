import React from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import styled from 'styled-components';

import RewardTokenItem from './RewardTokenItem';

const RewardTokenGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  column-gap: 5px;
`;

const RewardsGrid = ({ rewards }: { rewards?: CurrencyAmount<Token>[] }) => {
  return (
    <RewardTokenGrid>
      {rewards?.map((reward, index) => (
        <RewardTokenItem key={index} reward={reward} />
      ))}
    </RewardTokenGrid>
  );
};

export default RewardsGrid;
