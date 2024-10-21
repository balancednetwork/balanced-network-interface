import { useEffect, useMemo, useState } from 'react';

import { useIconNetworkId } from '@/hooks/useIconNetworkId';
import { Currency, Token, XToken } from '@balancednetwork/sdk-core';

import { BASES_TO_CHECK_TRADES_AGAINST } from '@/constants/routing';
import { TokenAddressMap, useCombinedActiveList } from '@/store/lists/hooks';
import { useUserAddedTokens } from '@/store/user/hooks';
import { isAddress } from '@/utils';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, includeUserAdded: boolean): { [address: string]: Token } {
  const chainId = useIconNetworkId();
  const userAddedTokens = useUserAddedTokens();

  return useMemo(() => {
    if (!chainId) return {};

    // reduce to just tokens
    const mapWithoutUrls = Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>(
      (newMap, address) => {
        newMap[address] = tokenMap[chainId][address].token;
        return newMap;
      },
      {},
    );

    if (includeUserAdded) {
      return (
        userAddedTokens
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<{ [address: string]: Token }>(
            (tokenMap, token) => {
              tokenMap[token.address] = token;
              return tokenMap;
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls },
          )
      );
    }

    return mapWithoutUrls;
  }, [chainId, userAddedTokens, tokenMap, includeUserAdded]);
}

export function useAllTokens(): { [address: string]: Token } {
  const allTokens = useCombinedActiveList();
  return useTokensFromMap(allTokens, true);
}

export function useCommonBases(): { [address: string]: Token } {
  const networkId = useIconNetworkId();

  const bases = useMemo(() => {
    return typeof networkId !== 'undefined' ? BASES_TO_CHECK_TRADES_AGAINST[networkId] ?? [] : [];
  }, [networkId]);

  const basesMap = useMemo(() => {
    return bases.reduce((prev, cur) => {
      prev[cur.address] = cur;
      return prev;
    }, {});
  }, [bases]);

  return basesMap;
}

export function useToken(tokenAddress?: string | null): Token | undefined | null {
  const chainId = useIconNetworkId();

  const tokens = useAllTokens();

  const address = isAddress(tokenAddress);

  const token: Token | undefined = address ? tokens[address] : undefined;

  // name, symbol, decimals
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>();
  useEffect(() => {
    (async () => {
      if (!token && address) {
        setLoading(true);
        try {
          const res = await Promise.all([
            bnJs.getContract(address).name(),
            bnJs.getContract(address).symbol(),
            bnJs.getContract(address).decimals(),
          ]);
          setData(res);
          setLoading(false);
        } catch (e) {
          setData(undefined);
          setLoading(false);
        }
      }
    })();
  }, [address, token]);

  return useMemo(() => {
    if (token) return token;
    if (tokenAddress === null) return null;
    if (!chainId || !address) return undefined;
    if (loading) return null;
    if (data) {
      return new Token(
        chainId,
        address,
        data[2] ? parseInt(data[2], 16) : 0,
        data[1] || 'UNKNOWN',
        data[0] || 'Unknown Token',
      );
    }
    return undefined;
  }, [address, chainId, token, tokenAddress, data, loading]);
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
  const userAddedTokens = useUserAddedTokens();

  if (!currency) {
    return false;
  }

  return !!userAddedTokens.find(token => currency.equals(token));
}

export function useIsTokenActive(token: Token | undefined | null): boolean {
  const activeTokens = useAllTokens();

  if (!activeTokens || !token) {
    return false;
  }

  return !!activeTokens[token.address];
}
