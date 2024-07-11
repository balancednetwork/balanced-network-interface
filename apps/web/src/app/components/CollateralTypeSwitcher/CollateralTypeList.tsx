import React, { useEffect, useCallback, RefObject, useState, useRef } from 'react';

import { useMedia } from 'react-use';
import { Box } from 'rebass';
import styled from 'styled-components';

import {
  useCollateralChangeCollateralType,
  useCollateralActionHandlers,
  useXCollateralDataByToken,
  useAllCollateralSelectorData,
  useChangeCollateralXChain,
} from 'store/collateral/hooks';
import { useLoanActionHandlers, useSetLoanRecipientNetwork } from 'store/loan/hooks';
import Skeleton from '../Skeleton';
import { Trans } from '@lingui/macro';
import { BalanceAndValueWrap, DashGrid, HeaderText, List, walletBreakpoint } from '../Wallet/styledComponents';
import SingleChainItem from './SingleChainItem';
import { Typography } from 'app/theme';
import MultiChainItem from './MultiChainItem';
import { CollateralTab } from './CollateralTypeListWrap';
import CurrencyLogo from '../CurrencyLogo';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import { changeCollateralXChain } from 'store/collateral/reducer';

const CollateralTypesGrid = styled.div<{
  $border?: boolean;
  $negativeMargin?: boolean;
  $hideCollateralInfoColumn?: boolean;
}>`
  display: grid;
  grid-template-columns: ${({ $hideCollateralInfoColumn }) => ($hideCollateralInfoColumn ? '1fr 1fr' : '5fr 5fr 4fr')};
  width: 100%;
  ${({ $border }) => ($border ? 'border-bottom: 1px solid #304a68;' : '')}
  ${({ $negativeMargin }) => ($negativeMargin ? 'margin-top: -10px;' : '')}
  transition: transform ease .3s;

  .white,
  .grey {
    transition: all ease-out 0.2s;
  }

  .white {
    color: #ffffff;
  }

  .grey {
    color: #d5d7db;
  }

  &:hover {
    .white,
    .grey {
      color: ${({ theme }) => theme.colors.primaryBright};
    }
  }
`;

const StyledSkeleton = styled(Skeleton)`
  margin-left: auto;
`;

const CollateralTypesGridHeader = styled.div`
  text-transform: uppercase;
  text-align: right;
  font-size: 14px;
  letter-spacing: 3px;
  padding-bottom: 10px;
  color: ${({ theme }) => theme.colors.text1};

  &:first-of-type {
    text-align: left;
  }
`;

const CollateralTypesGridItem = styled.div`
  text-align: right;
  font-size: 14px;
  padding: 20px 0 20px 10px;
  cursor: pointer;

  &:first-of-type {
    text-align: left;
    padding: 20px 0;
  }
`;

const AssetInfo = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  padding-left: 40px;

  img {
    position: absolute;
    left: 0;
  }

  @media screen and (max-width: 350px) {
    padding-left: 0;
    img {
      display: none;
    }
  }
`;

const GridWrap = styled.div`
  max-height: 305px;
  overflow-y: auto;
  padding: 0 25px;
`;

const CollateralTypeList = ({
  setAnchor,
  collateralTab,
}: {
  setAnchor: (anchor: HTMLElement | null) => void;
  collateralTab: CollateralTab;
}) => {
  const changeCollateralType = useCollateralChangeCollateralType();
  const setLoanNetwork = useSetLoanRecipientNetwork();
  const changeCollateralXChain = useChangeCollateralXChain();
  const hideCollateralInfoColumn = useMedia('(max-width: 500px)');
  const { onAdjust: adjust } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan } = useLoanActionHandlers();
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);

  const allPositionsData = useXCollateralDataByToken(true);
  const { data: allCollateralData } = useAllCollateralSelectorData();

  const handleCollateralTypeChange = useCallback(
    (symbol, chainId) => {
      setAnchor(null);
      changeCollateralType(symbol);
      adjust(false);
      adjustLoan(false);
      if (chainId) {
        changeCollateralXChain(chainId);
        setLoanNetwork(chainId);
      }
    },
    [changeCollateralType, setAnchor, adjust, adjustLoan, changeCollateralXChain, setLoanNetwork],
  );

  return (
    <>
      <DashGrid marginTop={'15px'}>
        <HeaderText>
          <Trans>Asset</Trans>
        </HeaderText>
        <BalanceAndValueWrap>
          <HeaderText>
            <Trans>Collateral</Trans>
          </HeaderText>
          {isSmallScreen ? null : (
            <HeaderText>
              <Trans>Loan</Trans>
            </HeaderText>
          )}
        </BalanceAndValueWrap>
      </DashGrid>

      {collateralTab === CollateralTab.YOUR && (
        <List>
          {allPositionsData.map((xPosition, index) =>
            xPosition.isPositionSingleChain ? (
              <SingleChainItem
                baseToken={xPosition.baseToken}
                key={index}
                networkPosition={xPosition.positions}
                isLast={index === allPositionsData.length - 1}
                onSelect={handleCollateralTypeChange}
              />
            ) : (
              <MultiChainItem
                key={index}
                baseToken={xPosition.baseToken}
                positions={xPosition.positions}
                onSelect={handleCollateralTypeChange}
              />
            ),
          )}
        </List>
      )}

      {collateralTab === CollateralTab.ALL && (
        <List>
          {allCollateralData
            //BTCB tmp filter fix
            ?.filter(xCollateral => xCollateral.baseToken.symbol !== 'BTCB')
            ?.sort((a, b) => a.baseToken.symbol.localeCompare(b.baseToken.symbol))
            .map((xCollateral, index, { length }) => {
              return xCollateral.isPositionSingleChain ? (
                <SingleChainItem
                  baseToken={xCollateral.baseToken}
                  key={index}
                  networkPosition={xCollateral.positions}
                  isLast={index === length - 1}
                  onSelect={handleCollateralTypeChange}
                />
              ) : (
                <MultiChainItem
                  key={index}
                  baseToken={xCollateral.baseToken}
                  positions={xCollateral.positions}
                  onSelect={handleCollateralTypeChange}
                />
              );
            })}
        </List>
      )}
    </>
  );
};

export default CollateralTypeList;
