import rlp from 'rlp';

import { Currency, CurrencyAmount, Token, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';

import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { NATIVE_ADDRESS } from '@/constants/index';
import { xChainMap, xChains } from '@/constants/xChains';
import { xTokenMap } from '@/constants/xTokens';
import { XChain, XChainId, XToken } from '@/types';
import { uintToBytes } from '@/utils';
import { XCallEventType } from './types';

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

export function getStringFromBytes(bytes: number[]) {
  const buffer = Buffer.from(bytes);
  return buffer.toString('utf8');
}

//TODO: improve this nonsense
export const getFollowingEvent = (event: XCallEventType): XCallEventType => {
  switch (event) {
    case XCallEventType.CallMessageSent:
      return XCallEventType.CallMessage;
    default:
      return XCallEventType.CallMessage;
  }
};

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap[chain].name;
};

export const getXTokenAddress = (chain: XChainId, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;

  return xTokenMap[chain].find(t => t.symbol === tokenSymbol)?.address;
};

export const getXTokenBySymbol = (xChainId: XChainId, symbol?: string) => {
  if (!symbol) return;

  return Object.values(xTokenMap[xChainId]).find(t => t.symbol === symbol);
};

export const getXTokenByToken = (xChainId: XChainId, token: Currency | Token | XToken | undefined) => {
  if (!token) return;

  return Object.values(xTokenMap[xChainId]).find(t =>
    token instanceof XToken ? t.identifier === token.identifier : t.symbol === token.symbol,
  );
};

export const isXToken = (token?: Currency) => {
  if (!token) return false;

  return Object.values(xTokenMap)
    .flat()
    .some(t => t.address === token.wrapped.address);
};

export const getAvailableXChains = (currency?: Currency | XToken | null): XChain[] | undefined => {
  if (!currency) return;

  const allXTokens = Object.values(xTokenMap).flat();

  const xChainIds = allXTokens.filter(t => t.symbol === currency.symbol).map(t => t.xChainId);

  return xChains.filter(x => xChainIds.includes(x.xChainId));
};

export const getXAddress = (xToken: XToken | undefined) => {
  if (!xToken) return undefined;

  return (
    xToken.xChainId +
    '/' +
    (xToken.address === NATIVE_ADDRESS ? '0x0000000000000000000000000000000000000000' : xToken.address)
  );
};

export const toICONDecimals = (currencyAmount: CurrencyAmount<Currency>): bigint => {
  const xAmount = BigInt(currencyAmount.quotient.toString());
  const iconToken = xTokenMap[ICON_XCALL_NETWORK_ID].find(
    token => token.symbol === currencyAmount.currency.symbol,
  ) as XToken;

  if (iconToken.decimals === currencyAmount.currency.decimals) return xAmount;

  const diff = BigInt(iconToken.decimals - currencyAmount.currency.decimals);
  return xAmount * BigInt(10) ** diff;
};
