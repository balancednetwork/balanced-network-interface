import invariant from 'tiny-invariant';

import { validateAndParseAddress } from '../utils/validateAndParseAddress';
import { BaseCurrency } from './baseCurrency';
import { Currency } from './currency';

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends BaseCurrency {
  public readonly isNative: false = false;
  public readonly isToken: true = true;

  /**
   * The contract address on the chain on which this token lives
   */
  public readonly address: string;

  public constructor(chainId: number | string, address: string, decimals: number, symbol: string, name?: string) {
    super(chainId, decimals, symbol, name);
    this.address = validateAndParseAddress(address);
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  public equals(other: Currency): boolean {
    return other.isToken && this.chainId === other.chainId && this.address === other.address;
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  public sortsBefore(other: Token): boolean {
    invariant(this.chainId === other.chainId, 'CHAIN_IDS');
    invariant(this.address !== other.address, 'ADDRESSES');
    // return this.address.toLowerCase() < other.address.toLowerCase();
    return true;
  }

  /**
   * Return this token, which does not need to be wrapped
   */
  public get wrapped(): Token {
    return this;
  }

  /**
   * Return this token, which does not need to be unwrapped
   */
  public get unwrapped(): Token {
    return this;
  }

  public get isNativeToken() {
    const nativeAddresses = [
      'cx0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      'inj',
      '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
      'hx0000000000000000000000000000000000000000',
      '11111111111111111111111111111111', // solana
      'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA', // stellar,
    ];

    return nativeAddresses.includes(this.address);
  }
}
