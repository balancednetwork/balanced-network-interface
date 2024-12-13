import { Button } from '@/app/components/Button';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useSwapActionHandlers } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { Currency, TradeType, XChainId } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { XToken, getXChainType, useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';
import React, { memo, useCallback, useState } from 'react';
import SwapModal from './SwapModal';
import XSwapModal from './XSwapModal';

interface SwapCommitButtonProps {
  trade: Trade<Currency, Currency, TradeType> | undefined;
  error: string | undefined;
  currencies: {
    INPUT?: XToken | undefined;
    OUTPUT?: XToken | undefined;
  };
  account: string | undefined;
  recipient: string | undefined | null;
  direction: {
    from: XChainId;
    to: XChainId;
  };
  canBridge: boolean;
  hidden: boolean;
}

const SwapCommitButton: React.FC<SwapCommitButtonProps> = memo(props => {
  const { trade, currencies, error, account, direction, canBridge, recipient, hidden } = props;

  const isValid = !error && canBridge;

  const isXSwap = !(direction.from === '0x1.icon' && direction.to === '0x1.icon');

  const xChainType = getXChainType(direction.from);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();
  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = React.useState<Trade<Currency, Currency, TradeType>>();

  const handleSwap = useCallback(() => {
    if (isXSwap) {
      if ((!account && recipient) || (!account && direction.from === direction.to)) {
        handleConnectWallet(xChainType, xConnectors, xConnect);
      } else if (!account && !recipient) {
        toggleWalletModal();
      } else {
        setExecutionTrade(trade);
        modalActions.openModal(MODAL_ID.XSWAP_CONFIRM_MODAL);
      }
    } else {
      if (!account) {
        toggleWalletModal();
      } else {
        setShowSwapConfirm(true);
        setExecutionTrade(trade);
      }
    }
  }, [
    account,
    toggleWalletModal,
    trade,
    isXSwap,
    recipient,
    direction.from,
    direction.to,
    xChainType,
    xConnectors,
    xConnect,
  ]);

  const { onUserInput } = useSwapActionHandlers();
  // handle swap modal
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);

  const clearSwapInputOutput = useCallback((): void => {
    onUserInput(Field.INPUT, '');
    onUserInput(Field.OUTPUT, '');
  }, [onUserInput]);

  const handleSwapConfirmDismiss = useCallback(
    (clearInputs = true) => {
      setShowSwapConfirm(false);
      clearInputs && clearSwapInputOutput();
    },
    [clearSwapInputOutput],
  );

  return (
    <>
      {isValid ? (
        <Button color="primary" onClick={handleSwap} hidden={hidden}>
          <Trans>Swap</Trans>
        </Button>
      ) : (
        <Button disabled={!account || !!error || !canBridge} color="primary" onClick={handleSwap} hidden={hidden}>
          {error || t`Swap`}
        </Button>
      )}

      <SwapModal
        isOpen={showSwapConfirm}
        onClose={handleSwapConfirmDismiss}
        account={account}
        currencies={currencies}
        executionTrade={executionTrade}
        recipient={recipient || undefined}
      />

      <XSwapModal
        account={account}
        currencies={currencies}
        executionTrade={executionTrade}
        direction={direction}
        recipient={recipient}
        clearInputs={clearSwapInputOutput}
      />
    </>
  );
});

export default SwapCommitButton;
