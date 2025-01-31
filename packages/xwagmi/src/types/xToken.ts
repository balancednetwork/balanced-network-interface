import { Currency, CurrencyAmount, Token, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

export class XToken extends Token {
  xChainId: XChainId;
  identifier: string;
  spokeVersion?: string;

  static wICX = new XToken(
    '0x1.icon',
    1,
    'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d',
    18,
    'wICX',
    'Wrapped ICX',
    'wICX',
  );

  static ICX = new XToken('0x1.icon', '0x1.icon', 'cx0000000000000000000000000000000000000000', 18, 'ICX', 'ICX');

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

  // TODO: deprecate
  static getXToken(xChainId: XChainId, token: Token) {
    return new XToken(xChainId, token.chainId, token.address, token.decimals, token.symbol, token.name);
  }

  get id(): string {
    return `${this.xChainId}/${this.address}`;
  }

  /**
   * Return this token, which does not need to be wrapped
   */
  public get wrapped(): XToken {
    if (this.symbol === 'ICX') return XToken.wICX;
    else return this;
  }

  /**
   * Return this token, which does not need to be unwrapped
   */
  public get unwrapped(): XToken {
    if (this.symbol === 'wICX') return XToken.ICX;
    else return this;
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
