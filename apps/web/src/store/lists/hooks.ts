import { useMemo, useCallback } from 'react';

import { TokenList } from '@uniswap/token-lists';
import { useDispatch, useSelector } from 'react-redux';

import { AppState } from 'store';

import { changeConfig } from './actions';
import ARCHWAY_DEFAULT_TOKEN_LIST from './archwayTokenlist.json';
import COMMUNITY_TOKEN_LIST from './communitylist.json';
import DEFAULT_TOKEN_LIST from './tokenlist.json';
import { WrappedTokenInfo } from './wrappedTokenInfo';

export function useTokenListConfig(): AppState['lists'] {
  return useSelector((state: AppState) => state.lists);
}

export function useChangeCommunityConfig() {
  const dispatch = useDispatch();
  return useCallback((value: boolean) => dispatch(changeConfig({ community: value })), [dispatch]);
}

export type TokenAddressMap = Readonly<{
  [chainId: number]: Readonly<{
    [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList };
  }>;
}>;

export const ArchToICONNetworkMap: { [key: string]: number } = {
  'archway-1': 1,
  'constantine-3': 7,
};

export const ICONToArchNetworkMap: { [key: number]: string } = {
  1: 'archway-1',
  2: 'constantine-3',
  7: 'constantine-3',
};

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
export const TRANSFORMED_COMBINED_TOKEN_LIST = listToTokenMap(COMMUNITY_TOKEN_LIST);

export const ARCHWAY_TRANSFORMED_DEFAULT_TOKEN_LIST = listToTokenMap(ARCHWAY_DEFAULT_TOKEN_LIST);

Object.keys(TRANSFORMED_DEFAULT_TOKEN_LIST).forEach(chain => {
  if (!TRANSFORMED_COMBINED_TOKEN_LIST[chain]) TRANSFORMED_COMBINED_TOKEN_LIST[chain] = {};
  Object.keys(TRANSFORMED_DEFAULT_TOKEN_LIST[chain]).forEach(cx => {
    TRANSFORMED_COMBINED_TOKEN_LIST[chain][cx] = { ...TRANSFORMED_DEFAULT_TOKEN_LIST[chain][cx] };
  });
});

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  const tokenListConfig = useTokenListConfig();

  return useMemo(() => {
    return tokenListConfig.community ? TRANSFORMED_COMBINED_TOKEN_LIST : TRANSFORMED_DEFAULT_TOKEN_LIST;
  }, [tokenListConfig]);
}
