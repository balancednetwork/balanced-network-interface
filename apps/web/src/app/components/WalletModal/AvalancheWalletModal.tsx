import React from 'react';

import { Flex } from 'rebass/styled-components';

import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import WalletConnectIcon from 'assets/icons/wallets/walletconnect.svg?inline';
import { useWalletModal } from 'store/application/hooks';

import { ModalContentWrapper } from '../ModalContent';
import { WalletModal } from 'store/application/reducer';

import { Connector, useConnect, useConnectors } from 'wagmi';
import { avalanche } from 'wagmi/chains';
import { WalletOption, UnbreakableText } from './shared';

const icons = {
  walletConnect: WalletConnectIcon,
};

export const AvalancheWalletModal = () => {
  const [isOpen, toggle] = useWalletModal(WalletModal.AVALANCHE);

  const connectors = useConnectors();

  const { connectAsync } = useConnect();

  const handleConnect = async (connector: Connector) => {
    await connectAsync({ connector: connector, chainId: avalanche.id });
    toggle();
  };

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={toggle} maxWidth={360}>
        <ModalContentWrapper>
          <Typography textAlign="center" margin={'0 0 25px'}>
            Connect with:
          </Typography>
          <Flex alignItems="stretch" justifyContent="space-around" flexWrap="wrap">
            {connectors?.toReversed()?.map(connector => (
              <WalletOption key={connector.id} onClick={() => handleConnect(connector)}>
                <img width={50} height={50} src={connector.icon ?? icons[connector.id]} />
                <UnbreakableText>{connector.name}</UnbreakableText>
              </WalletOption>
            ))}
          </Flex>
        </ModalContentWrapper>
      </Modal>
    </>
  );
};
