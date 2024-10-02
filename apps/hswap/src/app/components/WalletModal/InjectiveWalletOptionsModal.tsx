import React, { useCallback } from 'react';

import { Flex } from 'rebass/styled-components';

import { Typography } from '@/app/theme';

import { UnbreakableText, WalletOption } from '@/app/components/WalletModal/shared';

import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { Modal } from '@/app/components2/Modal';

type InjectiveWalletOptionsModalProps = {
  id?: MODAL_ID;
};

export const InjectiveWalletOptionsModal = ({
  id = MODAL_ID.INJECTIVE_WALLET_OPTIONS_MODAL,
}: InjectiveWalletOptionsModalProps) => {
  const modalOpen = useModalOpen(id);

  const xConnectors = useXConnectors('INJECTIVE');

  const onDismiss = useCallback(() => {
    modalActions.closeModal(id);
  }, [id]);

  const xConnect = useXConnect();
  const handleConnect = async (xConnector: XConnector) => {
    await xConnect(xConnector);

    onDismiss();
  };

  return (
    <>
      <Modal open={modalOpen} onDismiss={onDismiss} title="">
        <Typography textAlign="center" margin={'0 0 25px'}>
          Connect with:
        </Typography>
        <Flex alignItems="stretch" justifyContent="space-around" flexWrap="wrap">
          {xConnectors?.map(xConnector => (
            <WalletOption key={xConnector.id} onClick={() => handleConnect(xConnector)}>
              <img width={50} height={50} src={xConnector.icon} />
              <UnbreakableText>{xConnector.name}</UnbreakableText>
            </WalletOption>
          ))}
        </Flex>
      </Modal>
    </>
  );
};
