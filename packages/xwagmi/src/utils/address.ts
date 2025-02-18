import { xChainMap } from '@/constants/xChains';
import { XChainId } from '@balancednetwork/sdk-core';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { bech32 } from 'bech32';
import { ethers } from 'ethers';
import { Validator } from 'icon-sdk-js';
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

export async function isAccountNonExistent(address) {
  try {
    const solanaXService = SolanaXService.getInstance();
    const publicKey = new PublicKey(address);
    const connection = solanaXService.connection;
    const accountInfo = await connection.getAccountInfo(publicKey);
    return accountInfo === null;
  } catch (error) {
    console.error('Error checking account existence:', error);
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
