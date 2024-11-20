import { handleConnectWallet } from '@/app/components/WalletConnectModal/WalletItem';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { shortenAddress } from '@/utils';
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
      setEditable(false);
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
    <div className="w-full p-4 flex flex-col gap-2">
      <div className="flex items-center justify-center gap-3 mb-1">
        <label
          htmlFor="send-to-another-address"
          className="text-[#695682] text-[12px] font-medium select-none cursor-pointer"
        >
          Send to another address
        </label>
        <Checkbox
          id="send-to-another-address"
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
          className="border-light-purple data-[state=checked]:bg-light-purple data-[state=checked]:text-primary rounded-full"
        />
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
  const outputAccount = useXAccount(getXChainType(xChainId));

  return (
    <>
      <div className="relative border-4 border-[#695682]/30 rounded-full">
        <Input
          id="recipient-address-input"
          placeholder={`Add ${xChainId} address`}
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
          className={cn(
            'py-0 h-6 rounded-full bg-transparent border-none px-2 focus-visible:ring-0 focus-visible:ring-offset-0 font-me text-[10px] text-center',
            editable ? 'w-full' : 'w-0',
          )}
          autoComplete="off"
        />

        {!editable && (
          <button
            type="button"
            className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[10px] px-1 py-0.5 flex items-center"
            onClick={() => {
              // make the input focused
              document.getElementById('recipient-address-input')?.focus();
              console.log(document.getElementById('recipient-address-input'));
              onEditableChange(true);
            }}
          >
            {shortenAddress(value)}
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
              <X width={14} height={14} />
            </button>
          </button>
        )}
      </div>

      {value.length === 0 ? (
        <div className="text-base">
          {/* <span className="font-bold text-light-purple cursor-pointer select-none" onClick={onConnect}>
            {outputAccount.address ? 'Autofill' : 'Connect'}
          </span> */}
          <span className="text-[12px] font-bold text-light-purple"> or connect your {xChainId} wallet</span>
        </div>
      ) : isValidAddress ? null : (
        <div className="font-bold text-[12px] text-warning text-center">Invalid {xChainId} address</div>
      )}
    </>
  );
}
