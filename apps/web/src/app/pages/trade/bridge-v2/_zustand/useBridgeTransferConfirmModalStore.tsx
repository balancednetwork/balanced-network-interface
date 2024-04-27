// @ts-nocheck
import { create } from 'zustand';
import { useWithdrawableNativeAmount } from 'store/xCall/hooks';
import { useBridgeDirection, useDerivedBridgeInfo } from 'store/bridge/hooks';

export const useBridgeTransferConfirmModalStore = create(set => ({
  modalOpen: false,

  transfer: {
    id: '1',
    sourceChain: 'archway-1',
    destinationChain: '0x1.icon',
    sourceAddress: '0x123',
    destinationAddress: '0x456',
    transferToken: 'token',
    transferAmount: '100',
    status: 'pending',
    transactions: [],
    events: [],

    // events: [
    // XCallEventType.CallMessageSent
    // XCallEventType.CallMessage,
    // XCallEventType.CallExecuted,
    // XCallEventType.ResponseMessage,
    // XCallEventType.RollbackMessage
    // ];
  },

  isWithdrawNativeChecked: false,
  isTransferring: false,

  setIsWithdrawNativeChecked: (checked: boolean) => set({ isWithdrawNativeChecked: checked }),
}));

export const bridgeTransferConfirmModalActions = {
  openModal: () => {
    useBridgeTransferConfirmModalStore.setState({ modalOpen: true });
  },
  closeModal: () => {
    useBridgeTransferConfirmModalStore.setState({ modalOpen: false });
  },

  setIsWithdrawNativeChecked: (checked: boolean) => {
    useBridgeTransferConfirmModalStore.setState({ isWithdrawNativeChecked: checked });
  },

  setIsTransferring: (isTransferring: boolean) => {
    useBridgeTransferConfirmModalStore.setState({ isTransferring });
  },

  // approve: () => {},
  executeTransfer: async () => {
    // const { sourceChain, destinationChain } = useBridgeTransferFormStore.getState();

    // const srcXCallService = createXCallService(sourceChain);
    // const transfer = await srcXCallService.executeTransfer(transferData);

    // useBridgeTransferConfirmModalStore.setState({
    //   transfer: transfer,
    // });

    // add transaction from transfer result to transfer transactions
    // fetch events and update transfer events
    // srcXCallService.fetchSourceEvents(transferData);
  },
};

export const useBridgeTransferConfirmModal = () => {
  const bridgeDirection = useBridgeDirection();
  const { currencyAmountToBridge } = useDerivedBridgeInfo();

  const { modalOpen, isWithdrawNativeChecked, setIsWithdrawNativeChecked } = useBridgeTransferConfirmModalStore();

  const isTransferring = false;
  const isAllowanceIncreaseNeeded = false;
  const shouldLedgerSign = false;
  const isNativeVersionAvailable = false;

  const { data: withdrawableNativeAmount } = useWithdrawableNativeAmount(bridgeDirection.to, currencyAmountToBridge);

  return {
    modalOpen,
    isWithdrawNativeChecked,

    // derived
    isTransferring,
    isAllowanceIncreaseNeeded,
    shouldLedgerSign,
    isNativeVersionAvailable,
    withdrawableNativeAmount,

    // actions
    setIsWithdrawNativeChecked,
  };
};
