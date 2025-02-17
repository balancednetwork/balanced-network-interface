import React, { useEffect } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';
import { XChainId } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { List1 } from '@/app/components/List';
import useKeyPress from '@/hooks/useKeyPress';
import useSortCurrency from '@/hooks/useSortCurrency';
import { useHasSignedIn } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { toFraction } from '@/utils';
import CurrencyRow from './CurrencyRow';
import { CurrencySelectionType } from './CurrencySearch';
import { HeaderText } from './styleds';

const DashGrid = styled(Box)`
  display: grid;
  gap: 1em;
  align-items: center;
  grid-template-columns: repeat(2, 1fr);

  > * {
    justify-content: flex-end;
    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

const StyledHeaderText = styled(HeaderText)`
  font-size: 12px;
`;

export default function CurrencyList({
  currencies,
  showCrossChainBreakdown = true,
  onCurrencySelect,
  onChainSelect,
  showRemoveView,
  setRemoveToken,
  isOpen,
  onDismiss,
  selectedChainId,
  basedOnWallet,
  width,
  currencySelectionType,
  filterState,
}: {
  currencies: Currency[];
  showCrossChainBreakdown: boolean;
  onCurrencySelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
  showRemoveView: () => void;
  setRemoveToken: (token: Token) => void;
  isOpen: boolean;
  onDismiss: () => void;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
  width?: number;
  currencySelectionType: CurrencySelectionType;
  filterState: XChainId[];
}) {
  const handleEscape = useKeyPress('Escape');
  const hasSignedIn = useHasSignedIn();
  const isSwapSelector =
    currencySelectionType === CurrencySelectionType.TRADE_IN ||
    currencySelectionType === CurrencySelectionType.TRADE_OUT;

  const rates = useRatesWithOracle();
  const rateFracs = React.useMemo(() => {
    if (rates) {
      return Object.keys(rates).reduce((acc, key) => {
        acc[key] = toFraction(rates[key]);
        return acc;
      }, {});
    }
  }, [rates]);

  const { sortBy, handleSortSelect, sortData } = useSortCurrency({ key: 'symbol', order: 'ASC' }, selectedChainId);
  const sortedCurrencies = React.useMemo(() => {
    if (currencies && rateFracs) {
      return sortData(currencies, rateFracs);
    }
    return currencies;
  }, [currencies, rateFracs, sortData]);

  useEffect(() => {
    if (isOpen && handleEscape) {
      onDismiss();
    }
  }, [isOpen, handleEscape, onDismiss]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (basedOnWallet || (!isSwapSelector && hasSignedIn)) {
      handleSortSelect({
        key: 'value',
        order: 'DESC',
      });
    } else {
      handleSortSelect({
        key: 'symbol',
        order: 'ASC',
      });
    }
  }, [basedOnWallet, hasSignedIn]);

  const isWallet = isSwapSelector ? hasSignedIn && basedOnWallet : hasSignedIn;
  const secondColumnSortKey = isWallet ? 'value' : 'price';
  const content = isWallet ? <Trans>Wallet</Trans> : <Trans>Price</Trans>;

  return (
    <List1 mt={3}>
      <DashGrid style={{ width: width ? `${width - 50}px` : 'auto' }}>
        <StyledHeaderText
          role="button"
          className={sortBy.key === 'symbol' ? sortBy.order : ''}
          onClick={() =>
            handleSortSelect({
              key: 'symbol',
            })
          }
        >
          <span>
            <Trans>Asset</Trans>
          </span>
        </StyledHeaderText>
        <StyledHeaderText
          role="button"
          className={sortBy.key === secondColumnSortKey ? sortBy.order : ''}
          onClick={() => handleSortSelect({ key: secondColumnSortKey })}
        >
          {content}
        </StyledHeaderText>
      </DashGrid>

      {sortedCurrencies?.map(currency => (
        <CurrencyRow
          key={currency.address}
          currency={currency}
          onSelect={onCurrencySelect}
          onChainSelect={onChainSelect}
          onRemove={() => {
            setRemoveToken(currency as Token);
            showRemoveView();
          }}
          rateFracs={rateFracs}
          selectedChainId={selectedChainId}
          showCrossChainBreakdown={showCrossChainBreakdown}
          basedOnWallet={basedOnWallet}
          width={width}
          filterState={filterState}
          currencySelectionType={currencySelectionType}
        />
      ))}
    </List1>
  );
}
