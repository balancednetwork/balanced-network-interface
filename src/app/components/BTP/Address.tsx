import React, { useState } from 'react';

import { Flex } from 'rebass/styled-components';

import { AssetName as AddressLabel, AssetInput as AddressInput, AssetInfo as AddressInfo } from './AssetToTransfer';
import { Label } from './NetworkSelector';

const Address = () => {
  const [address, setAddress] = useState('');

  const onUserInput = (input: string) => {
    setAddress(input);
  };

  return (
    <>
      <Flex justifyContent={'space-between'}>
        <Label>Address to transfer to</Label>
      </Flex>
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
