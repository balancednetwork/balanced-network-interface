import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccount, useXConnect, useXConnectors } from '@/xwagmi/hooks';
import React from 'react';

export default function RecipientAddressPanel() {
  const { recipient } = useSwapState();
  const { currencies } = useDerivedSwapInfo();
  const { onChangeRecipient } = useSwapActionHandlers();

  const xChainType = getXChainType(currencies[Field.OUTPUT]?.xChainId);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  const xAccount = useXAccount(xChainType);

  const handleFillAddress = () => {
    if (xAccount.address) {
      onChangeRecipient(xAccount.address);
    } else {
      handleConnectWallet(xChainType, xConnectors, xConnect);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Input recipient address"
        value={recipient || ''}
        onChange={e => {
          onChangeRecipient(e.target.value);
        }}
      />
      <Button className="rounded-full" onClick={handleFillAddress}>
        A
      </Button>
    </div>
  );
}
