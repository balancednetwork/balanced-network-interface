import React from 'react';

import { Typography } from '@/app/theme';
import { shortenAddress } from '@/utils';
import { XChainId } from '@balancednetwork/sdk-core';

import { useSwapState } from '@/store/swap/hooks';
import { getXChainType } from '@/xwagmi/actions';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXAccount, useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { Trans } from '@lingui/macro';
import { UnderlineText } from '../DropdownText';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import { handleConnectWallet } from '../WalletModal/WalletItem';
import AddressInput from './AddressInput';

const CrossChainWalletConnect = ({
  xChainId,
  editable,
  setManualAddress,
}: {
  xChainId: XChainId;
  editable?: boolean;
  setManualAddress?: (xChainId: XChainId, address?: string | undefined) => void;
}) => {
  const [editableAddressModalOpen, setEditableAddressModalOpen] = React.useState(false);
  const { recipient } = useSwapState();

  const xChainType = getXChainType(xChainId);
  const xConnectors = useXConnectors(xChainType);
  const { address } = useXAccount(xChainType);
  const xConnect = useXConnect();

  const handleConnect = () => {
    setManualAddress && setManualAddress(xChainId, undefined);

    handleConnectWallet(xChainType, xConnectors, xConnect);

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
          <AddressInput onSave={closeModal} xChainId={xChainId} setManualAddress={setManualAddress} />
          <Typography textAlign="center" mt={3}>
            <Trans>Or connect your</Trans>{' '}
            <UnderlineText onClick={handleConnect}>
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
