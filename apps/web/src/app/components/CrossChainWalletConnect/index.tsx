import React from 'react';

import { Typography } from '@/app/theme';
import { shortenAddress } from '@/utils';
import { XChainId } from '@balancednetwork/xwagmi';

import { useSwapState } from '@/store/swap/hooks';
import { getXChainType } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { useXAccount, useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
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
        <UnderlineText>{shortenAddress(address || '', 4)}</UnderlineText>
      ) : (
        <UnderlineText>Connect wallet</UnderlineText>
      )}
    </Typography>
  ) : (
    <>
      <Typography onClick={openModal} color="primaryBright">
        {recipient ? (
          <UnderlineText>{shortenAddress(recipient, 4)}</UnderlineText>
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
