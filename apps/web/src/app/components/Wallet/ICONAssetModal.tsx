import { Currency } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import React from 'react';
import { useMedia } from 'react-use';
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

import { Typography } from '@/app/theme';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance } from '@/utils/formatter';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';

const ICONAssetModal = ({ token, balance, value, isOpen, close }) => {
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const theme = useTheme();
  const rates = useRatesWithOracle();

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
            <CurrencyLogoWithNetwork currency={token} bgColor={theme.colors.bg2} size={'24px'} />
            <Typography fontSize={16} fontWeight={'bold'}>
              {token.symbol}
            </Typography>
          </AssetSymbol>
          <BalanceAndValueWrap>
            <DataText as="div">{formatBalance(balance?.toFixed(), rates?.[token.symbol]?.toFixed())}</DataText>
            <DataText as="div">{!value ? '-' : `$${value.toFormat(2)}`}</DataText>
          </BalanceAndValueWrap>
        </ListItem>
      </ModalContent>
    </Modal>
  );
};

export default ICONAssetModal;
