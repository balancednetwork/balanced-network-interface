import React, { useCallback, useMemo } from 'react';

import { useMedia } from 'react-use';

import { StyledHeaderText } from '@/app/pages/trade/bridge/_components/XChainList';
import { Typography } from '@/app/theme';
import useSortXCollateralTypes from '@/hooks/useSortXCollateralTypes';
import { useHasSignedIn } from '@/hooks/useWallets';
import { useAllCollateralData, useCollateralActionHandlers, useUserPositionsData } from '@/store/collateral/hooks';
import { useLoanActionHandlers } from '@/store/loan/hooks';
import { useOraclePrices } from '@/store/oracle/hooks';
import { getSpokeVersions } from '@/utils/xTokens';
import { ICON_XCALL_NETWORK_ID } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box } from 'rebass';
import styled from 'styled-components';
import Spinner from '../Spinner';
import { BalanceAndValueWrap, DashGrid, List, walletBreakpoint } from '../Wallet/styledComponents';
import { CollateralTab } from './CollateralTypeListWrap';
import MultiChainItem from './MultiChainItem';
import SingleChainItem from './SingleChainItem';
import SingleChainItemOverview from './SingleChainItemOverview';

const StyledDashGrid = styled(DashGrid)`
grid-template-columns: 11fr 12fr;

 ${BalanceAndValueWrap} {
  [role='button']:first-of-type {
    transform: translateX(-7px);
  }

  [role='button'] {
    width: 50%;
    display: flex;
    justify-content: end;
  }
 }
`;

const CollateralTypeList = ({
  setAnchor,
  collateralTab,
  query,
}: {
  setAnchor: (anchor: HTMLElement | null) => void;
  collateralTab: CollateralTab;
  query: string;
}) => {
  const { onAdjust: adjust, changeCollateralType, changeCollateralXChain } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan, setRecipientNetwork: setLoanNetwork } = useLoanActionHandlers();
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const isSignedIn = useHasSignedIn();
  const prices = useOraclePrices();

  const areOraclePricesLoaded = Object.keys(prices).length > 0;

  const { data: userPositionsData } = useUserPositionsData();
  const { data: allPositionsData } = useAllCollateralData();

  const handleCollateralTypeChange = useCallback(
    (symbol: string, xChainId?: XChainId) => {
      setAnchor(null);
      changeCollateralType(symbol);
      adjust(false);
      adjustLoan(false);
      if (xChainId) {
        changeCollateralXChain(xChainId);
        setLoanNetwork(xChainId);
      }
    },
    [changeCollateralType, setAnchor, adjust, adjustLoan, changeCollateralXChain, setLoanNetwork],
  );

  const positions = useMemo(() => {
    return collateralTab === CollateralTab.YOUR ? userPositionsData : allPositionsData;
  }, [collateralTab, userPositionsData, allPositionsData]);

  const filteredPositions = useMemo(() => {
    return positions?.filter(
      xPosition =>
        xPosition.baseToken.symbol.toLowerCase().includes(query.toLowerCase()) ||
        xPosition.baseToken.name?.toLowerCase().includes(query.toLowerCase()) ||
        getSpokeVersions(xPosition.baseToken.symbol).some(v => v.toLowerCase().includes(query.toLowerCase())) ||
        Object.keys(xPosition.positions).some(x => xChainMap[x].name.toLowerCase().includes(query.toLowerCase())),
    );
  }, [positions, query]);

  const { sortBy, handleSortSelect, sortData } = useSortXCollateralTypes(
    isSignedIn ? { key: 'collateral', order: 'DESC' } : { key: 'name', order: 'ASC' },
  );

  const sortedFilteredPositions = useMemo(
    () => sortData(filteredPositions, collateralTab),
    [filteredPositions, sortData, collateralTab],
  );

  return (
    <List mx="-25px">
      <StyledDashGrid>
        <StyledHeaderText
          role="button"
          className={sortBy.key === 'name' ? sortBy.order : ''}
          onClick={() =>
            handleSortSelect({
              key: 'name',
            })
          }
        >
          <span>
            <Trans>Asset</Trans>
          </span>
        </StyledHeaderText>
        <BalanceAndValueWrap>
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'collateral' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'collateral',
              })
            }
          >
            <span>
              <Trans>Collateral</Trans>
            </span>
          </StyledHeaderText>
          {isSmallScreen ? null : (
            <StyledHeaderText
              role="button"
              className={sortBy.key === 'loan' ? sortBy.order : ''}
              onClick={() =>
                handleSortSelect({
                  key: 'loan',
                })
              }
            >
              <span>
                <Trans>Loan</Trans>
              </span>
            </StyledHeaderText>
          )}
        </BalanceAndValueWrap>
      </StyledDashGrid>

      <AnimatePresence>
        {!areOraclePricesLoaded ? (
          <motion.div
            key="collateral-spinner"
            initial={{ opacity: 0, height: 0, y: 0 }}
            animate={{ opacity: 1, height: 40, y: 0 }}
            exit={{ opacity: 0, height: 0, y: 0 }}
          >
            <Box style={{ position: 'absolute', left: '50%', transform: 'translate(-50%, 0)', paddingTop: '50px' }}>
              <Spinner $centered />
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="collateral-content"
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 0 }}
          >
            {collateralTab === CollateralTab.YOUR && (
              <>
                {sortedFilteredPositions?.map((xPosition, index) =>
                  xPosition.isSingleChain ? (
                    <SingleChainItem
                      baseToken={xPosition.baseToken}
                      key={index}
                      networkPosition={xPosition.positions}
                      isLast={index === sortedFilteredPositions.length - 1}
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
                {sortedFilteredPositions?.length === 0 && (
                  <Typography p="30px 0 0" textAlign="center">
                    <Trans>No positions found.</Trans>
                  </Typography>
                )}
              </>
            )}

            {collateralTab === CollateralTab.ALL &&
              sortedFilteredPositions.map((xCollateral, index, { length }) => {
                //temporarily show single chain view only (backend support needed first)
                return (
                  <SingleChainItemOverview
                    baseToken={xCollateral.baseToken}
                    key={index}
                    networkPosition={{ [ICON_XCALL_NETWORK_ID]: xCollateral.total }}
                    hideNetworkIcon={true}
                    isLast={index === length - 1}
                    onSelect={handleCollateralTypeChange}
                  />
                );
                // return xCollateral.isCollateralSingleChain ? (
                //   <SingleChainItemOverview
                //     baseToken={xCollateral.baseToken}
                //     key={index}
                //     networkPosition={{ [ICON_XCALL_NETWORK_ID]: xCollateral.total }}
                //     isLast={index === length - 1}
                //     onSelect={handleCollateralTypeChange}
                //   />
                // ) : (
                //   <MultiChainItemOverview
                //     key={index}
                //     baseToken={xCollateral.baseToken}
                //     chains={xCollateral.chains}
                //     onSelect={handleCollateralTypeChange}
                //     total={xCollateral.total}
                //   />
                // );
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </List>
  );
};

export default CollateralTypeList;
