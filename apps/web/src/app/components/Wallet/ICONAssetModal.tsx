import React from 'react';
import Modal from '../Modal';
import {
  AssetSymbol,
  BalanceAndValueWrap,
  BoxPanelWithArrow,
  DashGrid,
  DataText,
  HeaderText,
  ListItem,
  ModalContent,
  walletBreakpoint,
} from './styledComponents';
import { Trans } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Currency } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import useClaimableICX from './useClaimableICX';

import SendPanel from './ICONWallets/SendPanel';
import ICXWallet from './ICONWallets/ICXWallet';
import SICXWallet from './ICONWallets/SICXWallet';
import CurrencyLogoWithNetwork from './CurrencyLogoWithNetwork';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import { useTheme } from 'styled-components';
import { Typography } from 'app/theme';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';

const WalletUIs = {
  ICX: ICXWallet,
  sICX: SICXWallet,
};

const WalletUI = ({ currency }: { currency: Currency }) => {
  const claimableICX = useClaimableICX();

  const UI = currency.symbol ? WalletUIs[currency.symbol] ?? SendPanel : SendPanel;
  if (currency.symbol === 'ICX') {
    return <UI currency={currency} claimableICX={claimableICX} />;
  } else {
    return <UI currency={currency} />;
  }
};

const ICONAssetModal = ({ token, balance, value, isOpen, close }) => {
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const theme = useTheme();

  return (
    <Modal isOpen={isOpen} onDismiss={close}>
      <ModalContent>
        <DashGrid>
          <HeaderText>
            <Trans>Asset</Trans>
          </HeaderText>
          <BalanceAndValueWrap>
            <HeaderText>
              <Trans>Balance</Trans>
            </HeaderText>
            {isSmallScreen ? null : (
              <HeaderText>
                <Trans>Value</Trans>
              </HeaderText>
            )}
          </BalanceAndValueWrap>
        </DashGrid>
        <ListItem $border={false}>
          <AssetSymbol>
            <CurrencyLogoWithNetwork
              currency={token}
              chainId={ICON_XCALL_NETWORK_ID}
              bgColor={theme.colors.bg2}
              size={'24px'}
            />
            <Typography fontSize={16} fontWeight={'bold'}>
              {token.symbol}
            </Typography>
          </AssetSymbol>
          <BalanceAndValueWrap>
            <DataText as="div">
              {balance?.toFixed(HIGH_PRICE_ASSET_DP[token.address] || 2, { groupSeparator: ',' })}
            </DataText>
            <DataText as="div">{!value ? '-' : `$${value.toFormat(2)}`}</DataText>
          </BalanceAndValueWrap>
        </ListItem>
        <BoxPanelWithArrow bg="bg3">
          <WalletUI currency={token} />
        </BoxPanelWithArrow>
      </ModalContent>
    </Modal>
  );
};

export default ICONAssetModal;
