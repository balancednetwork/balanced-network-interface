import { Currency, CurrencyAmount, XChainId, XToken } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

export type XWalletAssetRecord = {
  baseToken: XToken;
  xTokenAmounts: { [key in XChainId]: CurrencyAmount<XToken> | undefined };
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
  baseToken: XToken;
  positions: XPositions;
  isSingleChain: boolean;
  total?: Position;
};
