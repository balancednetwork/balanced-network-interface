import { useMemo } from 'react';

import { Token } from '@balancednetwork/sdk-core';
import { TokenInfo } from '@uniswap/token-lists';

import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { isAddress } from '@/utils';

const alwaysTrue = () => true;

/**
 * Create a filter function to apply to a token for whether it matches a particular search query
 * @param search the search query to apply to the token
 */
export function createTokenFilterFunction<T extends Token | TokenInfo>(search: string): (tokens: T) => boolean {
  const searchingAddress = isAddress(search);

  if (searchingAddress) {
    const lower = searchingAddress.toLowerCase();
    return (t: T) => ('isToken' in t ? searchingAddress === t.address : lower === t.address.toLowerCase());
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter(s => s.length > 0);

  if (lowerSearchParts.length === 0) return alwaysTrue;

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0);

    return lowerSearchParts.every(p => p.length === 0 || sParts.some(sp => sp.indexOf(p) >= 0));
  };

  return ({ name, symbol }: T): boolean => Boolean((symbol && matchesSearch(symbol)) || (name && matchesSearch(name)));
}

export function filterTokens<T extends Token | TokenInfo>(tokens: T[], search: string): T[] {
  return tokens.filter(createTokenFilterFunction(search));
}

export function useSortedTokensByQuery(
  tokens: Token[] | undefined,
  searchQuery: string,
  basedOnWallet: boolean = false,
): Token[] {
  const xWallet = useCrossChainWalletBalances();

  const relevantTokens = useMemo(() => {
    if (!tokens) return [];

    return basedOnWallet
      ? Object.values(xWallet).reduce((heldTokens, xChainWallet) => {
          //tokens held on specific chain
          const tokensHeldOnXChain = Object.values(xChainWallet).map(currencyAmount =>
            tokens.find(token => token.symbol === currencyAmount.currency.symbol),
          );

          //for each held token, add to list if not already there
          tokensHeldOnXChain.forEach(token => {
            if (token && !heldTokens.find(heldToken => heldToken.symbol === token.symbol)) {
              heldTokens.push(token);
            }
          });

          return heldTokens;
        }, [] as Token[])
      : [...tokens];
  }, [tokens, xWallet, basedOnWallet]);

  return useMemo(() => {
    if (relevantTokens.length === 0) {
      return relevantTokens;
    }

    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0);

    if (symbolMatch.length > 1) {
      return relevantTokens;
    }

    const exactMatches: Token[] = [];
    const symbolSubstrings: Token[] = [];
    const rest: Token[] = [];

    // sort tokens by exact match -> substring on symbol match -> rest
    relevantTokens.map(token => {
      if (token.symbol?.toLowerCase() === symbolMatch[0]) {
        return exactMatches.push(token);
      } else if (token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim())) {
        return symbolSubstrings.push(token);
      } else {
        return rest.push(token);
      }
    });

    return [...exactMatches, ...symbolSubstrings, ...rest];
  }, [relevantTokens, searchQuery]);
}
