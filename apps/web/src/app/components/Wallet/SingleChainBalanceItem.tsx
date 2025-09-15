import { Typography } from '@/app/theme';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatSymbol, formatValue } from '@/utils/formatter';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { ICON_XCALL_NETWORK_ID } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import React from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import ICONAssetModal from './ICONAssetModal';
import { AssetSymbol, BalanceAndValueWrap, Chevron, DataText, ListItem } from './styledComponents';
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
  isNested = false,
}: SingleChainBalanceItemProps) => {
  const [xChainId, balance] = Object.entries(networkBalance)[0];
  const { currency } = balance || {};
  const { symbol } = currency || {};
  const theme = useTheme();
  const claimableICX = useClaimableICX();
  const isICONAsset = xChainId === ICON_XCALL_NETWORK_ID;
  const [isOpen, setOpen] = React.useState(false);
  const rates = useRatesWithOracle();

  //tmp
  const hasBTCB = currency?.symbol === 'BTCB' && balance?.greaterThan(0);
  //end of tmp

  const hasNotification = (baseToken.symbol === 'ICX' && claimableICX.isGreaterThan(0)) || hasBTCB;

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
      <ListItem $border={!isNested} onClick={handleModalOpen} className={isICONAsset ? 'has-modal' : 'no-pointer'}>
        <AssetSymbol $hasNotification={hasNotification}>
          <CurrencyLogoWithNetwork
            currency={baseToken}
            chainId={xChainId as XChainId}
            bgColor={isNested ? theme.colors.bg3 : theme.colors.bg4}
            size={isNested ? '20px' : '24px'}
          />
          <Typography fontSize={isNested ? 14 : 16} fontWeight={isNested ? 'normal' : 'bold'} pl={isNested ? '5px' : 0}>
            {isNested ? xChainMap[xChainId].name : formatSymbol(symbol)}
            {isICONAsset && <Chevron $isNested={isNested} />}
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          <DataText as="div">{formatBalance(balance?.toFixed(), rates?.[baseToken.symbol]?.toFixed())}</DataText>
          <DataText as="div">{!value ? '-' : formatValue(value.toFixed())}</DataText>
        </BalanceAndValueWrap>
      </ListItem>
      {isICONAsset && (
        <ICONAssetModal isOpen={isOpen} token={baseToken} balance={balance} value={value} close={closeModal} />
      )}
    </>
  );
};

export default SingleChainBalanceItem;
