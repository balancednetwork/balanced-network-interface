import React, { useState } from 'react';

import { t } from '@lingui/macro';

import { Button } from '@/app/components/Button';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useWalletModalToggle } from '@/store/application/hooks';
import { MMTrade, useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { StellarAccountValidation, getXChainType } from '@balancednetwork/xwagmi';
import { useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import { XToken } from '@balancednetwork/xwagmi';
import MMSwapModal from './MMSwapModal';

interface MMSwapCommitButtonProps {
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
  hidden: boolean;
  stellarValidation?: StellarAccountValidation;
}

const UseMMDerivedInfo = (
  trade: MMTrade | undefined,
  account: string | undefined,
  recipient: string | undefined | null,
  currencies: {
    INPUT?: XToken | undefined;
    OUTPUT?: XToken | undefined;
  },
) => {
  let error: string | undefined;
  const { currencyBalances, parsedAmount } = useDerivedSwapInfo();

  if (account && !parsedAmount) {
    error = error ?? t`Enter amount`;
  }

  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade?.inputAmount];

  // decimal scales are different for different chains for the same token
  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    error = error ?? t`Insufficient ${currencies[Field.INPUT]?.symbol}`;
  }

  if (account && !recipient) {
    error = error ?? t`Choose address`;
  }

  return { error };
};

const MMSwapCommitButton: React.FC<MMSwapCommitButtonProps> = props => {
  const { trade, currencies, account, recipient, direction, hidden, stellarValidation } = props;
  const { error } = UseMMDerivedInfo(trade, account, recipient, currencies);

  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = useState<MMTrade | undefined>(undefined);

  const xChainType = getXChainType(direction.from);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

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
      <Button
        disabled={!!error || stellarValidation?.ok === false}
        color="primary"
        onClick={handleSwap}
        hidden={hidden}
      >
        {error || t`Swap`}
      </Button>

      <MMSwapModal currencies={currencies} account={account} recipient={recipient} trade={executionTrade} />
    </>
  );
};

export default MMSwapCommitButton;
