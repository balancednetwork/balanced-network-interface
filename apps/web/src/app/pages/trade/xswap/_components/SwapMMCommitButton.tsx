import React, { useState } from 'react';

import { CreateIntentOrderPayload, EvmProvider, IntentService } from '@balancednetwork/intents-sdk';
import { Trans } from '@lingui/macro';

import { Button } from '@/app/components/Button';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { MMTrade, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXService } from '@/xwagmi/hooks';
import { XToken } from '@/xwagmi/types/xToken';
import { EvmXService } from '@/xwagmi/xchains/evm';
import MMSwapModal from './MMSwapModal';

interface SwapMMCommitButtonProps {
  trade: MMTrade | undefined;
  currencies: {
    INPUT?: XToken | undefined;
    OUTPUT?: XToken | undefined;
  };
  account: string | undefined;
  recipient: string | undefined | null;
}

const SwapMMCommitButton: React.FC<SwapMMCommitButtonProps> = props => {
  const { independentField } = useSwapState();
  const { trade, currencies, account, recipient } = props;

  const [executionTrade, setExecutionTrade] = useState<MMTrade | undefined>(undefined);

  const handleSwap = async () => {
    if (!account || !recipient || !currencies[Field.INPUT] || !currencies[Field.OUTPUT] || !trade) {
      return;
    }
    console.log('SwapMMCommitButton handleSwap', trade);
    setExecutionTrade(trade);
    modalActions.openModal(MODAL_ID.MM_SWAP_CONFIRM_MODAL);
  };

  return (
    <>
      <Button color="primary" onClick={handleSwap}>
        <Trans>MM Swap</Trans>
      </Button>

      <MMSwapModal currencies={currencies} account={account} recipient={recipient} trade={executionTrade} />
    </>
  );
};

export default SwapMMCommitButton;
