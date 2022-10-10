import React, { useState } from 'react';

import { AssetName as AddressLabel, AssetInput as AddressInput, AssetInfo as AddressInfo } from './AssetToTransfer';

const Address = ({ onChange }) => {
  const [address, setAddress] = useState('');

  const onUserInput = (input: string) => {
    setAddress(input);
    onChange(input);
  };

  return (
    <>
      <AddressInfo>
        <AddressLabel>Address</AddressLabel>
        <AddressInput
          placeholder="hx28c08b299995a88756af64374e13db2240bc3142"
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
    </>
  );
};

export default Address;
