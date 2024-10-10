import React, { useCallback } from 'react';

import { Flex } from 'rebass/styled-components';

import WalletConnectIcon from '@/assets/icons/wallets/walletconnect.svg?inline';

import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { UnbreakableText, WalletOption } from './shared';
import { Modal } from '@/app/components2/Modal';

const icons = {
  walletConnect: WalletConnectIcon,
};

export const EVMWalletModal = ({ id = MODAL_ID.EVM_WALLET_OPTIONS_MODAL }) => {
  const modalOpen = useModalOpen(id);

  const xConnectors = useXConnectors('EVM');
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
      <Modal open={modalOpen} onDismiss={onDismiss} dialogClassName="max-w-[450px]">
        {xConnectors.length > 0 ? (
          <>
            <div className="text-center mb-6">Connect with:</div>
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
            <div className="text-center mb-6">No EVM-based wallet detected.</div>
            <div className="text-center">
              Add a wallet like{' '}
              <div
                onClick={() =>
                  window.open('https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl')
                }
              >
                <span>Hana</span>
              </div>
              ,{' '}
              <div
                onClick={() =>
                  window.open('https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn')
                }
              >
                <span>MetaMask</span>
              </div>
              , or{' '}
              <div
                onClick={() =>
                  window.open('https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch')
                }
              >
                <span>Rabby</span>
              </div>{' '}
              to your browser, then try again.
            </div>
          </>
        )}
      </Modal>
    </>
  );
};
