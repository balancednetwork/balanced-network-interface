import { xChainMap } from '@/constants/xChains';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { bech32 } from 'bech32';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { Validator } from 'icon-sdk-js';
import { XChainId } from '../types';
import { SolanaXService } from '../xchains/solana';
import { isStellarAddress } from '../xchains/stellar/utils';

const { isEoaAddress, isScoreAddress } = Validator;

const isBech32 = (string: string) => {
  try {
    bech32.decode(string);
    return true;
  } catch (error) {
    return false;
  }
};

const isArchEoaAddress = (address: string) => {
  return isBech32(address) && address.startsWith('archway');
};

const isInjectiveAddress = (address: string) => {
  return isBech32(address) && address.startsWith('inj');
};

// Function to get the last i bytes of an integer
function lastBytesOf(x: bigint, i: number): Uint8Array {
  const buffer = new ArrayBuffer(i);
  const view = new DataView(buffer);
  for (let j = 0; j < i; j++) {
    view.setUint8(j, Number((x >> BigInt(8 * (i - j - 1))) & BigInt(0xff)));
  }
  return new Uint8Array(buffer);
}

// Function to convert an unsigned integer to bytes
export function uintToBytes(x: bigint): Uint8Array {
  if (x === BigInt(0)) {
    return new Uint8Array([0]);
  }
  let right = BigInt(0x80);
  for (let i = 1; i < 32; i++) {
    if (x < right) {
      return lastBytesOf(x, i);
    }
    right <<= BigInt(8);
  }
  if (x < right) {
    return RLP.encode(x);
  } else {
    const data = RLP.encode(x);
    data[0] = 0;
    return data;
  }
}

export function formatBigNumber(value: BigNumber | undefined, type: 'currency' | 'ratio' | 'input' | 'price') {
  if (value === undefined || value.isNaN() || value.isEqualTo(0)) {
    return '0';
  } else {
    switch (type) {
      case 'currency': {
        if (value.isLessThan(new BigNumber(0.00001)) && value.isGreaterThanOrEqualTo(new BigNumber(0))) {
          return value.dp(8, BigNumber.ROUND_DOWN).toFormat();
        } else {
          return value.dp(5, BigNumber.ROUND_DOWN).toFormat();
        }
      }
      case 'input': {
        if (value.decimalPlaces() === 0) {
          return value.toFixed(0, BigNumber.ROUND_UP);
        } else if (value.isLessThan(new BigNumber(1))) {
          return value.precision(2, BigNumber.ROUND_DOWN).toString();
        } else {
          return value.toFixed(2, BigNumber.ROUND_DOWN);
        }
      }
      case 'ratio': {
        if (value.decimalPlaces() === 0) {
          return value.toFormat(0, BigNumber.ROUND_UP);
        } else {
          return value.toFixed(4, BigNumber.ROUND_DOWN);
        }
      }
      case 'price': {
        return value.dp(4).toFormat();
      }
    }
  }
}

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap[chain].name;
};

export const ONE_DAY_DURATION = 86400000;

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function toDec(value?: CurrencyAmount<Currency> | CurrencyAmount<Token>): string {
  return value ? value.quotient.toString() : '0';
}

export const showMessageOnBeforeUnload = e => {
  e.preventDefault();
  window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  e.returnValue = 'Your transaction will be canceled, and you’ll need to sign in again.';
  return e.returnValue;
};

function isSuiAddress(address: string) {
  // Check if the address starts with '0x'
  if (typeof address !== 'string' || !address.startsWith('0x')) {
    return false;
  }

  // Remove the '0x' prefix
  const hexPart = address.slice(2);

  // Check if the length is exactly 64 characters (32 bytes in hex)
  if (hexPart.length !== 64) {
    return false;
  }

  // Check if all characters are valid hexadecimal digits
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(hexPart)) {
    return false;
  }

  return true;
}

function isSolanaAddress(address) {
  try {
    const publicKey = new PublicKey(address);
    return PublicKey.isOnCurve(publicKey);
  } catch (error) {
    return false;
  }
}

async function isSolanaWalletAddress(address) {
  try {
    const solanaXService = SolanaXService.getInstance();
    // Validate the address
    const publicKey = new PublicKey(address);

    // Check if the address is on-curve
    const isOnCurve = PublicKey.isOnCurve(publicKey.toBytes());
    if (!isOnCurve) {
      return false; // Off-curve addresses cannot be wallet addresses
    }

    // Establish a connection to the Solana cluster
    const connection = solanaXService.connection;

    // Fetch account information
    const accountInfo = await connection.getAccountInfo(publicKey);

    if (accountInfo === null) {
      // If the account doesn't exist but is on-curve, it's likely a wallet address
      return true;
    } else {
      // Check if the account is owned by the Token Program
      if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        return false; // It's a token account
      } else {
        return true; // It's a wallet address
      }
    }
  } catch (error) {
    // If an error occurs (e.g., invalid address), return false
    console.error('Error checking address:', error);
    return false;
  }
}

export async function validateAddress(address: string, chainId: XChainId): Promise<boolean> {
  switch (xChainMap[chainId].xChainType) {
    case 'ICON':
    case 'HAVAH':
      return isScoreAddress(address) || isEoaAddress(address);
    case 'EVM':
      return ethers.utils.isAddress(address);
    case 'ARCHWAY':
      return isArchEoaAddress(address);
    case 'INJECTIVE':
      return isInjectiveAddress(address);
    case 'STELLAR':
      return isStellarAddress(address);
    case 'SUI':
      return isSuiAddress(address);
    case 'SOLANA':
      return await isSolanaWalletAddress(address);
  }
}

export const getTrackerLink = (
  xChainId: XChainId,
  data: string,
  type: 'transaction' | 'address' | 'block' | 'contract' = 'transaction',
) => {
  const tracker = xChainMap[xChainId].tracker;

  switch (type) {
    case 'transaction': {
      return `${tracker.tx}/${data}`;
    }
    case 'address': {
      return ``;
    }
    case 'block': {
      return ``;
    }
    default: {
      return ``;
    }
  }
};
