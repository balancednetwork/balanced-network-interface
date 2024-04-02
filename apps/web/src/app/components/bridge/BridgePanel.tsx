import React, { useState, useEffect, useCallback } from 'react';
import { CurrentXCallStateType } from 'app/_xcall/types';
import { useCurrentXCallState, useSetNotPristine, useSetXCallState } from 'store/xCall/hooks';

import BridgeTransferModal from './BridgeTransferModal';
import BridgeTransferForm from './BridgeTransferForm';

export default function BridgePanel() {
  const [transferData, setTransferData] = useState<any>();

  const [modalClosable, setModalClosable] = useState(true);
  const [xCallInProgress, setXCallInProgress] = useState(false);

  const [isOpen, setOpen] = useState(false);
  const currentXCallState = useCurrentXCallState();
  const setCurrentXCallState = useSetXCallState();
  const setNotPristine = useSetNotPristine();

  // TODO: understand the purpose of this useEffect
  useEffect(() => {
    return () => setNotPristine();
  }, [setNotPristine]);

  const openModal = useCallback(() => {
    setCurrentXCallState(CurrentXCallStateType.AWAKE);
    setOpen(true);
  }, [setCurrentXCallState]);

  const closeModal = useCallback(() => {
    setCurrentXCallState(CurrentXCallStateType.IDLE);
    setOpen(false);
    setXCallInProgress(false);
    setNotPristine();
  }, [setCurrentXCallState, setNotPristine]);

  const xCallReset = useCallback(() => {
    setModalClosable(true);
    closeModal();
    // handleTypeInput(''); // TODO: handleTypeInput moved to transfer form, need to refactor
  }, [closeModal]);

  const controlledClose = useCallback(() => {
    if (modalClosable && !xCallInProgress) {
      xCallReset();
    }
  }, [modalClosable, xCallInProgress, xCallReset]);

  useEffect(() => {
    if (currentXCallState === CurrentXCallStateType.IDLE) {
      xCallReset();
    }
  }, [currentXCallState, xCallReset]);

  const handleModalOpen = values => {
    setTransferData(values);
    openModal();
  };

  return (
    <>
      <BridgeTransferForm onSubmit={handleModalOpen} />

      <BridgeTransferModal
        transferData={transferData || {}}
        isOpen={isOpen}
        onDismiss={controlledClose}
        closeModal={closeModal}
        xCallReset={xCallReset}
        xCallInProgress={xCallInProgress}
        setXCallInProgress={setXCallInProgress}
      />
    </>
  );
}
