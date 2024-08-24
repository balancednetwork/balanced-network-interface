import React, { useCallback, useEffect, useState } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';

import useLast from '@/hooks/useLast';

import { XChainId } from '@/types';
import Modal from '../Modal';
import { PopperWithoutArrow } from '../Popover';
import { CurrencySearch, CurrencySelectionType, SelectorType } from './CurrencySearch';
import { ImportToken } from './ImportToken';
import { RemoveToken } from './RemoveToken';

interface CurrencySearchModalProps {
  account?: string | null;
  isOpen: boolean;
  onDismiss: () => void;
  selectedCurrency?: Currency | null;
  onCurrencySelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
  showCrossChainBreakdown: boolean;
  otherSelectedCurrency?: Currency | null;
  showCurrencyAmount?: boolean;
  currencySelectionType?: CurrencySelectionType;
  disableNonToken?: boolean;
  width?: number;
  anchorEl?: any;
  showCommunityListControl: boolean;
  xChainId: XChainId;
  selectorType?: SelectorType;
}

export enum CurrencyModalView {
  search,
  manage,
  importToken,
  removeToken,
  importList,
}

export default function CurrencySearchModal({
  account,
  isOpen,
  onDismiss,
  onCurrencySelect,
  onChainSelect,
  selectedCurrency,
  otherSelectedCurrency,
  currencySelectionType = CurrencySelectionType.NORMAL,
  showCurrencyAmount = true,
  disableNonToken = false,
  width,
  anchorEl,
  showCommunityListControl,
  showCrossChainBreakdown,
  xChainId,
  selectorType,
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.manage);
  const lastOpen = useLast(isOpen);

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search);
    }
  }, [isOpen, lastOpen]);

  // used for import token flow
  const [importToken, setImportToken] = useState<Token | undefined>();

  // used for remove token flow
  const [removeToken, setRemoveToken] = useState<Token | undefined>();

  const showImportView = useCallback(() => {
    setModalView(CurrencyModalView.importToken);
    onDismiss();
  }, [onDismiss]);
  const closeImportView = useCallback(() => {
    setModalView(CurrencyModalView.search);
  }, []);
  const showRemoveView = useCallback(() => {
    setModalView(CurrencyModalView.removeToken);
    onDismiss();
  }, [onDismiss]);
  const closeRemoveView = useCallback(() => {
    setModalView(CurrencyModalView.search);
  }, []);
  const showManageView = useCallback(() => setModalView(CurrencyModalView.manage), []);

  const handleCurrencySelect = useCallback(
    (currency: Currency, setDefaultChain = true) => {
      onCurrencySelect(currency, setDefaultChain);
      onDismiss();
      closeImportView();
    },
    [onDismiss, onCurrencySelect, closeImportView],
  );

  return (
    <>
      <PopperWithoutArrow
        show={isOpen}
        anchorEl={anchorEl}
        placement="bottom"
        offset={
          selectorType === SelectorType.SWAP_IN ||
          selectorType === SelectorType.SWAP_OUT ||
          selectorType === SelectorType.SUPPLY_QUOTE
            ? [0, 35]
            : [0, 10]
        }
      >
        <CurrencySearch
          account={account}
          isOpen={isOpen}
          onDismiss={onDismiss}
          onCurrencySelect={handleCurrencySelect}
          onChainSelect={onChainSelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          currencySelectionType={currencySelectionType}
          showCurrencyAmount={showCurrencyAmount}
          disableNonToken={disableNonToken}
          showImportView={showImportView}
          setImportToken={setImportToken}
          showRemoveView={showRemoveView}
          setRemoveToken={setRemoveToken}
          showManageView={showManageView}
          width={width}
          showCommunityListControl={showCommunityListControl}
          xChainId={xChainId}
          showCrossChainBreakdown={showCrossChainBreakdown}
          selectorType={selectorType}
        />
      </PopperWithoutArrow>

      <Modal isOpen={modalView === CurrencyModalView.importToken} onDismiss={closeImportView}>
        <ImportToken
          tokens={importToken ? [importToken] : []}
          onDismiss={closeImportView}
          handleCurrencySelect={handleCurrencySelect}
        />
      </Modal>

      <Modal isOpen={modalView === CurrencyModalView.removeToken} onDismiss={closeRemoveView}>
        <RemoveToken tokens={removeToken ? [removeToken] : []} onDismiss={closeRemoveView} />
      </Modal>
    </>
  );
}
