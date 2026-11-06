import React from 'react';

import { useIconReact } from '@/packages/icon-react';
import styled from 'styled-components';

import CollateralPanel from '@/app/components/home/CollateralPanel';
import LoanPanel from '@/app/components/home/LoanPanel';
import PositionDetailPanel from '@/app/components/home/PositionDetailPanel';
import RewardsPanel from '@/app/components/home/RewardsPanel';
import { useFetchBBalnInfo, useFetchBBalnSources } from '@/store/bbaln/hooks';
import {
  useCollateralActionHandlers,
  useCollateralFetchInfo,
  useCollateralType,
  useCollateralXChain,
  useSupportedCollateralTokens,
} from '@/store/collateral/hooks';
import { useLegacyAccountPositions } from '@/queries/useLegacyAccountPositions';
import { isCollateralKnown } from '@/queries/legacyPositions';
import { Typography } from '@/app/theme';
import { useFetchUserVoteData } from '@/store/liveVoting/hooks';
import { useLoanActionHandlers, useLoanFetchInfo } from '@/store/loan/hooks';
import { Button } from '@/app/components/Button';
import { xChainMap } from '@balancednetwork/xwagmi';
import { fixWrongSymbol, useWrongSymbol } from '@/utils/formatter';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchRewardsInfo } from '@/store/reward/hooks';
import { useFetchSavingsInfo } from '@/store/savings/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 35px;
  margin-bottom: 35px;

  ${({ theme }) => theme.mediaWidth.upMedium`
    grid-gap: 50px;
    margin-bottom: 50px;
    grid-template-columns: 1fr 1fr;
  `};
`;

export function HomePage() {
  const { account } = useIconReact();
  const { data: collateralTokens, isError: tokensUnavailable } = useSupportedCollateralTokens();
  const positions = useLegacyAccountPositions(collateralTokens);
  const selectedChain = useCollateralXChain();
  const selectedSymbol = useWrongSymbol(useCollateralType());
  const selectedPosition = positions.data.find(position => position.xChainId === selectedChain);
  const selectedUnavailable =
    tokensUnavailable ||
    positions.unavailableChains.includes(selectedChain) ||
    !isCollateralKnown(selectedPosition, selectedSymbol);
  const selectedPending = !tokensUnavailable && positions.pendingChains.includes(selectedChain);
  const { changeCollateralType, changeCollateralXChain, onAdjust: adjustCollateral } = useCollateralActionHandlers();
  const { setRecipientNetwork, onAdjust: adjustLoan } = useLoanActionHandlers();

  useFetchPrice();
  useFetchBBalnSources();
  useFetchBBalnInfo(account);
  useFetchSavingsInfo(account);
  useWalletFetchBalances();
  useCollateralFetchInfo(positions.data);
  useLoanFetchInfo(positions.data);
  useFetchRewardsInfo();
  useFetchUserVoteData();

  return (
    <>
      {(tokensUnavailable || selectedUnavailable || positions.unavailableChains.length > 0) && (
        <Typography role="alert" mb={4}>
          Some collateral and loan balances could not be loaded. Please retry shortly. Collateral without an outstanding
          loan may remain unavailable until the price service is restored.
        </Typography>
      )}
      {selectedPending && (
        <Typography role="status" mb={4}>
          Loading collateral and loan balances…
        </Typography>
      )}
      {positions.isFallback && (
        <Typography role="status" mb={4}>
          Showing positions with outstanding loans. Additional collateral without a loan may be unavailable.
        </Typography>
      )}
      {selectedUnavailable &&
        positions.data.flatMap(position =>
          Object.entries(position.amounts)
            .filter(([, amount]) => amount.collateral !== '0' || amount.loan !== '0')
            .map(([symbol]) => (
              <Button
                key={`${position.owner}/${symbol}`}
                mb={4}
                mr={2}
                onClick={() => {
                  adjustCollateral(false);
                  adjustLoan(false);
                  changeCollateralType(fixWrongSymbol(symbol));
                  changeCollateralXChain(position.xChainId);
                  setRecipientNetwork(position.xChainId);
                }}
              >
                View {fixWrongSymbol(symbol)} on {xChainMap[position.xChainId].name}
              </Button>
            )),
        )}
      <Grid>
        {!selectedUnavailable && !selectedPending && (
          <>
            <CollateralPanel />
            <LoanPanel />
            <PositionDetailPanel />
          </>
        )}
        <RewardsPanel />
      </Grid>
    </>
  );
}
