import React, { useCallback, useState } from 'react';

import { t } from '@lingui/macro';

import { Button } from '@/app/components/Button';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useWalletModalToggle } from '@/store/application/hooks';
import { MMTrade, useDerivedTradeInfo, useSwapActionHandlers } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { StellarAccountValidation, StellarTrustlineValidation, getXChainType } from '@balancednetwork/xwagmi';
import { useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
import OrderModal from './OrderModal';

interface OrderCommitButtonProps {
  recipient: string | undefined | null;
  stellarValidation?: StellarAccountValidation;
  stellarTrustlineValidation?: StellarTrustlineValidation;
  setOrders: (orders: any) => void;
}

const OrderCommitButton: React.FC<OrderCommitButtonProps> = props => {
  const { recipient, stellarValidation, stellarTrustlineValidation, setOrders } = props;
  const { sourceAddress, direction, currencies, inputError } = useDerivedTradeInfo();

  const toggleWalletModal = useWalletModalToggle();

  //todo: probably need to handle trade state
  const [executionTrade, setExecutionTrade] = useState<MMTrade | undefined>(undefined);

  const xChainType = getXChainType(direction.from);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  const handleSwap = async () => {
    if ((!sourceAddress && recipient) || (!sourceAddress && direction.from === direction.to)) {
      handleConnectWallet(xChainType, xConnectors, xConnect);
    } else if (!sourceAddress && !recipient) {
      toggleWalletModal();
    } else {
      // setExecutionTrade(trade);
      modalActions.openModal(MODAL_ID.ORDER_CONFIRM_MODAL);
    }
  };

  return (
    <>
      <Button
        disabled={!!inputError || stellarValidation?.ok === false || stellarTrustlineValidation?.ok === false}
        color="primary"
        onClick={handleSwap}
      >
        {inputError || t`Swap`}
      </Button>

      <OrderModal recipient={recipient} setOrders={setOrders} />
    </>
  );
};

export default OrderCommitButton;
