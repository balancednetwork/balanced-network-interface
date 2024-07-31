import React, { useCallback, useMemo } from 'react';

import { useMedia } from 'react-use';

import {
  useCollateralChangeCollateralType,
  useCollateralActionHandlers,
  useXCollateralDataByToken,
  useAllCollateralData,
  useChangeCollateralXChain,
} from 'store/collateral/hooks';
import { useLoanActionHandlers, useSetLoanRecipientNetwork } from 'store/loan/hooks';
import { Trans } from '@lingui/macro';
import { BalanceAndValueWrap, DashGrid, HeaderText, List, walletBreakpoint } from '../Wallet/styledComponents';
import SingleChainItem from './SingleChainItem';
import MultiChainItem from './MultiChainItem';
import { CollateralTab } from './CollateralTypeListWrap';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import SingleChainItemOverview from './SingleChainItemOverview';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { Typography } from 'app/theme';
import { XChainId } from 'app/pages/trade/bridge/types';

const CollateralTypeList = ({
  setAnchor,
  collateralTab,
  query,
}: {
  setAnchor: (anchor: HTMLElement | null) => void;
  collateralTab: CollateralTab;
  query: string;
}) => {
  const changeCollateralType = useCollateralChangeCollateralType();
  const setLoanNetwork = useSetLoanRecipientNetwork();
  const changeCollateralXChain = useChangeCollateralXChain();
  const { onAdjust: adjust } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan } = useLoanActionHandlers();
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);

  const { data: allPositionsData } = useXCollateralDataByToken();
  const { data: allCollateralData } = useAllCollateralData();

  const handleCollateralTypeChange = useCallback(
    (symbol: string, xChainId: XChainId) => {
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

  const filteredPositions = useMemo(() => {
    return (
      allPositionsData?.filter(
        xPosition =>
          xPosition.baseToken.symbol.toLowerCase().includes(query.toLowerCase()) ||
          xPosition.baseToken.name?.toLowerCase().includes(query.toLowerCase()) ||
          Object.keys(xPosition.positions).some(x => xChainMap[x].name.toLowerCase().includes(query.toLowerCase())),
      ) || []
    );
  }, [query, allPositionsData]);

  const filteredCollaterals = useMemo(() => {
    return allCollateralData?.filter(
      xCollateral =>
        xCollateral.baseToken.symbol.toLowerCase().includes(query.toLowerCase()) ||
        xCollateral.baseToken.name?.toLowerCase().includes(query.toLowerCase()) ||
        Object.keys(xCollateral.chains).some(x => xChainMap[x].name.toLowerCase().includes(query.toLowerCase())),
    );
  }, [query, allCollateralData]);

  return (
    <>
      <DashGrid marginTop={'15px'} p="0 25px">
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
          <List>
            {filteredPositions.map((xPosition, index) =>
              xPosition.isPositionSingleChain ? (
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
          </List>
          {filteredPositions.length === 0 && (
            <Typography p="30px 0 0" textAlign="center">
              <Trans>No positions found.</Trans>
            </Typography>
          )}
        </>
      )}

      {collateralTab === CollateralTab.ALL && (
        <List>
          {filteredCollaterals
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
      )}
    </>
  );
};

export default CollateralTypeList;
