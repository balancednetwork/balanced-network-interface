import React from 'react';

import { Currency, ICX } from '@balancednetwork/sdk-core';
import { Flex } from 'rebass/styled-components';

import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { BrightPanel, SectionPanel } from '@/app/components/Panel';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import { bnUSD, SUPPORTED_TOKENS_LIST, wICX } from '@/constants/tokens';
import { FlipButton } from '../xswap/_components/SwapPanel';
import { Button } from '@/app/components/Button';
import { Trans } from '@lingui/macro';
import ClickAwayListener from 'react-click-away-listener';
import { DropdownPopper } from '@/app/components/Popover';
import { StyledArrowDownIcon } from '@/app/components/DropdownText';
import { SelectorWrap } from '@/app/components/home/_components/CollateralChainSelector';
import { CurrencySelectionType } from '@/app/components/SearchModal/CurrencySearch';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { MigrationModal } from './_components';

export type MigrationType = 'bnUSD' | 'ICX';

const MIGRATION_TYPES: MigrationType[] = ['bnUSD', 'ICX'];
// export type MigrationType = 'bnUSD' | 'ICX' | 'BALN';

function findTokenBySymbol(symbol: string): Currency | undefined {
  return SUPPORTED_TOKENS_LIST.find(t => t.symbol === symbol);
}

const MIGRATION_LABELS: Record<MigrationType, string> = {
  bnUSD: 'bnUSD (old <> new)',
  ICX: 'ICX <> SODA',
  // BALN: 'BALN <> SODA',
};

function useMigrationState() {
  const [inputValue, setInputValue] = React.useState('');
  const [inputCurrency, setInputCurrency] = React.useState<Currency | undefined>(bnUSD[1]);
  const [outputCurrency, setOutputCurrency] = React.useState<Currency | undefined>(bnUSD[1]);
  const [migrationType, setMigrationType] = React.useState<MigrationType>('bnUSD');
  const [currencySelection, setCurrencySelection] = React.useState<CurrencySelectionType>(
    CurrencySelectionType.TRADE_IN,
  );

  const setInputCurrencyCB = React.useCallback((currency: Currency) => {
    setInputCurrency(currency);
  }, []);

  const setOutputCurrencyCB = React.useCallback((currency: Currency) => {
    setOutputCurrency(currency);
  }, []);

  React.useEffect(() => {
    if (migrationType === 'bnUSD') {
      setCurrencySelection(CurrencySelectionType.MIGRATE_BNUSD);
      setInputCurrency(bnUSD[1]);
      setOutputCurrency(bnUSD[1]);
    } else if (migrationType === 'ICX') {
      setCurrencySelection(CurrencySelectionType.MIGRATE_ICX);
      setInputCurrency(wICX[1]);
      setOutputCurrency(wICX[1]);
    }
  }, [migrationType]);

  return {
    inputCurrency,
    setInputCurrency: setInputCurrencyCB,
    setOutputCurrency: setOutputCurrencyCB,
    outputCurrency,
    inputValue,
    setInputValue,
    migrationType,
    setMigrationType,
    currencySelection,
    setCurrencySelection,
  } as const;
}

const onSwitchTokens = () => {
  console.log('switch tokens');
};

function MigratePanel() {
  const {
    inputCurrency,
    outputCurrency,
    inputValue,
    setInputValue,
    migrationType,
    setMigrationType,
    currencySelection,
    setOutputCurrency,
    setInputCurrency,
  } = useMigrationState();

  const openModal = () => {
    if (inputValue && parseFloat(inputValue) > 0 && inputCurrency && outputCurrency) {
      modalActions.openModal(MODAL_ID.MIGRATION_CONFIRM_MODAL);
    }
  };

  const selectorRef = React.useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [isOpen, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (selectorRef.current) {
      setAnchor(selectorRef.current);
    }
  }, []);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(prev => !prev);
  };

  const closeDropdown = () => {
    if (isOpen) setOpen(false);
  };

  const migrationTokens = React.useMemo(() => {
    return (['bnUSD', 'ICX'] as MigrationType[]).map(symbol => findTokenBySymbol(symbol)).filter(Boolean) as Currency[];
  }, []);

  return (
    <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
      <div>
        <AutoColumn gap="md">
          <Flex alignItems="center">
            <Typography variant="h2" pr={1}>
              Migrate:
            </Typography>
            <ClickAwayListener onClickAway={closeDropdown}>
              <div>
                <SelectorWrap onClick={handleToggle} style={{ position: 'relative' }} ref={selectorRef}>
                  <Typography fontSize={14} pr="1px" pt={2}>
                    {MIGRATION_LABELS[migrationType]}
                  </Typography>
                  {/* <div ref={arrowRef} style={{ display: 'inline-block' }}>
                    <StyledArrowDownIcon style={{ transform: 'translate3d(-2px, 1px, 0)' }} />
                  </div> */}
                </SelectorWrap>

                <DropdownPopper show={isOpen} anchorEl={anchor} placement="bottom" offset={[0, 9]} strategy="absolute">
                  <div style={{ padding: '6px 0', minWidth: 160 }}>
                    {MIGRATION_TYPES.map(type => (
                      <Flex
                        key={type}
                        alignItems="center"
                        p={2}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setMigrationType(type);
                          setOpen(false);
                        }}
                      >
                        <Typography variant="span">{MIGRATION_LABELS[type]}</Typography>
                      </Flex>
                    ))}
                  </div>
                </DropdownPopper>
              </div>
            </ClickAwayListener>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={inputValue}
              currency={inputCurrency}
              onUserInput={setInputValue}
              onCurrencySelect={setInputCurrency}
              showCrossChainOptions={true}
              currencySelectionType={currencySelection}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="center" my={1}>
            <FlipButton onClick={onSwitchTokens}>
              <FlipIcon width={25} height={17} />
            </FlipButton>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={inputValue}
              currency={outputCurrency}
              onUserInput={setInputValue}
              onCurrencySelect={setOutputCurrency}
              showCrossChainOptions={true}
              currencySelectionType={currencySelection}
            />
          </Flex>

          <AutoColumn gap="5px" mt={5}>
            <Flex justifyContent="center" mt={4}>
              <Button onClick={openModal} disabled={!inputValue || parseFloat(inputValue) <= 0}>
                <Trans>Migrate</Trans>
              </Button>
            </Flex>
          </AutoColumn>
        </AutoColumn>
      </div>
    </BrightPanel>
  );
}

function MigrateDescription() {
  return (
    <Flex bg="bg2" flex={1} flexDirection="column" p={[5, 7]}>
      <Typography variant="h3" mb={2}>
        Migration
      </Typography>
      <Typography variant="p">Select a pair and enter the amount to migrate.</Typography>
    </Flex>
  );
}

export function MigratePage() {
  const { inputCurrency, outputCurrency, inputValue, migrationType } = useMigrationState();

  return (
    <>
      <SectionPanel bg="bg2">
        <MigratePanel />
        <MigrateDescription />
      </SectionPanel>

      <MigrationModal
        modalId={MODAL_ID.MIGRATION_CONFIRM_MODAL}
        inputCurrency={inputCurrency}
        outputCurrency={outputCurrency}
        inputAmount={inputValue}
        outputAmount={inputValue} // For now, 1:1 ratio
        migrationType={migrationType}
      />
    </>
  );
}
