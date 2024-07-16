import React, { useCallback } from 'react';

import { useMedia } from 'react-use';

import {
  useCollateralChangeCollateralType,
  useCollateralActionHandlers,
  useXCollateralDataByToken,
  useAllCollateralTemplate,
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
import MultiChainItemOverview from './MultiChainItemOverview';

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
  const { onAdjust: adjust } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan } = useLoanActionHandlers();
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);

  const allPositionsData = useXCollateralDataByToken(true);
  const { data: allCollateralData } = useAllCollateralTemplate();

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
              return xCollateral.isCollateralSingleChain ? (
                <SingleChainItemOverview
                  baseToken={xCollateral.baseToken}
                  key={index}
                  networkPosition={{ [ICON_XCALL_NETWORK_ID]: xCollateral.total }}
                  isLast={index === length - 1}
                  onSelect={handleCollateralTypeChange}
                />
              ) : (
                <MultiChainItemOverview
                  key={index}
                  baseToken={xCollateral.baseToken}
                  chains={xCollateral.chains}
                  onSelect={handleCollateralTypeChange}
                  total={xCollateral.total}
                />
              );
            })}
        </List>
      )}
    </>
  );
};

export default CollateralTypeList;
