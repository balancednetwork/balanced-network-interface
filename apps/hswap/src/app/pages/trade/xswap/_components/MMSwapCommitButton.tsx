import React, { useState } from 'react';

import { getXChainType, useXAccount } from '@balancednetwork/xwagmi';
import { useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import { XToken } from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';

import { handleConnectWallet } from '@/app/components/WalletConnectModal/WalletItem';
import { BlueButton } from '@/app/components2/Button';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { MMTrade } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
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
  inputError: string | undefined;
}

const MMSwapCommitButton: React.FC<MMSwapCommitButtonProps> = props => {
  const { trade, currencies, account, recipient, direction, hidden, inputError: error } = props;

  const [executionTrade, setExecutionTrade] = useState<MMTrade | undefined>(undefined);

  const xChainType = getXChainType(direction.from);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  const handleSwap = async () => {
    console.log('cool', account, recipient);
    if ((!account && !!recipient) || (!account && direction.from === direction.to)) {
      handleConnectWallet(xChainType, xConnectors, xConnect);
    } else if (!account && !recipient) {
      modalActions.openModal(MODAL_ID.WALLET_CONNECT_MODAL);
    } else {
      setExecutionTrade(trade);
      modalActions.openModal(MODAL_ID.MM_SWAP_CONFIRM_MODAL);
    }
  };

  const outputAccount = useXAccount(getXChainType(currencies[Field.OUTPUT]?.xChainId));

  const btnText = !account
    ? t`Sign in`
    : !error
      ? recipient?.toLowerCase() === outputAccount.address?.toLowerCase()
        ? t`Swap to my wallet`
        : `Swap to address`
      : error;

  return (
    <>
      {!hidden &&
        (!account ? (
          <BlueButton onClick={handleSwap}>
            <Trans>Sign in</Trans>
          </BlueButton>
        ) : (
          <BlueButton disabled={!account || !!error} onClick={handleSwap}>
            {error || btnText}
          </BlueButton>
        ))}

      <MMSwapModal currencies={currencies} account={account} recipient={recipient} trade={executionTrade} />
    </>
  );
};

export default MMSwapCommitButton;
