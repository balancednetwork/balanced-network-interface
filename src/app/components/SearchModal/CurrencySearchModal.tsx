import React, { useCallback, useEffect, useState } from 'react';

import useLast from 'hooks/useLast';
import { Currency, Token } from 'types/balanced-sdk-core';

import Modal from '../Modal';
import { PopperWithoutArrow } from '../Popover';
import { CurrencySearch } from './CurrencySearch';
import { ImportToken } from './ImportToken';
import { RemoveToken } from './RemoveToken';

interface CurrencySearchModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  selectedCurrency?: Currency | null;
  onCurrencySelect: (currency: Currency) => void;
  otherSelectedCurrency?: Currency | null;
  showCommonBases?: boolean;
  showCurrencyAmount?: boolean;
  disableNonToken?: boolean;
  width?: number;
  anchorEl?: any;
}

export enum CurrencyModalView {
  search,
  manage,
  importToken,
  removeToken,
  importList,
}

export default function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false,
  showCurrencyAmount = true,
  disableNonToken = false,
  width,
  anchorEl,
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
  }, [setModalView, onDismiss]);
  const closeImportView = useCallback(() => {
    setModalView(CurrencyModalView.search);
  }, []);
  const showRemoveView = useCallback(() => {
    setModalView(CurrencyModalView.removeToken);
    onDismiss();
  }, [setModalView, onDismiss]);
  const closeRemoveView = useCallback(() => {
    setModalView(CurrencyModalView.search);
  }, []);
  const showManageView = useCallback(() => setModalView(CurrencyModalView.manage), [setModalView]);

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency);
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
        // onDismiss={onDismiss}
        // maxHeight={80}
        // minHeight={minHeight}
        offset={[0, 10]}
      >
        <CurrencySearch
          isOpen={isOpen}
          onDismiss={onDismiss}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          showCommonBases={showCommonBases}
          showCurrencyAmount={showCurrencyAmount}
          disableNonToken={disableNonToken}
          showImportView={showImportView}
          setImportToken={setImportToken}
          showRemoveView={showRemoveView}
          setRemoveToken={setRemoveToken}
          showManageView={showManageView}
          width={width}
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
