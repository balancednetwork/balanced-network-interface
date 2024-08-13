import React from 'react';

import { Flex } from 'rebass/styled-components';

import Modal from '@/app/components/Modal';
import { Typography } from '@/app/theme';
import MetamaskIcon from '@/assets/icons/wallets/metamask.svg?inline';
import KeplrIcon from '@/assets/icons/wallets/keplr.svg?inline';

import { ModalContentWrapper } from '@/app/components/ModalContent';
import { UnbreakableText, WalletOption } from '@/app/components/WalletModal/shared';
import { UnderlineText } from '@/app/components/DropdownText';
import { MODAL_ID, modalActions, useModalStore } from '@/app/pages/trade/bridge/_zustand/useModalStore';

import { Wallet } from '@injectivelabs/wallet-ts';
import { useInjectiveWalletStore } from '.';

type InjectiveWalletOptionsModalProps = {
  id?: MODAL_ID;
};

const connectors = [
  {
    id: 'metamask',
    name: 'MetaMask',
    wallet: Wallet.Metamask,
    icon: MetamaskIcon,
  },
  {
    id: 'keplr',
    name: 'Keplr',
    wallet: Wallet.Keplr,
    icon: KeplrIcon,
  },
];

export const InjectiveWalletOptionsModal = ({
  id = MODAL_ID.INJECTIVE_WALLET_OPTIONS_MODAL,
}: InjectiveWalletOptionsModalProps) => {
  const open = useModalStore(state => state.modals?.[id]);
  const { connect } = useInjectiveWalletStore();

  const handleConnect = async (wallet: Wallet) => {
    await connect(wallet);

    modalActions.closeModal(id);
  };

  return (
    <>
      <Modal isOpen={!!open} onDismiss={() => modalActions.closeModal(id)} maxWidth={360}>
        <ModalContentWrapper>
          {connectors.length > 0 ? (
            <>
              <Typography textAlign="center" margin={'0 0 25px'}>
                Connect with:
              </Typography>
              <Flex alignItems="stretch" justifyContent="space-around" flexWrap="wrap">
                {connectors?.map(connector => (
                  <WalletOption key={connector.id} onClick={() => handleConnect(connector.wallet)}>
                    <img width={50} height={50} src={connector.icon} />
                    <UnbreakableText>{connector.name}</UnbreakableText>
                  </WalletOption>
                ))}
              </Flex>
            </>
          ) : (
            <>
              <Typography textAlign="center" margin={'0 0 25px'}>
                No wallet detected.
              </Typography>
              <Typography textAlign="center">
                Add a wallet like{' '}
                <Typography
                  variant={'span'}
                  color="primaryBright"
                  onClick={() =>
                    window.open('https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn')
                  }
                >
                  <UnderlineText>MetaMask</UnderlineText>
                </Typography>
                ,{' '}
                <Typography
                  variant={'span'}
                  color="primaryBright"
                  onClick={() =>
                    window.open('https://chromewebstore.google.com/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap')
                  }
                >
                  <UnderlineText>Keplr</UnderlineText>
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
