import { handleConnectWallet } from '@/app/components/WalletConnectModal/WalletItem';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccount, useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { validateAddress } from '@/xwagmi/utils';
import { XChainId } from '@balancednetwork/sdk-core';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function RecipientAddressPanel() {
  const { recipient } = useSwapState();
  const { currencies } = useDerivedSwapInfo();

  const isSameChainType =
    currencies[Field.INPUT] &&
    currencies[Field.OUTPUT] &&
    getXChainType(currencies[Field.INPUT].xChainId) === getXChainType(currencies[Field.OUTPUT].xChainId);

  const { onChangeRecipient } = useSwapActionHandlers();

  const xChainType = getXChainType(currencies[Field.OUTPUT]?.xChainId);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  const inputAccount = useXAccount(getXChainType(currencies[Field.INPUT]?.xChainId));
  const outputAccount = useXAccount(getXChainType(currencies[Field.OUTPUT]?.xChainId));

  const inputXChainType = getXChainType(currencies[Field.INPUT]?.xChainId);
  const outputXChainType = getXChainType(currencies[Field.OUTPUT]?.xChainId);

  const handleFillAddress = () => {
    if (outputAccount.address) {
      onChangeRecipient(outputAccount.address);
    } else {
      handleConnectWallet(xChainType, xConnectors, xConnect);
    }
  };

  const [checked, setChecked] = useState(false);

  const enabled = checked || !isSameChainType;

  const [editable, setEditable] = useState(true);

  useEffect(() => {
    const _isSame = inputXChainType === outputXChainType;

    if (_isSame) {
      setChecked(false);
      onChangeRecipient(inputAccount.address || '');
      setEditable(false);
    } else {
      setChecked(true);
      onChangeRecipient('');
      setEditable(true);
    }
  }, [inputXChainType, outputXChainType, inputAccount.address, onChangeRecipient]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setEditable(true);
  }, [checked]);

  return (
    <div className="rounded-xl w-full bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center space-x-2 mb-1">
        <Checkbox
          id="xyz"
          checked={enabled}
          disabled={!isSameChainType}
          onCheckedChange={_checked => {
            if (_checked !== 'indeterminate') {
              setChecked(_checked);
              if (_checked) {
                onChangeRecipient('');
              } else {
                onChangeRecipient(inputAccount.address || '');
              }
            }
          }}
          className="border-light-purple data-[state=checked]:bg-light-purple data-[state=checked]:text-primary"
        />
        <label htmlFor="xyz" className="text-secondary-foreground text-subtitle font-bold select-none cursor-pointer">
          Trade and send to another address
        </label>
      </div>

      {enabled && currencies[Field.OUTPUT]?.xChainId && (
        <AddressInputForm
          xChainId={currencies[Field.OUTPUT]?.xChainId}
          value={recipient || ''}
          onChange={onChangeRecipient}
          onConnect={handleFillAddress}
          editable={editable}
          onEditableChange={setEditable}
        />
      )}
    </div>
  );
}

function AddressInputForm({
  xChainId,
  value,
  onChange,
  onConnect,
  editable,
  onEditableChange,
}: {
  xChainId: XChainId;
  value: string;
  onChange: (addr: string) => void;
  onConnect: () => void;
  editable: boolean;
  onEditableChange: (editable: boolean) => void;
}) {
  // validate address
  const isValidAddress = value.length > 0 && validateAddress(value, xChainId);

  return (
    <>
      <div className="relative bg-background rounded-sm">
        <Input
          id="recipient-address-input"
          placeholder={`Type/Paste ${xChainId} address`}
          // disabled={!editable}
          value={value}
          onChange={e => {
            onChange(e.target.value);
          }}
          onBlur={() => {
            if (isValidAddress) {
              onEditableChange(false);
            }
          }}
          autoFocus
          className="rounded-lg border-none bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
          hidden={!editable}
        />

        {!editable && (
          <button
            type="button"
            className="bg-card absolute left-1 rounded-sm top-1/2 -translate-y-1/2 text-body px-1 py-0.5 flex items-center"
            onClick={() => {
              // make the input focused
              document.getElementById('recipient-address-input')?.focus();
              console.log(document.getElementById('recipient-address-input'));
              onEditableChange(true);
            }}
          >
            {value}
            <button
              type="button"
              className=""
              onClick={e => {
                e.stopPropagation();
                onEditableChange(true);
                onChange('');
                // make the input focused
                document.getElementById('recipient-address-input')?.focus();
              }}
            >
              <X width={20} height={20} />
            </button>
          </button>
        )}
      </div>

      {value.length === 0 ? (
        <div className="text-base">
          <span className="font-bold text-light-purple cursor-pointer select-none" onClick={onConnect}>
            Connect
          </span>
          <span className="text-body text-secondary-foreground"> or Paste recipient address</span>
        </div>
      ) : isValidAddress ? null : (
        <div className="text-body text-warning">Invalid {xChainId} address</div>
      )}
    </>
  );
}
