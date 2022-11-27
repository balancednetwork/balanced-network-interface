import React from 'react';

import { useToNetwork } from 'btp/src/store/bridge/hooks';

import { AssetName as AddressLabel, AssetInput as AddressInput, AssetInfo as AddressInfo } from './AssetToTransfer';

const Address = ({ onChange, address }) => {
  const onUserInput = (input: string) => {
    onChange(input);
  };

  const toNetwork = useToNetwork();

  return (
    <AddressInfo>
      <AddressLabel isDisabled>Address</AddressLabel>
      <AddressInput
        placeholder={`${toNetwork.label || 'Recipient'} address`}
        value={address}
        // onClick={() => setIsActive(!isActive)}
        // onBlur={() => setIsActive(false)}
        onChange={event => {
          onUserInput(event.target.value);
        }}
        title="Address"
        autoComplete="off"
        autoCorrect="off"
        type="text"
        spellCheck="false"
      ></AddressInput>
    </AddressInfo>
  );
};

export default Address;
