import React from 'react';
import { AssetSymbol, BalanceAndValueWrap, DataText, ListItem } from './styledComponents';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import CurrencyLogo from '../CurrencyLogo';
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
  const [claimableICX, setClaimableICX] = React.useState(new BigNumber(0));
  const transactions = useAllTransactions();
  const isICONAsset = xChainId === ICON_XCALL_NETWORK_ID;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    (async () => {
      if (iconAccount && symbol === 'ICX') {
        const result = await bnJs.Staking.getClaimableICX(iconAccount);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [iconAccount, transactions]);

  const hasNotification = claimableICX.isGreaterThan(0);

  return (
    <ListItem $border={!isLast}>
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
  );
};

export default SingleChainBalanceItem;
