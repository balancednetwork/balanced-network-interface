import React from 'react';

import { Currency, ICX, Percent, XChainId } from '@balancednetwork/sdk-core';
import { Box, Flex } from 'rebass/styled-components';

import { Button } from '@/app/components/Button';
import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { StyledArrowDownIcon, UnderlineText } from '@/app/components/DropdownText';
import { BrightPanel, SectionPanel } from '@/app/components/Panel';
import { DropdownPopper } from '@/app/components/Popover';
import { CurrencySelectionType } from '@/app/components/SearchModal/CurrencySearch';
import { SelectorWrap } from '@/app/components/home/_components/CollateralChainSelector';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import { SODA, SUPPORTED_TOKENS_LIST, bnUSD, bnUSD_new, useICX, wICX } from '@/constants/tokens';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { maxAmountSpend } from '@/utils';
import { formatBalance } from '@/utils/formatter';
import { Trans } from '@lingui/macro';
import ClickAwayListener from 'react-click-away-listener';
import { FlipButton } from '../xswap/_components/SwapPanel';
import { MigrationModal } from './_components';
import { xTokenMap } from '@balancednetwork/xwagmi';
import styled, { useTheme } from 'styled-components';

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

const StyledUnderlineText = styled(UnderlineText)`
  &:after {
    margin-top: -2px;
  }
`;

function useMigrationState() {
  const [inputValue, setInputValue] = React.useState('');
  const ICX = useICX();
  const [inputCurrency, setInputCurrency] = React.useState<Currency | undefined>(bnUSD[0]);
  const [outputCurrency, setOutputCurrency] = React.useState<Currency | undefined>(bnUSD_new[0]);
  const [inputChain, setInputChain] = React.useState<XChainId>('0x1.icon');
  const [outputChain, setOutputChain] = React.useState<XChainId>('sonic');
  const [migrationType, setMigrationType] = React.useState<MigrationType>('bnUSD');
  const [revert, setRevert] = React.useState<boolean>(false);
  const [currencySelectionInput, setCurrencySelectionInput] = React.useState<CurrencySelectionType>(
    CurrencySelectionType.MIGRATE_BNUSD_OLD,
  );
  const [currencySelectionOutput, setCurrencySelectionOutput] = React.useState<CurrencySelectionType>(
    CurrencySelectionType.MIGRATE_BNUSD_NEW,
  );
  const [inputPercent, setInputPercent] = React.useState<number>(0);

  const setInputChainCB = React.useCallback((chain: XChainId) => {
    setInputChain(chain);
  }, []);

  const setOutputChainCB = React.useCallback((chain: XChainId) => {
    setOutputChain(chain);
  }, []);

  const setInputCurrencyCB = React.useCallback((currency: Currency) => {
    setInputCurrency(currency);
  }, []);

  const setOutputCurrencyCB = React.useCallback((currency: Currency) => {
    setOutputCurrency(currency);
  }, []);

  const setInputValueCB = React.useCallback(
    (value: string) => {
      if (inputPercent > 0) {
        setInputPercent(0);
      }
      setInputValue(value);
    },
    [inputPercent],
  );

  const onTokenSwitch = React.useCallback(() => {
    const prevInputCurrency = inputCurrency;
    const prevInputChain = inputChain;
    const prevInputCurrencySelection = currencySelectionInput;

    setInputChain(outputChain);
    setOutputChain(prevInputChain);
    setInputCurrency(outputCurrency);
    setOutputCurrency(prevInputCurrency);
    setCurrencySelectionInput(currencySelectionOutput);
    setCurrencySelectionOutput(prevInputCurrencySelection);
    setRevert(prev => !prev);
  }, [inputCurrency, outputCurrency, inputChain, outputChain, currencySelectionInput, currencySelectionOutput]);

  const onInputPercentSelect = React.useCallback((percent: number) => {
    setInputPercent(percent);
  }, []);

  React.useEffect(() => {
    if (migrationType === 'bnUSD') {
      setCurrencySelectionInput(CurrencySelectionType.MIGRATE_BNUSD_OLD);
      setCurrencySelectionOutput(CurrencySelectionType.MIGRATE_BNUSD_NEW);
      setInputCurrency(bnUSD[1]);
      setInputChain('0x1.icon');
      setOutputCurrency(bnUSD_new[1]);
      setOutputChain('sonic');
      setRevert(false);
    } else if (migrationType === 'ICX') {
      setCurrencySelectionInput(CurrencySelectionType.MIGRATE_ICX);
      setCurrencySelectionOutput(CurrencySelectionType.MIGRATE_SODAX);
      setInputCurrency(ICX);
      setInputChain('0x1.icon');
      setOutputCurrency(SODA[1]);
      setOutputChain('sonic');
      setRevert(false);
    }
  }, [migrationType, ICX]);

  return {
    inputCurrency,
    setInputCurrency: setInputCurrencyCB,
    setOutputCurrency: setOutputCurrencyCB,
    outputCurrency,
    inputValue,
    setInputValue: setInputValueCB,
    migrationType,
    setMigrationType,
    onTokenSwitch,
    onInputPercentSelect,
    inputPercent,
    setInputChain: setInputChainCB,
    setOutputChain: setOutputChainCB,
    inputChain,
    outputChain,
    currencySelectionInput,
    currencySelectionOutput,
    revert,
  } as const;
}

function MigratePanel({
  inputCurrency,
  outputCurrency,
  inputValue,
  setInputValue,
  migrationType,
  setMigrationType,
  onInputPercentSelect,
  inputPercent,
  setInputChain,
  setOutputChain,
  inputChain,
  outputChain,
  onTokenSwitch,
  currencySelectionInput,
  currencySelectionOutput,
}: ReturnType<typeof useMigrationState>) {
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

  // Wallet balance hooks
  const signedInWallets = useSignedInWallets();
  const crossChainWallet = useCrossChainWalletBalances();
  const rates = useRatesWithOracle();

  // Get input currency balance
  const inputCurrencyBalance = React.useMemo(() => {
    if (!inputCurrency) return undefined;
    return crossChainWallet[inputChain]?.[
      xTokenMap[inputChain].find(token => token.symbol === inputCurrency.symbol)?.address
    ];
  }, [crossChainWallet, inputCurrency, inputChain]);

  // Get output currency balance
  const outputCurrencyBalance = React.useMemo(() => {
    if (!outputCurrency) return undefined;
    return crossChainWallet[outputChain]?.[
      xTokenMap[outputChain].find(token => token.symbol === outputCurrency.symbol)?.address
    ];
  }, [crossChainWallet, outputCurrency, outputChain]);

  // Calculate max input amount for percent selection
  const maxInputAmount = React.useMemo(() => maxAmountSpend(inputCurrencyBalance), [inputCurrencyBalance]);

  // Handle input percent selection
  const handleInputPercentSelect = React.useCallback(
    (percent: number) => {
      if (maxInputAmount) {
        const amount = maxInputAmount.multiply(new Percent(percent, 100)).toFixed();
        setInputValue(amount);
        onInputPercentSelect(percent);
      }
    },
    [maxInputAmount, setInputValue, onInputPercentSelect],
  );

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

          <Flex alignItems="center" justifyContent="flex-end">
            {signedInWallets.length > 0 && inputCurrencyBalance ? (
              <Typography as="div">
                <Trans>Wallet:</Trans>{' '}
                {`${formatBalance(
                  inputCurrencyBalance?.toFixed(),
                  rates?.[inputCurrencyBalance?.currency.symbol]?.toFixed(),
                )} ${inputCurrency?.symbol}`}
              </Typography>
            ) : null}
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={inputValue}
              currency={inputCurrency}
              onUserInput={setInputValue}
              onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
              percent={inputPercent}
              showCrossChainOptions={true}
              currencySelectionType={currencySelectionInput}
              xChainId={inputChain}
              onChainSelect={setInputChain}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={1}>
            <FlipButton onClick={onTokenSwitch}>
              <FlipIcon width={25} height={17} />
            </FlipButton>
          </Flex>

          <Flex alignItems="center" justifyContent="flex-end">
            {signedInWallets.length > 0 && outputCurrencyBalance ? (
              <Typography as="div">
                <Trans>Wallet:</Trans>{' '}
                {`${formatBalance(
                  outputCurrencyBalance?.toFixed(),
                  rates?.[outputCurrencyBalance?.currency.symbol]?.toFixed(),
                )} ${outputCurrency?.symbol}`}
              </Typography>
            ) : null}
            {/* ): <Typography as="div"><Trans>Wallet: 0</Trans></Typography>} */}
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={inputValue}
              currency={outputCurrency}
              onUserInput={setInputValue}
              showCrossChainOptions={true}
              currencySelectionType={currencySelectionOutput}
              xChainId={outputChain}
              onChainSelect={setOutputChain}
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

function MigrateDescription({ migrationType }: { migrationType: MigrationType }) {
  const theme = useTheme();
  const getMigrationContent = () => {
    switch (migrationType) {
      case 'bnUSD':
        return {
          title: 'bnUSD (old <> new)',
          equivalence: '1 bnUSD(old) = 1 bnUSD',
          description: (
            <>
              Balanced is transitioning to a new technology stack, powered by{' '}
              <a
                href="https://www.sodax.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.colors.primary }}
              >
                <StyledUnderlineText>SODAX</StyledUnderlineText>
              </a>
              .
            </>
          ),
          bulletPoints: [
            'Use bnUSD to trade on every chain except ICON.',
            'Use bnUSD(old) to repay loans and earn through the Savings Rate.',
          ],
        };
      case 'ICX':
        return {
          title: 'ICX <> SODA',
          equivalence: '1 ICX = 1 SODA',
          description: (
            <>
              The ICON blockchain is now{' '}
              <a
                href="https://www.sodax.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.colors.primary }}
              >
                <StyledUnderlineText>SODAX</StyledUnderlineText>
              </a>
              , a unified liquidity layer and DeFi platform on Sonic. Swap your ICX 1:1 for SODA on the Sonic
              blockchain.
            </>
          ),
        };
      default:
        return {
          title: 'Migration',
          equivalence: '',
          description: 'Select a pair and enter the amount to migrate.',
        };
    }
  };

  const content = getMigrationContent();

  return (
    <Flex bg="bg2" flex={1} flexDirection="column" p={[5, 7]}>
      <Typography variant="h3" mb={2}>
        {content.title}
      </Typography>
      {content.equivalence && (
        <Typography variant="h4" mb={3} textAlign="center" fontWeight="bold" mt="40px">
          {content.equivalence}
        </Typography>
      )}
      <Box pl={3}>
        <Typography variant="p" color="text2" mb={content.bulletPoints ? 3 : 0}>
          {content.description}
        </Typography>
        {content.bulletPoints && (
          <Flex flexDirection="column" pt={1}>
            {content.bulletPoints.map((point, index) => (
              <Typography key={index} variant="p" color="text2" mb={1}>
                • {point}
              </Typography>
            ))}
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

export function MigratePage() {
  const migrationState = useMigrationState();

  return (
    <>
      <SectionPanel bg="bg2">
        <MigratePanel {...migrationState} />
        <MigrateDescription migrationType={migrationState.migrationType} />
      </SectionPanel>

      <MigrationModal
        modalId={MODAL_ID.MIGRATION_CONFIRM_MODAL}
        inputCurrency={migrationState.inputCurrency}
        outputCurrency={migrationState.outputCurrency}
        inputAmount={migrationState.inputValue}
        outputAmount={migrationState.inputValue} // For now, 1:1 ratio
        migrationType={migrationState.migrationType}
        sourceChain={migrationState.inputChain}
        receiverChain={migrationState.outputChain}
        revert={migrationState.revert}
      />
    </>
  );
}
