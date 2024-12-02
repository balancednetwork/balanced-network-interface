import React, { useState } from 'react';

import { t } from '@lingui/macro';

import { Button } from '@/app/components/Button';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useWalletModalToggle } from '@/store/application/hooks';
import { MMTrade } from '@/store/swap/hooks';
import { getXChainType } from '@/xwagmi/actions';
import { useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { XChainId } from '@/xwagmi/types';
import { XToken } from '@/xwagmi/types/xToken';
import MMSwapModal from './MMSwapModal';

interface SwapMMCommitButtonProps {
  trade: MMTrade | undefined;
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
}

const SwapMMCommitButton: React.FC<SwapMMCommitButtonProps> = props => {
  const { trade, currencies, account, recipient, direction } = props;

  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = useState<MMTrade | undefined>(undefined);

  const xChainType = getXChainType(direction.from);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  let error: string | undefined;
  if (account && !recipient) {
    error = t`Choose address`;
  }

  const handleSwap = async () => {
    if ((!account && recipient) || (!account && direction.from === direction.to)) {
      handleConnectWallet(xChainType, xConnectors, xConnect);
    } else if (!account && !recipient) {
      toggleWalletModal();
    } else {
      setExecutionTrade(trade);
      modalActions.openModal(MODAL_ID.MM_SWAP_CONFIRM_MODAL);
    }
  };

  return (
    <>
      <Button disabled={!!error} color="primary" onClick={handleSwap}>
        {error || t`Swap`}
      </Button>

      <MMSwapModal currencies={currencies} account={account} recipient={recipient} trade={executionTrade} />
    </>
  );
};

export default SwapMMCommitButton;
