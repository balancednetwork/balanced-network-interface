import React from 'react';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { XChainId, XWalletType } from 'app/pages/trade/bridge/types';
import { Typography } from 'app/theme';
import { useWalletModal } from 'store/application/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import { shortenAddress } from 'utils';

import { UnderlineText } from '../DropdownText';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import AddressInput from './AddressInput';
import { useSwapState } from 'store/swap/hooks';
import { Trans } from '@lingui/macro';

const CrossChainWalletConnect = ({ chainId, editable }: { chainId: XChainId; editable?: boolean }) => {
  const signedInWallets = useSignedInWallets();
  const [editableAddressModalOpen, setEditableAddressModalOpen] = React.useState(false);
  const { connectToWallet: connectKeplr } = useArchwayContext();
  const [, setWalletModal] = useWalletModal();
  const { recipient } = useSwapState();

  const getChainAddress = (_chainId: XChainId): string | undefined => {
    const wallet = signedInWallets.find(wallet => wallet.chainId === _chainId);
    if (wallet) {
      return wallet.address;
    }
  };

  const handleConnect = () => {
    const chain = xChainMap[chainId];
    if (chain.xWalletType === XWalletType.COSMOS) {
      connectKeplr();
    } else {
      setWalletModal(chain.xWalletType);
    }
    closeModal();
  };

  const openModal = () => {
    setEditableAddressModalOpen(true);
  };

  const closeModal = () => {
    setEditableAddressModalOpen(false);
  };

  return !editable ? (
    <Typography onClick={handleConnect} color="primaryBright">
      {getChainAddress(chainId) ? (
        <UnderlineText>{shortenAddress(getChainAddress(chainId) || '', 5)}</UnderlineText>
      ) : (
        <UnderlineText>Connect wallet</UnderlineText>
      )}
    </Typography>
  ) : (
    <>
      <Typography onClick={openModal} color="primaryBright">
        {recipient ? (
          <UnderlineText>{shortenAddress(recipient, 5)}</UnderlineText>
        ) : (
          <UnderlineText>Choose address</UnderlineText>
        )}
      </Typography>
      <Modal isOpen={editableAddressModalOpen} onDismiss={closeModal} maxWidth={360}>
        <ModalContentWrapper>
          <Typography textAlign="center" mb={3}>
            <Trans>Enter a recipient address:</Trans>
          </Typography>
          <AddressInput onSave={closeModal} chainId={chainId} />
          <Typography textAlign="center" mt={3}>
            <Trans>Or connect</Trans>{' '}
            <UnderlineText color={'red'} onClick={handleConnect}>
              <Typography color={'primaryBright'}>
                <Trans>your wallet</Trans>
              </Typography>
            </UnderlineText>
            .
          </Typography>
        </ModalContentWrapper>
      </Modal>
    </>
  );
};

export default CrossChainWalletConnect;
