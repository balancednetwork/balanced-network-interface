import React, { useCallback } from 'react';

import { Flex } from 'rebass/styled-components';

import Modal from '@/app/components/Modal';
import { Typography } from '@/app/theme';
import WalletConnectIcon from '@/assets/icons/wallets/walletconnect.svg?inline';

import { ModalContentWrapper } from '../ModalContent';

import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { UnderlineText } from '../DropdownText';
import { UnbreakableText, WalletOption } from './shared';

const icons = {
  walletConnect: WalletConnectIcon,
};

export const SuiWalletOptionsModal = ({ id = MODAL_ID.SUI_WALLET_OPTIONS_MODAL }: { id?: MODAL_ID }) => {
  const modalOpen = useModalOpen(id);

  const xConnectors = useXConnectors('SUI');
  const xConnect = useXConnect();

  const onDismiss = useCallback(() => {
    modalActions.closeModal(id);
  }, [id]);

  const handleConnect = async (xConnector: XConnector) => {
    await xConnect(xConnector);

    onDismiss();
  };

  return (
    <>
      <Modal isOpen={modalOpen} onDismiss={onDismiss} maxWidth={360}>
        <ModalContentWrapper>
          {xConnectors.length > 0 ? (
            <>
              <Typography textAlign="center" margin={'0 0 25px'}>
                Connect with:
              </Typography>
              <Flex alignItems="stretch" justifyContent="space-around" flexWrap="wrap">
                {xConnectors?.toReversed?.()?.map(xConnector => (
                  <WalletOption key={xConnector.id} onClick={() => handleConnect(xConnector)}>
                    <img width={50} height={50} src={xConnector.icon ?? icons[xConnector.id]} />
                    <UnbreakableText>{xConnector.name}</UnbreakableText>
                  </WalletOption>
                ))}
              </Flex>
            </>
          ) : (
            <>
              <Typography textAlign="center" margin={'0 0 25px'}>
                No SUI-based wallet detected.
              </Typography>
              <Typography textAlign="center">
                Add a wallet like{' '}
                <Typography
                  variant={'span'}
                  color="primaryBright"
                  onClick={() =>
                    window.open('https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl')
                  }
                >
                  <UnderlineText>Hana</UnderlineText>
                </Typography>
                ,{' '}
                <Typography
                  variant={'span'}
                  color="primaryBright"
                  onClick={() =>
                    window.open(
                      'https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil?hl=en-US',
                    )
                  }
                >
                  <UnderlineText>Sui Wallet</UnderlineText>
                </Typography>{' '}
                to your browser, then try again.
              </Typography>
            </>
          )}
        </ModalContentWrapper>
      </Modal>
    </>
  );
};
