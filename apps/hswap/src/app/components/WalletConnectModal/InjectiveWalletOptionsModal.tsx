import { Modal } from '@/app/components2/Modal';
import { WalletLogo } from '@/app/components2/WalletLogo';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { XConnector } from '@balancednetwork/xwagmi';
import { useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
import React, { useCallback } from 'react';

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
      <Modal open={modalOpen} onDismiss={onDismiss} dialogClassName="max-w-[375px] h-[622px] p-0" showOverlay={true}>
        <div className="pt-[120px] pb-[216px] px-6 bg-[url('/marsh-with-coins.png')] bg-[center_bottom_0] bg-[length:319px] bg-no-repeat">
          <div className="mb-10 text-title-gradient text-[28px] font-extrabold leading-[30px] cursor-default">
            <div>Connect an</div>
            <div>Injective wallet.</div>
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
        </div>
      </Modal>
    </>
  );
};
