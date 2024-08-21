import React from 'react';

import { Typography } from '@/app/theme';
import { useArchwayContext } from '@/packages/archway/ArchwayProvider';
import { XChainId, XWalletType } from '@/types';
import { shortenAddress } from '@/utils';

import { xChainMap, xWalletTypeModalIdMap } from '@/constants/xChains';
import { modalActions } from '@/hooks/useModalStore';
import useWallets from '@/hooks/useWallets';
import { useHavahContext } from '@/packages/havah/HavahProvider';
import { useIconReact } from '@/packages/icon-react';
import { useSwapState } from '@/store/swap/hooks';
import { Trans } from '@lingui/macro';
import { UnderlineText } from '../DropdownText';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import AddressInput from './AddressInput';

const CrossChainWalletConnect = ({ xChainId, editable }: { xChainId: XChainId; editable?: boolean }) => {
  const [editableAddressModalOpen, setEditableAddressModalOpen] = React.useState(false);

  const { connectToWallet: connectToIcon } = useIconReact();
  const { connectToWallet: connectKeplr } = useArchwayContext();
  const { connectToWallet: connectToHavah } = useHavahContext();
  const { recipient } = useSwapState();

  const wallets = useWallets();
  const account = wallets[xChainMap[xChainId].xWalletType].account;

  const handleConnect = () => {
    const chain = xChainMap[xChainId];
    if (chain.xWalletType === XWalletType.ICON) {
      connectToIcon();
    } else if (chain.xWalletType === XWalletType.COSMOS) {
      connectKeplr();
    } else if (chain.xWalletType === XWalletType.HAVAH) {
      connectToHavah();
    } else {
      modalActions.openModal(xWalletTypeModalIdMap[chain.xWalletType]);
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
      {account ? (
        <UnderlineText>{shortenAddress(account || '', 5)}</UnderlineText>
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
          <AddressInput onSave={closeModal} chainId={xChainId} />
          <Typography textAlign="center" mt={3}>
            <Trans>Or connect your</Trans>{' '}
            <UnderlineText color={'red'} onClick={handleConnect}>
              <Typography color={'primaryBright'}>
                {`${xChainMap[xChainId].name}`} <Trans>wallet</Trans>
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
