import { ethers } from 'ethers';
import IconService from 'icon-sdk-js';

export const toChecksumAddress = address => {
  // Ethereum address format
  if (address && address.startsWith('0x') && address.length === 42) {
    return ethers.utils.getAddress(address);
  }

  return address;
};

export const convertToICX = balance => {
  return IconService.IconAmount.of(balance, IconService.IconAmount.Unit.LOOP)
    .convertUnit(IconService.IconAmount.Unit.ICX)
    .toString();
};

export const resetTransferStep = () => {
  const event = new Event('SUCCESS_TRANSACTION');
  document.dispatchEvent(event);
};

export const roundNumber = (num, digit = 2) => {
  if (!num) return 0;
  return +(Math.round(num + `e+${digit}`) + `e-${digit}`);
};
