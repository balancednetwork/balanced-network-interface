import { Token } from './token';

export type XChainId =
  | 'archway-1'
  | 'archway'
  | '0x1.icon'
  | '0x2.icon'
  | '0xa86a.avax'
  | '0xa869.fuji'
  | '0x100.icon'
  | '0x38.bsc'
  | '0xa4b1.arbitrum'
  | '0x2105.base'
  | 'injective-1'
  | 'sui';

export type XChainType = 'ICON' | 'EVM' | 'ARCHWAY' | 'HAVAH' | 'INJECTIVE' | 'SUI';

export class XToken extends Token {
  xChainId: XChainId;
  identifier: string;

  public constructor(
    xChainId: XChainId,
    chainId: number | string,
    address: string,
    decimals: number,
    symbol: string,
    name?: string,
    identifier?: string,
  ) {
    super(chainId, address, decimals, symbol, name);
    this.xChainId = xChainId;
    this.identifier = identifier || symbol;
  }

  static getXToken(xChainId: XChainId, token: Token) {
    return new XToken(xChainId, token.chainId, token.address, token.decimals, token.symbol, token.name);
  }

  isNativeXToken() {
    return this.address.includes('native');
  }
}
