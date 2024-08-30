import React, { useCallback, useMemo } from 'react';

import { useMedia } from 'react-use';

import { Typography } from '@/app/theme';
import { useAllCollateralData, useCollateralActionHandlers, useUserPositionsData } from '@/store/collateral/hooks';
import { useLoanActionHandlers } from '@/store/loan/hooks';
import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId } from '@/xwagmi/types';
import { Trans } from '@lingui/macro';
import { BalanceAndValueWrap, DashGrid, HeaderText, List, walletBreakpoint } from '../Wallet/styledComponents';
import { CollateralTab } from './CollateralTypeListWrap';
import MultiChainItem from './MultiChainItem';
import SingleChainItem from './SingleChainItem';
import SingleChainItemOverview from './SingleChainItemOverview';

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
        Object.keys(xPosition.positions).some(x => xChainMap[x].name.toLowerCase().includes(query.toLowerCase())),
    );
  }, [positions, query]);

  return (
    <List mx="-25px">
      <DashGrid>
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
        <>
          {filteredPositions?.map((xPosition, index) =>
            xPosition.isSingleChain ? (
              <SingleChainItem
                baseToken={xPosition.baseToken}
                key={index}
                networkPosition={xPosition.positions}
                isLast={index === filteredPositions.length - 1}
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
          {filteredPositions?.length === 0 && (
            <Typography p="30px 0 0" textAlign="center">
              <Trans>No positions found.</Trans>
            </Typography>
          )}
        </>
      )}

      {collateralTab === CollateralTab.ALL &&
        filteredPositions
          ?.sort((a, b) => a.baseToken.symbol.localeCompare(b.baseToken.symbol))
          .map((xCollateral, index, { length }) => {
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
    </List>
  );
};

export default CollateralTypeList;
