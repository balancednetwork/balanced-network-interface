import React, { useCallback, useEffect, useState } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';

import useLast from '@/hooks/useLast';

import { XChainId } from '@balancednetwork/xwagmi';
import Modal from '../Modal';
import { PopperWithoutArrow } from '../Popover';
import { CurrencySearch, CurrencySelectionType } from './CurrencySearch';
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
  showCurrencyAmount?: boolean;
  currencySelectionType?: CurrencySelectionType;
  width?: number;
  anchorEl?: any;
  showCommunityListControl: boolean;
  xChainId: XChainId;
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
  currencySelectionType = CurrencySelectionType.TRADE_IN,
  showCurrencyAmount = true,
  width,
  anchorEl,
  showCommunityListControl,
  showCrossChainBreakdown,
  xChainId,
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
        forcePlacement={true}
        offset={
          currencySelectionType === CurrencySelectionType.TRADE_IN ||
          currencySelectionType === CurrencySelectionType.TRADE_OUT ||
          currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE ||
          currencySelectionType === CurrencySelectionType.TRADE_MINT_QUOTE
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
          currencySelectionType={currencySelectionType}
          showCurrencyAmount={showCurrencyAmount}
          showImportView={showImportView}
          setImportToken={setImportToken}
          showRemoveView={showRemoveView}
          setRemoveToken={setRemoveToken}
          width={width}
          showCommunityListControl={showCommunityListControl}
          xChainId={xChainId}
          showCrossChainBreakdown={showCrossChainBreakdown}
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
