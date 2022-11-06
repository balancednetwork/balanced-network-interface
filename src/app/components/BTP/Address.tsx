import React from 'react';

import { AssetName as AddressLabel, AssetInput as AddressInput, AssetInfo as AddressInfo } from './AssetToTransfer';

const Address = ({ onChange, address }) => {
  const onUserInput = (input: string) => {
    onChange(input);
  };

  const { wallet } = window['accountInfo'];

  return (
    <AddressInfo>
      <AddressLabel>Address</AddressLabel>
      <AddressInput
        placeholder={wallet === 'iconex' ? '0x00000...' : 'hx00000...'}
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
