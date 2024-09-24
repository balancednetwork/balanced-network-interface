import { Currency, CurrencyAmount, Token, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

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
