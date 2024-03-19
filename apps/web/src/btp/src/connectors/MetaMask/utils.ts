import { ethers } from 'ethers';

export const toChecksumAddress = (address: string) => {
  // Ethereum address format
  if (address && address.startsWith('0x') && address.length === 42) {
    return ethers.utils.getAddress(address);
  }

  return address;
};

export const toCheckAddress = (address: string) => {
  if (address && (address.startsWith('hx') || address.startsWith('0x')) && address.length === 42) {
    return true;
  }
  return false;
};
