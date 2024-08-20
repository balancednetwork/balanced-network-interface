import React, { useCallback } from 'react';

import { Flex } from 'rebass/styled-components';

import Modal from '@/app/components/Modal';
import { Typography } from '@/app/theme';
import WalletConnectIcon from '@/assets/icons/wallets/walletconnect.svg?inline';

import { ModalContentWrapper } from '../ModalContent';

import { MODAL_ID, modalActions, useModalStore } from '@/hooks/useModalStore';
import { Connector, useConnect, useConnectors } from 'wagmi';
import { UnderlineText } from '../DropdownText';
import { UnbreakableText, WalletOption } from './shared';

const icons = {
  walletConnect: WalletConnectIcon,
};

export const EVMWalletModal = ({ id = MODAL_ID.EVM_WALLET_OPTIONS_MODAL }) => {
  const open = useModalStore(state => state.modals?.[id]);
  const onDismiss = useCallback(() => {
    modalActions.closeModal(id);
  }, [id]);

  const connectors = useConnectors();

  const { connectAsync } = useConnect();

  const handleConnect = async (connector: Connector) => {
    await connectAsync({ connector: connector });
    onDismiss();
  };

  return (
    <>
      <Modal isOpen={!!open} onDismiss={onDismiss} maxWidth={360}>
        <ModalContentWrapper>
          {connectors.length > 0 ? (
            <>
              <Typography textAlign="center" margin={'0 0 25px'}>
                Connect with:
              </Typography>
              <Flex alignItems="stretch" justifyContent="space-around" flexWrap="wrap">
                {connectors?.toReversed?.()?.map(connector => (
                  <WalletOption key={connector.id} onClick={() => handleConnect(connector)}>
                    <img width={50} height={50} src={connector.icon ?? icons[connector.id]} />
                    <UnbreakableText>{connector.name}</UnbreakableText>
                  </WalletOption>
                ))}
              </Flex>
            </>
          ) : (
            <>
              <Typography textAlign="center" margin={'0 0 25px'}>
                No EVM-based wallet detected.
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
                    window.open('https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn')
                  }
                >
                  <UnderlineText>MetaMask</UnderlineText>
                </Typography>
                , or{' '}
                <Typography
                  variant={'span'}
                  color="primaryBright"
                  onClick={() =>
                    window.open(
                      'https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch',
                    )
                  }
                >
                  <UnderlineText>Rabby</UnderlineText>
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
