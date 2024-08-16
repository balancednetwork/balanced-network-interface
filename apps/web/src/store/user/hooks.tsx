import { useCallback, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { Token } from '@balancednetwork/sdk-core';

import { SupportedLocale } from '@/constants/locales';
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS } from '@/constants/routing';
import { useAllTokens } from '@/hooks/Tokens';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { SerializedToken, addSerializedToken, removeSerializedToken, updateUserLocale } from './reducer';

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
