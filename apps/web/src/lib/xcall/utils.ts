import rlp from 'rlp';

import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';

import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { xChains } from '@/constants/xChains';
import { xTokenMap } from '@/constants/xTokens';
import { XChain, XChainId, XToken } from '@/types';
import { uintToBytes } from '@/utils';

export function getBytesFromNumber(value) {
  const hexString = value.toString(16).padStart(2, '0');
  return Buffer.from(hexString.length % 2 === 1 ? '0' + hexString : hexString, 'hex');
}

export function getBytesFromAddress(address) {
  // f8 is hardcoded, it will be replaced after rlp encoded, because rlp package doesn't support encoding null.
  //  rlpEncodedDataStr = rlpEncodedDataStr.replaceAll('c30181f8', 'c301f800');

  return Buffer.from(address?.replace('cx', '01') ?? 'f8', 'hex');
}

export function getRlpEncodedMsg(msg: string | any[]) {
  return Array.from(rlp.encode(msg));
}

export function getRlpEncodedSwapData(
  executionTrade: Trade<Currency, Currency, TradeType>,
  method?: string,
  receiver?: string,
  minReceived?: CurrencyAmount<Currency>,
): Buffer {
  const encodedComponents: any = [];
  if (method) {
    encodedComponents.push(Buffer.from(method, 'utf-8'));
  }
  if (receiver) {
    encodedComponents.push(Buffer.from(receiver, 'utf-8'));
  }
  if (minReceived) {
    encodedComponents.push(uintToBytes(minReceived.quotient));
  }

  const routeActionPathEncoding = executionTrade.route.routeActionPath.map(action => [
    getBytesFromNumber(action.type),
    getBytesFromAddress(action.address),
  ]);

  const rlpEncodedData = Buffer.from(getRlpEncodedMsg([...encodedComponents, ...routeActionPathEncoding]));

  let rlpEncodedDataStr = rlpEncodedData.toString('hex');
  rlpEncodedDataStr = rlpEncodedDataStr.replaceAll('c30181f8', 'c301f800');

  const rlpEncodedDataBuffer = Buffer.from(rlpEncodedDataStr, 'hex');

  return rlpEncodedDataBuffer;
}

export function getBytesFromString(str: string) {
  return Array.from(Buffer.from(str, 'utf8'));
}

export const toICONDecimals = (currencyAmount: CurrencyAmount<Currency>): bigint => {
  const xAmount = BigInt(currencyAmount.quotient.toString());
  const iconToken = xTokenMap[ICON_XCALL_NETWORK_ID].find(
    token => token.symbol === currencyAmount.currency.symbol,
  ) as XToken;

  if (iconToken.decimals === currencyAmount.currency.decimals) return xAmount;

  const diff = BigInt(iconToken.decimals - currencyAmount.currency.decimals);
  return xAmount * BigInt(10) ** diff;
};

export const getSupportedXChainIdsForToken = (currency: Currency | XToken): XChainId[] => {
  return Object.values(xTokenMap)
    .flat()
    .filter(t => t.symbol === currency?.symbol)
    .map(t => t.xChainId);
};

export const getSupportedXChainForToken = (currency?: Currency | XToken | null): XChain[] | undefined => {
  if (!currency) return;

  const xChainIds = getSupportedXChainIdsForToken(currency) || [];

  return xChains.filter(x => xChainIds.includes(x.xChainId));
};
