import React from 'react';
import { AssetSymbol, BalanceAndValueWrap, DataText, ListItem, walletBreakpoint } from './styledComponents';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { Typography } from 'app/theme';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import { XChainId } from 'app/pages/trade/bridge/types';
import CurrencyLogoWithNetwork from './CurrencyLogoWithNetwork';
import { useTheme } from 'styled-components';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import { useIconReact } from 'packages/icon-react';
import bnJs from 'bnJs';
import { BalancedJs } from '@balancednetwork/balanced-js';
import { useAllTransactions } from 'store/transactions/hooks';
import { useMedia } from 'react-use';
import ICONAssetModal from './ICONAssetModal';
import useClaimableICX from './useClaimableICX';

type SingleChainBalanceItemProps = {
  baseToken: Token;
  networkBalance: Partial<{ [key in XChainId]: CurrencyAmount<Currency> | undefined }>;
  isLast?: boolean;
  value?: BigNumber;
  isNested?: boolean;
};

const SingleChainBalanceItem = ({
  baseToken,
  networkBalance,
  value,
  isLast = true,
  isNested = false,
}: SingleChainBalanceItemProps) => {
  const { account: iconAccount } = useIconReact();
  const [xChainId, balance] = Object.entries(networkBalance)[0];
  const { currency } = balance || {};
  const { symbol } = currency || {};
  const theme = useTheme();
  const claimableICX = useClaimableICX();
  const hasNotification = baseToken.symbol === 'ICX' && claimableICX.isGreaterThan(0);
  const isICONAsset = xChainId === ICON_XCALL_NETWORK_ID;
  const [isOpen, setOpen] = React.useState(false);

  const closeModal = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleModalOpen = () => {
    if (isICONAsset) {
      setOpen(true);
    }
  };

  return (
    <>
      <ListItem $border={!isLast} onClick={handleModalOpen} style={{ cursor: isICONAsset ? 'pointer' : 'default' }}>
        <AssetSymbol $hasNotification={hasNotification}>
          <CurrencyLogoWithNetwork
            currency={baseToken}
            chainId={xChainId as XChainId}
            bgColor={isNested ? theme.colors.bg3 : theme.colors.bg4}
            size={isNested ? '20px' : '24px'}
          />
          <Typography fontSize={isNested ? 14 : 16} fontWeight={isNested ? 'normal' : 'bold'} pl={isNested ? '5px' : 0}>
            {isNested ? xChainMap[xChainId].name : symbol}
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          <DataText as="div">
            {balance?.toFixed(HIGH_PRICE_ASSET_DP[baseToken.address] || 2, { groupSeparator: ',' })}
          </DataText>
          <DataText as="div">{!value ? '-' : `$${value.toFormat(2)}`}</DataText>
        </BalanceAndValueWrap>
      </ListItem>
      {isICONAsset && (
        <ICONAssetModal isOpen={isOpen} token={baseToken} balance={balance} value={value} close={closeModal} />
      )}
    </>
  );
};

export default SingleChainBalanceItem;
