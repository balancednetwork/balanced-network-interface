import { useMemo, useCallback } from 'react';

import { Token } from '@balancednetwork/sdk-core';
import { useIconReact } from 'packages/icon-react';

import { SupportedLocale } from 'constants/locales';
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS } from 'constants/routing';
import { useAllTokens } from 'hooks/Tokens';
import { useAppDispatch, useAppSelector } from 'store/hooks';

import { addSerializedToken, SerializedToken, removeSerializedToken, updateUserLocale } from './actions';

function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  };
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name,
  );
}

export function useUserAddedTokens(): Token[] {
  const { networkId: chainId } = useIconReact();
  const serializedTokensMap = useAppSelector(({ user: { tokens } }) => tokens);

  return useMemo(() => {
    if (!chainId) return [];
    return Object.values(serializedTokensMap?.[chainId] ?? {}).map(deserializeToken);
  }, [serializedTokensMap, chainId]);
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }));
    },
    [dispatch],
  );
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }));
    },
    [dispatch],
  );
}

export function useIsUserAddedToken(token: Token): boolean {
  const userAddedTokens = useUserAddedTokens();

  return !!userAddedTokens.find(t => t.address === token.address);
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { networkId: chainId } = useIconReact();
  const tokens = useAllTokens();

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId]);

  // pairs for every token against every base
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId
        ? Object.keys(tokens).flatMap(tokenAddress => {
            const token = tokens[tokenAddress];
            // for each token on the current chain,
            return (
              // loop though all bases on the current chain
              (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
                // to construct pairs of the given token with each base
                .map(base => {
                  if (base.address === token.address) {
                    return null;
                  } else {
                    return [base, token];
                  }
                })
                .filter((p): p is [Token, Token] => p !== null)
            );
          })
        : [],
    [tokens, chainId],
  );

  // pairs saved by users
  // => nothing

  const combinedList = useMemo(() => generatedPairs.concat(pinnedPairs), [generatedPairs, pinnedPairs]);

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB);
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`;
      if (memo[key]) return memo;
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA];
      return memo;
    }, {});

    return Object.keys(keyed).map(key => keyed[key]);
  }, [combinedList]);
}

export function useUserLocale(): SupportedLocale | null {
  return useAppSelector(state => state.user.userLocale);
}

export function useUserLocaleManager(): [SupportedLocale | null, (newLocale: SupportedLocale) => void] {
  const dispatch = useAppDispatch();
  const locale = useUserLocale();

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      dispatch(updateUserLocale({ userLocale: newLocale }));
    },
    [dispatch],
  );

  return [locale, setLocale];
}
