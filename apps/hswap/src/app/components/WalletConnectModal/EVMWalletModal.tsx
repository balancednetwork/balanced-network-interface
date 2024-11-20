import React, { useCallback } from 'react';
import { Modal } from '@/app/components2/Modal';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { WalletLogo } from '@/app/components2/WalletLogo';

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
      <Modal open={modalOpen} onDismiss={onDismiss} dialogClassName="max-w-[375px] h-[622px] p-0" showOverlay={true}>
        <div className="pt-[120px] pb-[216px] px-6 bg-[url('/marsh-with-coins.png')] bg-[center_bottom_0] bg-no-repeat">
          {xConnectors.length > 0 ? (
            <>
              <div className="col-span-2 mb-10 text-title-gradient text-[28px] font-extrabold leading-[30px] cursor-default">
                <div>Connect an</div>
                <div>EVM wallet.</div>
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
                <div>No EVM-based wallet detected.</div>
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
                    window.open('https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn')
                  }
                >
                  <span>MetaMask</span>
                </div>
                , or{' '}
                <div
                  onClick={() =>
                    window.open(
                      'https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch',
                    )
                  }
                >
                  <span>Rabby</span>
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
