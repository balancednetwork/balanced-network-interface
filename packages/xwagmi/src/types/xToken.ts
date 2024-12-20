import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { XChainId } from './xChain';

export class XToken extends Token {
  xChainId: XChainId;
  identifier: string;
  spokeVersion?: string;

  public constructor(
    xChainId: XChainId,
    chainId: number | string,
    address: string,
    decimals: number,
    symbol: string,
    name?: string,
    identifier?: string,
    spokeVersion?: string,
  ) {
    super(chainId, address, decimals, symbol, name);
    this.xChainId = xChainId;
    this.identifier = identifier || symbol;
    this.spokeVersion = spokeVersion;
  }

  static getXToken(xChainId: XChainId, token: Token) {
    return new XToken(xChainId, token.chainId, token.address, token.decimals, token.symbol, token.name);
  }

  get id(): string {
    return `${this.xChainId}/${this.address}`;
  }
}

export type XWalletAssetRecord = {
  baseToken: Token;
  xTokenAmounts: { [key in XChainId]: CurrencyAmount<Currency> | undefined };
  isBalanceSingleChain: boolean;
  total: BigNumber;
  value: BigNumber | undefined;
};

export type Position = {
  collateral: CurrencyAmount<Currency> | undefined;
  loan: BigNumber;
  isPotential?: boolean;
};

export type XPositions = { [CurrencyKey in string]: Partial<{ [key in XChainId]: Position }> };

export type XPositionsRecord = {
  baseToken: Token;
  positions: XPositions;
  isSingleChain: boolean;
  total?: Position;
};
