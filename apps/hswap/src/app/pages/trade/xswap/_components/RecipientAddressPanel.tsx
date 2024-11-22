import { handleConnectWallet } from '@/app/components/WalletConnectModal/WalletItem';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { shortenAddress } from '@/utils';
import { getXChainType } from '@/xwagmi/actions';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXAccount, useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { XChainId } from '@/xwagmi/types';
import { validateAddress } from '@/xwagmi/utils';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const getChainName = (xChainId?: XChainId) => {
  if (!xChainId) return '';

  return xChainMap[xChainId].name;
};

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
    if (outputAccount.address) {
      setChecked(false);
      onChangeRecipient(outputAccount.address || '');
      setEditable(false);
    } else {
      setChecked(false);
      onChangeRecipient('');
      setEditable(true);
    }
  }, [onChangeRecipient, outputAccount.address]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setEditable(true);
  }, [checked]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-center gap-3 mb-1">
        <label
          htmlFor="send-to-another-address"
          className="text-[#695682] text-sm font-medium select-none cursor-pointer"
        >
          Send to another address
        </label>
        <Checkbox
          id="send-to-another-address"
          checked={checked}
          onCheckedChange={_checked => {
            if (_checked !== 'indeterminate') {
              setChecked(_checked);
              if (_checked) {
                onChangeRecipient('');
              } else {
                onChangeRecipient(outputAccount.address || '');
              }
            }
          }}
          className="border-light-purple data-[state=checked]:bg-light-purple data-[state=checked]:text-primary rounded-full border-2"
        />
      </div>
      {checked && currencies[Field.OUTPUT]?.xChainId && (
        <AddressInputForm
          xChainId={currencies[Field.OUTPUT]?.xChainId}
          value={recipient || ''}
          onChange={onChangeRecipient}
          onConnect={handleFillAddress}
          editable={editable}
          onEditableChange={setEditable}
        />
      )}

      {!outputAccount.address && !checked && (
        <Button
          className="group bg-[#695682]/30 hover:bg-[#695682]/50 rounded-full w-fit self-center h-[37px]"
          onClick={handleFillAddress}
        >
          <span className="text-[#E6E0F7] group-hover:text-title-gradient font-bold text-sm">Or connect a wallet</span>
        </Button>
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
      <div className="relative border-4 border-[#695682]/30 rounded-full h-[37px]">
        <Input
          id="recipient-address-input"
          placeholder={`Add ${getChainName(xChainId)} address`}
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
            'py-0 h-7 rounded-full bg-transparent border-none px-2 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium text-sm text-center',
            editable ? 'w-full' : 'w-0',
          )}
          autoComplete="off"
        />

        {!editable && (
          <button
            type="button"
            className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-sm px-1 py-0.5 flex items-center"
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
              className="ml-1"
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

      {!(value.length === 0 || isValidAddress) && (
        <div className="font-bold text-sm text-warning text-center">Invalid {getChainName(xChainId)} address</div>
      )}
    </>
  );
}
