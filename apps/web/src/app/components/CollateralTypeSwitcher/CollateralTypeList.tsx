import React, { useEffect, useCallback, RefObject, useState, useRef } from 'react';

import { useMedia } from 'react-use';
import { Box } from 'rebass';
import styled from 'styled-components';

import useKeyPress from 'hooks/useKeyPress';
import {
  useCollateralChangeCollateralType,
  useAllCollateralData,
  useCollateralActionHandlers,
  useXCollateralDataByToken,
} from 'store/collateral/hooks';
import { useLoanActionHandlers } from 'store/loan/hooks';
import Skeleton from '../Skeleton';
import SearchInput from '../SearchModal/SearchInput';
import { Trans, t } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { BalanceAndValueWrap, DashGrid, HeaderText, List, walletBreakpoint } from '../Wallet/styledComponents';
import SingleChainItem from './SingleChainItem';
import MultiChainBalanceItem from '../Wallet/MultiChainBalanceItem';
import { Typography } from 'app/theme';
import MultiChainItem from './MultiChainItem';
import { CollateralTab } from './CollateralTypeListWrap';
import CurrencyLogo from '../CurrencyLogo';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

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
  const hideCollateralInfoColumn = useMedia('(max-width: 500px)');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { onAdjust: adjust } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan } = useLoanActionHandlers();
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const allCollateralData = useAllCollateralData();

  const allPositionsData = useXCollateralDataByToken(true);
  const allCollateralOptions = useXCollateralDataByToken();

  const handleCollateralTypeChange = useCallback(
    symbol => {
      setAnchor(null);
      changeCollateralType(symbol);
      adjust(false);
      adjustLoan(false);
    },
    [changeCollateralType, setAnchor, adjust, adjustLoan],
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
        <>
          {allCollateralData
            //BTCB tmp filter fix
            ?.filter(collateralType => collateralType.symbol !== 'BTCB' || collateralType.collateralDeposit.gt(0))
            ?.sort((a, b) => b.collateralDeposit.toNumber() - a.collateralDeposit.toNumber())
            .map((collateralType, i, { length }) => {
              const isLast = length - 1 === i;
              const isFirst = 0 === i;

              return (
                <CollateralTypesGrid
                  key={i}
                  $border={!isLast}
                  $negativeMargin={isFirst}
                  $hideCollateralInfoColumn={hideCollateralInfoColumn}
                  onClick={() => handleCollateralTypeChange(collateralType.symbol)}
                >
                  <CollateralTypesGridItem>
                    <AssetInfo>
                      <CurrencyLogo
                        size={'24px'}
                        currency={SUPPORTED_TOKENS_LIST.find(token => token.symbol === collateralType.symbol)}
                      />
                      <Box>
                        <Typography className="white" fontWeight={700}>
                          {collateralType.displayName ? collateralType.displayName : collateralType.symbol}
                        </Typography>
                      </Box>
                    </AssetInfo>
                  </CollateralTypesGridItem>

                  <CollateralTypesGridItem></CollateralTypesGridItem>
                </CollateralTypesGrid>
              );
            })}
        </>
      )}
    </>
  );
};

export default CollateralTypeList;
