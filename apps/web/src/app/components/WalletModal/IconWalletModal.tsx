import React, {} from 'react';

import { useIconReact } from '@/packages/icon-react';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';

import Modal from '@/app/components/Modal';
import { Typography } from '@/app/theme';
import IconWalletIcon from '@/assets/icons/wallets/iconex.svg';
import { useWalletModal } from '@/store/application/hooks';

import { ModalContentWrapper } from '../ModalContent';
import { WalletOption, UnbreakableText } from './shared';
import { XWalletType } from '@/app/pages/trade/bridge/types';

export const IconWalletModal = () => {
  const upExtraSmall = useMedia('(min-width: 420px)');
  const [walletModal, , onDismiss] = useWalletModal();

  const { requestAddress, hasExtension, account, disconnect } = useIconReact();

  const handleOpenWallet = React.useCallback(() => {
    if (isMobile) {
      requestAddress();
    } else {
      if (hasExtension) {
        requestAddress();
        onDismiss();
      } else {
        window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl?hl=en', '_blank');
      }
    }
  }, [onDismiss, hasExtension, requestAddress]);

  return (
    <>
      <Modal isOpen={walletModal === XWalletType.ICON} onDismiss={onDismiss} maxWidth={360}>
        <ModalContentWrapper>
          <Typography textAlign="center" margin={'0 0 25px'}>
            Connect with:
          </Typography>
          <Flex alignItems="stretch" justifyContent="space-around" flexWrap={upExtraSmall ? 'nowrap' : 'wrap'}>
            <WalletOption onClick={handleOpenWallet}>
              <IconWalletIcon width="50" height="50" />
              <UnbreakableText>ICON wallet</UnbreakableText>
            </WalletOption>
          </Flex>
        </ModalContentWrapper>
      </Modal>
    </>
  );
};
