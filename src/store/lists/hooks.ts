import { TokenList } from '@uniswap/token-lists';

import DEFAULT_TOKEN_LIST from './tokenlist.json';
import { WrappedTokenInfo } from './wrappedTokenInfo';

export type TokenAddressMap = Readonly<{
  [chainId: number]: Readonly<{
    [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList };
  }>;
}>;

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null;

export function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list);
  if (result) return result;

  const map = list.tokens.reduce<TokenAddressMap>((tokenMap, tokenInfo) => {
    const token = new WrappedTokenInfo(tokenInfo, list);
    if (tokenMap[token.chainId]?.[token.address] !== undefined) {
      console.error(new Error(`Duplicate token! ${token.address}`));
      return tokenMap;
    }
    return {
      ...tokenMap,
      [token.chainId]: {
        ...tokenMap[token.chainId],
        [token.address]: {
          token,
          list,
        },
      },
    };
  }, {});
  listCache?.set(list, map);
  return map;
}

export const TRANSFORMED_DEFAULT_TOKEN_LIST = listToTokenMap(DEFAULT_TOKEN_LIST);

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  return TRANSFORMED_DEFAULT_TOKEN_LIST;
}
