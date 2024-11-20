import React, { useCallback } from 'react';

import { Flex } from 'rebass/styled-components';

import WalletConnectIcon from '@/assets/icons/wallets/walletconnect.svg?inline';

import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { UnbreakableText, WalletOption } from './shared';
import { Modal } from '@/app/components2/Modal';
import { WalletLogo } from '@/app/components2/WalletLogo';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';

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
      <Modal
        open={modalOpen}
        onDismiss={onDismiss}
        dialogClassName="max-w-[375px] h-[622px] p-0 !rounded-3xl"
        showOverlay={true}
        hideCloseIcon={true}
      >
        <div className="pt-[120px] pb-[216px] px-6 bg-[url('/marsh-with-coins.png')] bg-[center_bottom_0] bg-no-repeat">
          <XIcon className="absolute top-10 right-6 cursor-pointer" onClick={onDismiss} />
          {xConnectors.length > 0 ? (
            <>
              <div className="col-span-2 mb-10 text-title-gradient text-[28px] font-extrabold leading-[30px] cursor-default">
                <div>Connect a</div>
                <div>SUI wallet.</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {xConnectors?.toReversed?.()?.map(xConnector => (
                  <div
                    key={xConnector.id}
                    className="h-[88px] bg-[#221542] rounded-3xl flex items-end p-4 pr-0 cursor-pointer"
                    onClick={() => handleConnect(xConnector)}
                  >
                    <div className="flex gap-2 items-center">
                      <WalletLogo logo={xConnector.icon} />
                      <div className="text-[#e6e0f7] text-xs font-bold leading-none">{xConnector.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="col-span-2 mb-10 text-title-gradient text-[28px] font-extrabold leading-[30px] cursor-default">
                <div>No SUI-based wallet detected.</div>
              </div>

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
                    window.open(
                      'https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil?hl=en-US',
                    )
                  }
                >
                  <span>Sui Wallet</span>
                </div>{' '}
                to your browser, then try again.
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};
