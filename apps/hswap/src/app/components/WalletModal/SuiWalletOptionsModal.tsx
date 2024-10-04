import React, { useCallback } from 'react';

import { Flex } from 'rebass/styled-components';

import { Typography } from '@/app/components2/Typography';
import WalletConnectIcon from '@/assets/icons/wallets/walletconnect.svg?inline';

import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { UnbreakableText, WalletOption } from './shared';
import { Modal } from '@/app/components2/Modal';

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
      <Modal open={modalOpen} onDismiss={onDismiss}>
        {xConnectors.length > 0 ? (
          <>
            <Typography className="text-center mb-6">Connect with:</Typography>
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
            <Typography className="text-center mb-6">No SUI-based wallet detected.</Typography>
            <Typography className="text-center">
              Add a wallet like{' '}
              <Typography
                variant={'span'}
                color="primaryBright"
                onClick={() =>
                  window.open('https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl')
                }
              >
                <span>Hana</span>
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
                <span>Sui Wallet</span>
              </Typography>{' '}
              to your browser, then try again.
            </Typography>
          </>
        )}
      </Modal>
    </>
  );
};
