import React from 'react';

import { Currency, CurrencyAmount, ICX, Percent, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';
import { useSearchParams } from 'react-router-dom';

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
import { SODA, SUPPORTED_TOKENS_LIST, bnUSD, bnUSD_new, useICX, wICX, BALN } from '@/constants/tokens';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { useWalletModalToggle } from '@/store/application/hooks';
import { maxAmountSpend } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { Trans } from '@lingui/macro';
import ClickAwayListener from 'react-click-away-listener';
import { FlipButton } from '../xswap/_components/SwapPanel';
import { MigrationModal, PendingMigrations } from './_components';
import {
  getXChainType,
  useValidateStellarAccount,
  useValidateStellarTrustline,
  useXAccount,
  xTokenMap,
} from '@balancednetwork/xwagmi';
import styled, { useTheme } from 'styled-components';
import StellarSponsorshipModal from '@/app/components/StellarSponsorshipModal';
import StellarTrustlineModal from '@/app/components/StellarTrustlineModal';

export type MigrationType = 'bnUSD' | 'ICX' | 'BALN';

const MIGRATION_TYPES: MigrationType[] = ['BALN', 'bnUSD', 'ICX'];

// Lockup multiplier constants (from sodax/sdk)
enum LockupMultiplier {
  NO_LOCKUP_MULTIPLIER = 5000, // 0.5x
  SIX_MONTHS_MULTIPLIER = 7500, // 0.75x
  TWELVE_MONTHS_MULTIPLIER = 10000, // 1.0x
  EIGHTEEN_MONTHS_MULTIPLIER = 12500, // 1.25x
  TWENTY_FOUR_MONTHS_MULTIPLIER = 15000, // 1.5x
}

enum LockupPeriod {
  NO_LOCKUP = 0,
  SIX_MONTHS = 6 * 30 * 24 * 60 * 60, // 6 months
  TWELVE_MONTHS = 12 * 30 * 24 * 60 * 60, // 12 months
  EIGHTEEN_MONTHS = 18 * 30 * 24 * 60 * 60, // 18 months
  TWENTY_FOUR_MONTHS = 24 * 30 * 24 * 60 * 60, // 24 months
}

const LOCKUP_OPTIONS = [
  { label: 'No lock-up', value: LockupPeriod.NO_LOCKUP, multiplier: LockupMultiplier.NO_LOCKUP_MULTIPLIER },
  { label: '6 months', value: LockupPeriod.SIX_MONTHS, multiplier: LockupMultiplier.SIX_MONTHS_MULTIPLIER },
  { label: '12 months', value: LockupPeriod.TWELVE_MONTHS, multiplier: LockupMultiplier.TWELVE_MONTHS_MULTIPLIER },
  { label: '18 months', value: LockupPeriod.EIGHTEEN_MONTHS, multiplier: LockupMultiplier.EIGHTEEN_MONTHS_MULTIPLIER },
  {
    label: '24 months',
    value: LockupPeriod.TWENTY_FOUR_MONTHS,
    multiplier: LockupMultiplier.TWENTY_FOUR_MONTHS_MULTIPLIER,
  },
];

function findTokenBySymbol(symbol: string): Currency | undefined {
  return SUPPORTED_TOKENS_LIST.find(t => t.symbol === symbol);
}

const MIGRATION_LABELS: Record<MigrationType, string> = {
  BALN: 'BALN > SODA',
  bnUSD: 'bnUSD (old <> new)',
  ICX: 'ICX <> SODA',
};

const StyledUnderlineText = styled(UnderlineText)`
  &:after {
    margin-top: -2px;
  }
`;

function useMigrationState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = React.useState('');
  const ICX = useICX();

  // Get migration type from URL or default to 'bnUSD'
  const urlMigrationType = searchParams.get('type') as MigrationType;
  const initialMigrationType =
    urlMigrationType && MIGRATION_TYPES.includes(urlMigrationType) ? urlMigrationType : 'BALN';

  const [inputCurrency, setInputCurrency] = React.useState<Currency | undefined>(bnUSD[0]);
  const [outputCurrency, setOutputCurrency] = React.useState<Currency | undefined>(bnUSD_new[0]);
  const [inputChain, setInputChain] = React.useState<XChainId>('0x1.icon');
  const [outputChain, setOutputChain] = React.useState<XChainId>('sonic');
  const [migrationType, setMigrationType] = React.useState<MigrationType>(initialMigrationType);
  const [revert, setRevert] = React.useState<boolean>(false);
  const [currencySelectionInput, setCurrencySelectionInput] = React.useState<CurrencySelectionType>(
    CurrencySelectionType.MIGRATE_BNUSD_OLD,
  );
  const [currencySelectionOutput, setCurrencySelectionOutput] = React.useState<CurrencySelectionType>(
    CurrencySelectionType.MIGRATE_BNUSD_NEW,
  );
  const [inputPercent, setInputPercent] = React.useState<number>(0);
  const [lockupPeriod, setLockupPeriod] = React.useState<LockupPeriod>(LockupPeriod.SIX_MONTHS);

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

  const setMigrationTypeCB = React.useCallback(
    (type: MigrationType) => {
      setMigrationType(type);
      // Update URL with the new migration type
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('type', type);
      setSearchParams(newSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
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

  // Handle URL changes to update migration type
  React.useEffect(() => {
    const urlMigrationType = searchParams.get('type') as MigrationType;
    if (urlMigrationType && MIGRATION_TYPES.includes(urlMigrationType) && urlMigrationType !== migrationType) {
      setMigrationType(urlMigrationType);
    }
  }, [searchParams, migrationType]);

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
    } else if (migrationType === 'BALN') {
      setCurrencySelectionInput(CurrencySelectionType.MIGRATE_ICX); // We'll need to add BALN specific types
      setCurrencySelectionOutput(CurrencySelectionType.MIGRATE_SODAX);
      setInputCurrency(BALN[1]);
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
    setMigrationType: setMigrationTypeCB,
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
    lockupPeriod,
    setLockupPeriod,
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
  revert,
  lockupPeriod,
  setLockupPeriod,
}: ReturnType<typeof useMigrationState>) {
  const openModal = () => {
    if (inputValue && parseFloat(inputValue) > 0 && inputCurrency && outputCurrency) {
      if (!sourceAccount.address || !receiver) {
        toggleWalletModal();
      } else {
        modalActions.openModal(MODAL_ID.MIGRATION_CONFIRM_MODAL);
      }
    }
  };

  const selectorRef = React.useRef<HTMLDivElement | null>(null);
  const arrowRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [isOpen, setOpen] = React.useState(false);

  // Lockup selector state
  const lockupSelectorRef = React.useRef<HTMLDivElement | null>(null);
  const lockupArrowRef = React.useRef<HTMLDivElement | null>(null);
  const lockupContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [lockupAnchor, setLockupAnchor] = React.useState<HTMLElement | null>(null);
  const [isLockupOpen, setLockupOpen] = React.useState(false);

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

  const handleLockupToggle = (e: React.MouseEvent<HTMLElement>) => {
    if (isLockupOpen) {
      setLockupOpen(false);
    } else {
      setLockupOpen(true);
      if (lockupSelectorRef.current) {
        setLockupAnchor(lockupSelectorRef.current);
      }
    }
  };

  const closeLockupDropdown = () => {
    if (isLockupOpen) setLockupOpen(false);
  };

  // Wallet balance hooks
  const signedInWallets = useSignedInWallets();
  const crossChainWallet = useCrossChainWalletBalances();
  const rates = useRatesWithOracle();
  const toggleWalletModal = useWalletModalToggle();

  const receiver = useXAccount(getXChainType(outputChain)).address;
  const stellarBnUSD = xTokenMap['stellar'].find(token => token.symbol === 'bnUSD');

  // Stellar account validation
  const stellarValidationQuery = useValidateStellarAccount(outputChain === 'stellar' ? receiver : undefined);
  const { data: stellarValidation } = stellarValidationQuery;

  // Stellar trustline validation
  const stellarTrustlineValidationQuery = useValidateStellarTrustline(
    !revert && outputChain === 'stellar' ? receiver : undefined,
    !revert && outputChain === 'stellar' ? stellarBnUSD : undefined,
  );
  const { data: stellarTrustlineValidation } = stellarTrustlineValidationQuery;

  // Check if user is signed in on the source chain
  const sourceAccount = useXAccount(getXChainType(inputChain));

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

  // Check if user has sufficient balance for the input amount
  const hasInsufficientBalance = React.useMemo(() => {
    if (!inputValue || parseFloat(inputValue) <= 0 || !inputCurrencyBalance || !inputCurrency) {
      return false;
    }

    try {
      // Convert input value to BigNumber for comparison
      const inputAmountBN = new BigNumber(inputValue);
      const balanceAmountBN = new BigNumber(inputCurrencyBalance.toFixed());

      // Check if input amount is greater than available balance
      return inputAmountBN.isGreaterThan(balanceAmountBN);
    } catch (error) {
      // If there's an error parsing the amounts, consider it insufficient
      return true;
    }
  }, [inputValue, inputCurrencyBalance, inputCurrency]);

  // Check if user is trying to migrate too much ICX (leaving insufficient gas)
  const hasInsufficientGasBuffer = React.useMemo(() => {
    // Only check for ICX token migration from ICON chain
    if (
      !inputValue ||
      parseFloat(inputValue) <= 0 ||
      !inputCurrencyBalance ||
      !inputCurrency ||
      inputCurrency.symbol !== 'ICX' ||
      inputChain !== '0x1.icon'
    ) {
      return false;
    }

    try {
      // Convert input value to BigNumber for comparison
      const inputAmountBN = new BigNumber(inputValue);
      const balanceAmountBN = new BigNumber(inputCurrencyBalance.toFixed());

      const gasBuffer = new BigNumber(2);

      // Check if user is trying to migrate more than (total balance - gas buffer)
      const maxMigratableAmount = balanceAmountBN.minus(gasBuffer);

      return inputAmountBN.isGreaterThan(maxMigratableAmount);
    } catch (error) {
      // If there's an error parsing the amounts, consider it insufficient
      return true;
    }
  }, [inputValue, inputCurrencyBalance, inputCurrency, inputChain]);

  // Calculate SODA amount based on BALN input and lockup multiplier
  const sodaAmount = React.useMemo(() => {
    if (migrationType !== 'BALN' || !inputValue || parseFloat(inputValue) <= 0) {
      return inputValue; // For non-BALN migrations, return input value as-is
    }

    try {
      const inputAmountBN = new BigNumber(inputValue);
      const selectedOption = LOCKUP_OPTIONS.find(option => option.value === lockupPeriod);
      if (!selectedOption) return inputValue;

      const multiplier = selectedOption.multiplier / 10000; // Convert from basis points to decimal
      const sodaAmountBN = inputAmountBN.multipliedBy(multiplier);

      return sodaAmountBN.toFixed();
    } catch (error) {
      return inputValue;
    }
  }, [inputValue, migrationType, lockupPeriod]);

  // Calculate unlock date for BALN migration
  const unlockDate = React.useMemo(() => {
    if (migrationType !== 'BALN' || lockupPeriod === LockupPeriod.NO_LOCKUP) {
      return null;
    }

    const now = new Date();
    const unlockTime = new Date(now.getTime() + lockupPeriod * 1000);
    return unlockTime;
  }, [migrationType, lockupPeriod]);

  // Get current lockup option for display
  const currentLockupOption = React.useMemo(() => {
    return LOCKUP_OPTIONS.find(option => option.value === lockupPeriod);
  }, [lockupPeriod]);

  return (
    <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
      <div>
        <AutoColumn gap="md">
          <Flex alignItems="center">
            <Typography variant="h2" pr={1}>
              Migrate:
            </Typography>
            <ClickAwayListener onClickAway={closeDropdown}>
              <div ref={containerRef}>
                <SelectorWrap onClick={handleToggle} style={{ position: 'relative' }} ref={selectorRef}>
                  <UnderlineText style={{ paddingRight: '1px', paddingTop: '0px', fontSize: '14px' }}>
                    <Typography fontSize={14} pt="11px" color="primaryBright" style={{ cursor: 'default' }}>
                      {MIGRATION_LABELS[migrationType]}
                    </Typography>
                  </UnderlineText>
                  <div ref={arrowRef} style={{ display: 'inline-block' }}>
                    <StyledArrowDownIcon style={{ transform: 'translate3d(-1px, 1px, 0)' }} />
                  </div>
                </SelectorWrap>

                <DropdownPopper
                  show={isOpen}
                  anchorEl={anchor}
                  arrowEl={arrowRef.current}
                  customArrowStyle={{
                    transform: `translateX(${arrowRef.current && containerRef.current ? Math.floor(arrowRef.current?.getBoundingClientRect().x - containerRef.current.getBoundingClientRect().x) + (migrationType === 'bnUSD' ? 9 : 30) + 'px' : '0'})`,
                  }}
                  placement="bottom"
                  forcePlacement={true}
                  offset={[0, 7]}
                  strategy="absolute"
                >
                  <div style={{ padding: '6px 0', minWidth: 160 }}>
                    {MIGRATION_TYPES.map(type => (
                      <Flex
                        key={type}
                        alignItems="center"
                        p={2}
                        sx={{
                          cursor: 'pointer',
                          '& span': {
                            transition: 'color 0.2s ease',
                          },
                          '&:hover': {
                            '& span': {
                              color: 'primary',
                            },
                          },
                        }}
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
                  rates?.[inputCurrencyBalance?.currency.symbol?.replace('(old)', '')]?.toFixed(),
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

          {migrationType === 'BALN' ? null : (
            <Flex alignItems="center" justifyContent="center" mt={1}>
              <FlipButton onClick={onTokenSwitch}>
                <FlipIcon width={25} height={17} />
              </FlipButton>
            </Flex>
          )}

          <Flex alignItems="center" justifyContent="flex-end" mt={migrationType === 'BALN' ? 3 : 0}>
            {signedInWallets.length > 0 && outputCurrencyBalance ? (
              <Typography as="div">
                <Trans>Wallet:</Trans>{' '}
                {`${formatBalance(
                  outputCurrencyBalance?.toFixed(),
                  rates?.[outputCurrencyBalance?.currency.symbol?.replace('(old)', '')]?.toFixed(),
                )} ${outputCurrency?.symbol}`}
              </Typography>
            ) : null}
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={migrationType === 'BALN' ? sodaAmount : inputValue}
              currency={outputCurrency}
              onUserInput={migrationType === 'BALN' ? () => {} : setInputValue}
              showCrossChainOptions={true}
              currencySelectionType={currencySelectionOutput}
              xChainId={outputChain}
              onChainSelect={setOutputChain}
              disabled={migrationType === 'BALN'}
            />
          </Flex>

          {migrationType === 'BALN' && (
            <AutoColumn mt={3}>
              {/* Lock-up time selector */}
              <Flex alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="span" color="text1">
                  <Trans>Lock-up time:</Trans>
                </Typography>
                <ClickAwayListener onClickAway={closeLockupDropdown}>
                  <div ref={lockupContainerRef} style={{ position: 'relative' }}>
                    <SelectorWrap
                      onClick={handleLockupToggle}
                      style={{ cursor: 'pointer', minWidth: 'auto' }}
                      ref={lockupSelectorRef}
                    >
                      <UnderlineText>
                        <Typography fontSize={14} color="primaryBright">
                          {currentLockupOption?.label}
                        </Typography>
                      </UnderlineText>
                      <div ref={lockupArrowRef} style={{ display: 'inline-block' }}>
                        <StyledArrowDownIcon style={{ transform: 'translate3d(-1px, 1px, 0)' }} />
                      </div>
                    </SelectorWrap>

                    <DropdownPopper
                      show={isLockupOpen}
                      anchorEl={lockupAnchor}
                      arrowEl={lockupArrowRef.current}
                      customArrowStyle={{
                        transform: `translateX(0)`,
                        right: '20px',
                        left: 'auto',
                      }}
                      placement="bottom-end"
                      forcePlacement={true}
                      offset={[20, 7]}
                      strategy="absolute"
                    >
                      <div style={{ padding: '6px 0', minWidth: 110 }}>
                        {LOCKUP_OPTIONS.map(option => (
                          <Flex
                            key={option.value}
                            alignItems="center"
                            p={2}
                            sx={{
                              cursor: 'pointer',
                              '& span': {
                                transition: 'color 0.2s ease',
                              },
                              '&:hover': {
                                '& span': {
                                  color: 'primary',
                                },
                              },
                            }}
                            onClick={() => {
                              setLockupPeriod(option.value);
                              setLockupOpen(false);
                            }}
                          >
                            <Typography variant="span">{option.label}</Typography>
                          </Flex>
                        ))}
                      </div>
                    </DropdownPopper>
                  </div>
                </ClickAwayListener>
              </Flex>

              {/* Exchange rate */}
              <Flex alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="span" color="text1">
                  <Trans>Exchange rate:</Trans>
                </Typography>
                <Typography variant="span">
                  1 BALN = {currentLockupOption ? (currentLockupOption.multiplier / 10000).toFixed(2) : '0.75'} SODA
                </Typography>
              </Flex>

              {/* Unlock date */}
              {unlockDate && (
                <Flex alignItems="center" justifyContent="space-between">
                  <Typography variant="span" color="text1">
                    <Trans>Unlock date:</Trans>
                  </Typography>
                  <Typography variant="span">
                    {unlockDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Flex>
              )}
            </AutoColumn>
          )}

          <AutoColumn gap="5px" mt={1}>
            <Flex justifyContent="center" mt={4}>
              <Button
                onClick={openModal}
                disabled={
                  !inputValue ||
                  parseFloat(inputValue) <= 0 ||
                  (!stellarValidation?.ok && outputChain === 'stellar') ||
                  !stellarTrustlineValidation?.ok ||
                  hasInsufficientBalance ||
                  hasInsufficientGasBuffer
                }
              >
                {hasInsufficientBalance || hasInsufficientGasBuffer ? (
                  <Trans>Insufficient {formatSymbol(inputCurrency?.symbol)}</Trans>
                ) : (
                  <Trans>Migrate</Trans>
                )}
              </Button>
            </Flex>
          </AutoColumn>
        </AutoColumn>

        {stellarValidation?.ok === false && stellarValidation.error && receiver && (
          <Flex alignItems="center" justifyContent="center" mt={3} flexDirection="column">
            <StellarSponsorshipModal text={'Activate your Stellar wallet.'} address={receiver} />
          </Flex>
        )}

        {stellarTrustlineValidation?.ok === false && stellarTrustlineValidation.error && receiver && (
          <Flex alignItems="center" justifyContent="center" mt={3} flexDirection="column">
            <StellarTrustlineModal
              currency={stellarBnUSD}
              text={`Activate ${stellarBnUSD.symbol} for your Stellar wallet.`}
              address={receiver}
            />
          </Flex>
        )}
      </div>
    </BrightPanel>
  );
}

function MigrateDescription({
  migrationType,
  currentLockupOption,
}: { migrationType: MigrationType; currentLockupOption?: (typeof LOCKUP_OPTIONS)[0] }) {
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
          importantNote: (
            <>
              If you hold bnUSD(old) on a chain other than ICON, Stellar, or Sui, you'll need to transfer it via the{' '}
              <a href="/trade-legacy/bridge" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>
                <StyledUnderlineText>legacy exchange</StyledUnderlineText>
              </a>{' '}
              before you can migrate.
            </>
          ),
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
      case 'BALN':
        return {
          title: 'BALN > SODA',
          equivalence: '1 BALN = 0.5 - 1.5 SODA',
          description: (
            <>
              <Typography variant="p" color="text2" mb={2}>
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
              </Typography>
              <Typography variant="p" color="text2" mb={2}>
                <a
                  href="https://blog.balanced.network/governance-retirement/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: theme.colors.primary }}
                >
                  <StyledUnderlineText>Governance has been removed</StyledUnderlineText>
                </a>{' '}
                and BALN will be retired, so you can now migrate your BALN to SODA (rate varies based on the lock-up
                time).
              </Typography>
              <Typography variant="p" color="text2" mb={2}>
                If you lock up SODA, you'll also receive a share of the Balanced DAO Fund and earn SODA staking rewards.
              </Typography>
            </>
          ),
          importantNote: (
            <>
              BALN not on ICON? Use the{' '}
              <a href="/trade-legacy" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>
                <StyledUnderlineText>legacy exchange</StyledUnderlineText>
              </a>{' '}
              to transfer it.
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
        {content.importantNote && (
          <Typography variant="p" color="text2" mt={3}>
            {content.importantNote}
          </Typography>
        )}
      </Box>

      {/* Show pending migrations for BALN migration type */}
      {migrationType === 'BALN' && <PendingMigrations />}
    </Flex>
  );
}

export function MigratePage() {
  const migrationState = useMigrationState();

  // Wallet balance hooks for Solana warning logic
  const crossChainWallet = useCrossChainWalletBalances();

  // Get output currency balance
  const outputCurrencyBalance = React.useMemo(() => {
    if (!migrationState.outputCurrency) return undefined;
    return crossChainWallet[migrationState.outputChain]?.[
      xTokenMap[migrationState.outputChain].find(token => token.symbol === migrationState.outputCurrency?.symbol)
        ?.address
    ];
  }, [crossChainWallet, migrationState.outputCurrency, migrationState.outputChain]);

  // Check if we should show Solana warning (when output token is bnUSD on Solana and user has no balance)
  const showSolanaWarning = React.useMemo(() => {
    return (
      migrationState.outputChain === 'solana' &&
      migrationState.outputCurrency?.symbol === 'bnUSD' &&
      !outputCurrencyBalance?.greaterThan(0)
    );
  }, [migrationState.outputChain, migrationState.outputCurrency?.symbol, outputCurrencyBalance]);

  return (
    <>
      <SectionPanel bg="bg2">
        <MigratePanel {...migrationState} />
        <MigrateDescription
          migrationType={migrationState.migrationType}
          currentLockupOption={LOCKUP_OPTIONS.find(option => option.value === migrationState.lockupPeriod)}
        />
      </SectionPanel>

      <MigrationModal
        modalId={MODAL_ID.MIGRATION_CONFIRM_MODAL}
        inputCurrency={migrationState.inputCurrency}
        outputCurrency={migrationState.outputCurrency}
        inputAmount={migrationState.inputValue}
        outputAmount={
          migrationState.migrationType === 'BALN'
            ? (() => {
                if (!migrationState.inputValue || parseFloat(migrationState.inputValue) <= 0)
                  return migrationState.inputValue;
                try {
                  const inputAmountBN = new BigNumber(migrationState.inputValue);
                  const selectedOption = LOCKUP_OPTIONS.find(option => option.value === migrationState.lockupPeriod);
                  if (!selectedOption) return migrationState.inputValue;
                  const multiplier = selectedOption.multiplier / 10000;
                  return inputAmountBN.multipliedBy(multiplier).toFixed();
                } catch (error) {
                  return migrationState.inputValue;
                }
              })()
            : migrationState.inputValue
        }
        migrationType={migrationState.migrationType}
        sourceChain={migrationState.inputChain}
        receiverChain={migrationState.outputChain}
        revert={migrationState.revert}
        showSolanaWarning={showSolanaWarning}
        lockupPeriod={migrationState.migrationType === 'BALN' ? migrationState.lockupPeriod : undefined}
      />
    </>
  );
}
