import React from 'react';

import { Typography } from '@/app/theme';
import { XChainId } from '@/types';
import { shortenAddress } from '@/utils';

import { xChainMap } from '@/constants/xChains';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSwapState } from '@/store/swap/hooks';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccount, useXConnect } from '@/xwagmi/hooks';
import { useXWagmiStore } from '@/xwagmi/useXWagmiStore';
import { Trans } from '@lingui/macro';
import { UnderlineText } from '../DropdownText';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import AddressInput from './AddressInput';

const CrossChainWalletConnect = ({ xChainId, editable }: { xChainId: XChainId; editable?: boolean }) => {
  const [editableAddressModalOpen, setEditableAddressModalOpen] = React.useState(false);
  const { recipient } = useSwapState();

  const xChainType = getXChainType(xChainId);
  const xService = useXWagmiStore(state => state.xServices[xChainType]!);
  const { address } = useXAccount(xChainType);

  const xConnect = useXConnect();
  const handleConnect = () => {
    const xConnectors = xService.getXConnectors();

    if (xChainType === 'EVM') {
      modalActions.openModal(MODAL_ID.EVM_WALLET_OPTIONS_MODAL);
    } else {
      xConnect(xConnectors[0]);
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
      {address ? (
        <UnderlineText>{shortenAddress(address || '', 5)}</UnderlineText>
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
