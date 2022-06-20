import { ethers } from 'ethers';

export const toChecksumAddress = address => {
  // Ethereum address format
  if (address && address.startsWith('0x') && address.length === 42) {
    return ethers.utils.getAddress(address);
  }

  return address;
};

export const toCheckAddress = address => {
  if (address && address.startsWith('hx') && address.length === 42) {
    return true;
  }
  return false;
};
