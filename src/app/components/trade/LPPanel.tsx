import React from 'react';

import { CurrencyAmount, Currency, Percent, Fraction } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { CROSSCHAIN_SUPPORTED_TOKENS } from 'app/_xcall/_icon/config';
import { DEFAULT_TOKEN_CHAIN } from 'app/_xcall/config';
import { SupportedXCallChains } from 'app/_xcall/types';
import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { Typography } from 'app/theme';
import { BIGINT_ZERO } from 'constants/misc';
import { HIGH_PRICE_ASSET_DP, isNativeCurrency } from 'constants/tokens';
import { PairState } from 'hooks/useV2Pairs';
import { useWalletModalToggle } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useMintState, useDerivedMintInfo, useMintActionHandlers, useInitialSupplyLoad } from 'store/mint/hooks';
import { maxAmountSpend } from 'utils';

import { CurrencySelectionType } from '../SearchModal/CurrencySearch';
import CrossChainOptions from './CrossChainOptions';
import LPDescription from './LPDescription';
import SupplyLiquidityModal from './SupplyLiquidityModal';
import { SectionPanel, BrightPanel } from './utils';

const Slider = styled(Box)`
  margin-top: 40px;
  ${({ theme }) => theme.mediaWidth.upSmall`
     margin-top: 25px;
  `}
`;

function subtract(
  amountA: CurrencyAmount<Currency> | undefined,
  amountB: CurrencyAmount<Currency> | undefined,
): CurrencyAmount<Currency> | undefined {
  if (!amountA) return undefined;
  if (!amountB) return amountA;
  const diff = new Fraction(`${amountA.quotient}`).subtract(new Fraction(`${amountB.quotient}`));
  return CurrencyAmount.fromRawAmount(amountA.currency, diff.quotient);
}

function WalletSection({ AChain, BChain }: { AChain?: SupportedXCallChains; BChain?: SupportedXCallChains }) {
  const { account } = useIconReact();
  const { currencies, currencyBalances, parsedAmounts } = useDerivedMintInfo(AChain, BChain);

  const remains: { [field in Field]?: CurrencyAmount<Currency> } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: subtract(currencyBalances[Field.CURRENCY_A], parsedAmounts[Field.CURRENCY_A]),
      [Field.CURRENCY_B]: subtract(currencyBalances[Field.CURRENCY_B], parsedAmounts[Field.CURRENCY_B]),
    }),
    [currencyBalances, parsedAmounts],
  );

  const formattedRemains: { [field in Field]?: string } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: remains[Field.CURRENCY_A]?.lessThan(BIGINT_ZERO)
        ? '0.00'
        : remains[Field.CURRENCY_A]?.toFixed(
            HIGH_PRICE_ASSET_DP[remains[Field.CURRENCY_A]?.currency.wrapped.address || ''] || 2,
            { groupSeparator: ',' },
          ) ?? '-',
      [Field.CURRENCY_B]: remains[Field.CURRENCY_B]?.lessThan(BIGINT_ZERO)
        ? '0.00'
        : remains[Field.CURRENCY_B]?.toFixed(
            HIGH_PRICE_ASSET_DP[remains[Field.CURRENCY_B]?.currency.wrapped.address || ''] || 2,
            { groupSeparator: ',' },
          ) ?? '-',
    }),
    [remains],
  );

  if (!account) {
    return null;
  }

  if (isNativeCurrency(currencies[Field.CURRENCY_A])) {
    return (
      <Flex flexDirection="row" justifyContent="center" alignItems="center">
        <Typography>
          {t`Wallet: ${formattedRemains[Field.CURRENCY_A]} ${currencies[Field.CURRENCY_A]?.symbol}`}
        </Typography>
      </Flex>
    );
  } else {
    return (
      <Flex flexDirection="row" justifyContent="center" alignItems="center">
        <Typography sx={{ whiteSpace: 'nowrap' }}>
          {t`Wallet: ${formattedRemains[Field.CURRENCY_A]} ${currencies[Field.CURRENCY_A]?.symbol} /
                      ${formattedRemains[Field.CURRENCY_B]} ${currencies[Field.CURRENCY_B]?.symbol}`}
        </Typography>
      </Flex>
    );
  }
}

export default function LPPanel() {
  useInitialSupplyLoad();
  const { account } = useIconReact();
  const toggleWalletModal = useWalletModalToggle();

  // modal
  const [showSupplyConfirm, setShowSupplyConfirm] = React.useState(false);

  const handleSupplyConfirmDismiss = () => {
    setShowSupplyConfirm(false);
  };

  const [amounts, setAmounts] = React.useState<{ [field in Field]?: CurrencyAmount<Currency> }>({
    [Field.CURRENCY_A]: undefined,
    [Field.CURRENCY_B]: undefined,
  });

  const handleConnectToWallet = () => {
    toggleWalletModal();
  };

  const handleSupply = () => {
    setShowSupplyConfirm(true);
    setAmounts(parsedAmounts);
    onFieldAInput('');
    onFieldBInput('');
  };

  const { independentField, typedValue, otherTypedValue, inputType } = useMintState();
  const [chainSelectorOpen, setChainSelectorOpen] = React.useState(false);
  const [crossChainCurrencyA, setCrossChainCurrencyA] = React.useState<SupportedXCallChains>('icon');
  const [crossChainCurrencyB] = React.useState<SupportedXCallChains>('icon');
  const {
    dependentField,
    parsedAmounts,
    noLiquidity,
    currencies,
    currencyBalances,
    error,
    price,
    pair,
    pairState,
    liquidityMinted,
    mintableLiquidity,
  } = useDerivedMintInfo(crossChainCurrencyA, crossChainCurrencyB);
  const { onFieldAInput, onFieldBInput, onSlide, onCurrencySelection } = useMintActionHandlers(noLiquidity);

  const sliderInstance = React.useRef<any>(null);

  const [{ percent, needUpdate }, setPercent] = React.useState({ percent: 0, needUpdate: false });

  const isCurrencyACrosschainCompatible = Object.keys(CROSSCHAIN_SUPPORTED_TOKENS).includes(
    currencies?.CURRENCY_A?.wrapped.address || '',
  );

  React.useEffect(() => {
    sliderInstance.current?.noUiSlider.set(0);
    setPercent({ percent: 0, needUpdate: false });
    onSlide(Field.CURRENCY_A, '');
  }, [currencies, onSlide, sliderInstance]);

  const handleSlider = (values: string[], handle: number) => {
    setPercent({ percent: parseFloat(values[handle]), needUpdate: true });
  };

  const sliderValue =
    liquidityMinted && mintableLiquidity
      ? Math.min(
          new BigNumber(liquidityMinted.quotient.toString())
            .div(mintableLiquidity.quotient.toString())
            .multipliedBy(100)
            .toNumber(),
          100,
        )
      : 0;

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(sliderValue);
      setPercent({ percent: sliderValue, needUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputType, sliderValue]);

  React.useEffect(() => {
    if (needUpdate) {
      const balanceA = maxAmountSpend(currencyBalances[Field.CURRENCY_A]);
      const balanceB = maxAmountSpend(currencyBalances[Field.CURRENCY_B]);
      if (balanceA && balanceB && pair && pair.reserve0 && pair.reserve1) {
        const p = new Percent(Math.floor(percent * 100), 10_000);

        if (isNativeCurrency(currencies[Field.CURRENCY_A])) {
          onSlide(Field.CURRENCY_A, percent !== 0 ? balanceA.multiply(p).toFixed() : '');
        } else {
          const field = balanceA.multiply(pair?.reserve1).lessThan(balanceB.multiply(pair?.reserve0))
            ? Field.CURRENCY_A
            : Field.CURRENCY_B;
          onSlide(field, percent !== 0 ? currencyBalances[field]!.multiply(p).toFixed() : '');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent, needUpdate, currencyBalances, onSlide, pair, currencies]);

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  const isValid = !error;

  const handleCurrencyASelect = React.useCallback(
    (currencyA: Currency) => {
      onCurrencySelection(Field.CURRENCY_A, currencyA);

      const isCrossChainCompatible = Object.keys(CROSSCHAIN_SUPPORTED_TOKENS).includes(currencyA.wrapped.address || '');
      if (isCrossChainCompatible) {
        setChainSelectorOpen(true);
        if (DEFAULT_TOKEN_CHAIN[currencyA.symbol as string]) {
          setCrossChainCurrencyA(DEFAULT_TOKEN_CHAIN[currencyA.symbol as string]);
        }
      } else {
        setCrossChainCurrencyA('icon');
      }
    },
    [onCurrencySelection],
  );

  const handleCurrencyBSelect = React.useCallback(
    (currencyB: Currency) => onCurrencySelection(Field.CURRENCY_B, currencyB),
    [onCurrencySelection],
  );

  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      };
    },
    {},
  );

  const handleTypeAInput = React.useCallback(
    (typed: string) => {
      if (new BigNumber(typed).isLessThan(maxAmounts[Field.CURRENCY_A]?.toFixed() || 0) || typed === '') {
        onFieldAInput(typed);
      }
    },
    [maxAmounts, onFieldAInput],
  );
  const handleTypeBInput = React.useCallback(
    (typed: string) => {
      if (new BigNumber(typed).isLessThan(maxAmounts[Field.CURRENCY_B]?.toFixed() || 0) || typed === '') {
        onFieldBInput(typed);
      }
    },
    [maxAmounts, onFieldBInput],
  );

  const handlePercentSelect = (field: Field) => (percent: number) => {
    field === Field.CURRENCY_A
      ? onFieldAInput(maxAmounts[Field.CURRENCY_A]?.multiply(percent).divide(100)?.toExact() ?? '')
      : onFieldBInput(maxAmounts[Field.CURRENCY_B]?.multiply(percent).divide(100)?.toExact() ?? '');
  };

  const isQueue = isNativeCurrency(currencies[Field.CURRENCY_A]);

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel
          bg="bg3"
          p={[3, 7]}
          flexDirection="column"
          alignItems="stretch"
          flex={1}
          minHeight={account && [325, 365, 'auto']}
        >
          <AutoColumn gap="md">
            <AutoColumn gap="md">
              <Typography variant="h2">
                <Trans>Supply liquidity</Trans>
              </Typography>
            </AutoColumn>

            <AutoColumn gap="md">
              <Flex>
                <CurrencyInputPanel
                  account={account}
                  value={formattedAmounts[Field.CURRENCY_A]}
                  currencySelectionType={CurrencySelectionType.TRADE_MINT_BASE}
                  currency={currencies[Field.CURRENCY_A]}
                  onUserInput={handleTypeAInput}
                  onCurrencySelect={handleCurrencyASelect}
                  onPercentSelect={handlePercentSelect(Field.CURRENCY_A)}
                  isCrossChainToken={isCurrencyACrosschainCompatible}
                />
              </Flex>
              {isCurrencyACrosschainCompatible && (
                <CrossChainOptions
                  currency={currencies[Field.CURRENCY_A]}
                  chain={crossChainCurrencyA}
                  setChain={setCrossChainCurrencyA}
                  isOpen={chainSelectorOpen}
                  setOpen={setChainSelectorOpen}
                />
              )}
            </AutoColumn>

            <AutoColumn gap="md" hidden={isQueue}>
              <Flex>
                <CurrencyInputPanel
                  account={account}
                  value={formattedAmounts[Field.CURRENCY_B]}
                  currencySelectionType={CurrencySelectionType.TRADE_MINT_QUOTE}
                  currency={currencies[Field.CURRENCY_B]}
                  onUserInput={handleTypeBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onPercentSelect={handlePercentSelect(Field.CURRENCY_B)}
                />
              </Flex>
            </AutoColumn>
          </AutoColumn>
          <Flex mt={3} justifyContent="flex-end">
            <WalletSection AChain={crossChainCurrencyA} BChain={crossChainCurrencyB} />
          </Flex>
          {currencies[Field.CURRENCY_A] &&
            currencies[Field.CURRENCY_B] &&
            !isQueue &&
            pairState === PairState.NOT_EXISTS && (
              <PoolPriceBar>
                <Flex flexDirection="column" alignItems="center" my={3} flex={1}>
                  <Typography>
                    <Typography color="white" as="span">
                      {price?.toSignificant(6) ?? '-'}
                    </Typography>{' '}
                    {currencies[Field.CURRENCY_B]?.symbol}
                  </Typography>
                  <Typography pt={1}>per {currencies[Field.CURRENCY_A]?.symbol}</Typography>
                </Flex>
                <VerticalDivider />
                <Flex flexDirection="column" alignItems="center" my={3} flex={1}>
                  <Typography>
                    <Typography color="white" as="span">
                      {price?.invert()?.toSignificant(6) ?? '-'}
                    </Typography>{' '}
                    {currencies[Field.CURRENCY_A]?.symbol}
                  </Typography>
                  <Typography pt={1}>per {currencies[Field.CURRENCY_B]?.symbol}</Typography>
                </Flex>
              </PoolPriceBar>
            )}
          {pairState === PairState.EXISTS &&
            account &&
            ((currencyBalances[Field.CURRENCY_A]?.currency.symbol === 'ICX' &&
              maxAmountSpend(currencyBalances[Field.CURRENCY_A])?.greaterThan(BIGINT_ZERO)) ||
              (maxAmountSpend(currencyBalances[Field.CURRENCY_A])?.greaterThan(BIGINT_ZERO) &&
                maxAmountSpend(currencyBalances[Field.CURRENCY_B])?.greaterThan(BIGINT_ZERO))) && (
              <Slider mt={5}>
                <Nouislider
                  start={[0]}
                  padding={[0, 0]}
                  connect={[true, false]}
                  range={{
                    min: [0],
                    max: [100],
                  }}
                  onSlide={handleSlider}
                  step={0.01}
                  instanceRef={instance => {
                    if (instance) {
                      sliderInstance.current = instance;
                    }
                  }}
                />
              </Slider>
            )}
          <AutoColumn gap="5px" mt={5}>
            <Flex justifyContent="center">
              {isValid ? (
                <Button color="primary" onClick={handleSupply}>
                  {pairState === PairState.EXISTS && t`Supply`}
                  {pairState === PairState.NOT_EXISTS && t`Create pool`}
                </Button>
              ) : (
                <Button disabled={!!account} color="primary" onClick={handleConnectToWallet}>
                  {account ? error : t`Supply`}
                </Button>
              )}
            </Flex>
          </AutoColumn>
        </BrightPanel>

        <LPDescription />
      </SectionPanel>

      <SupplyLiquidityModal
        isOpen={showSupplyConfirm}
        onClose={handleSupplyConfirmDismiss}
        parsedAmounts={amounts}
        currencies={currencies}
        AChain={crossChainCurrencyA}
        BChain={crossChainCurrencyB}
      />
    </>
  );
}

const AutoColumn = styled(Box)<{
  gap?: 'sm' | 'md' | 'lg' | string;
  justify?: 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between';
}>`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: ${({ gap }) => (gap === 'sm' && '10px') || (gap === 'md' && '15px') || (gap === 'lg' && '25px') || gap};
  justify-items: ${({ justify }) => justify && justify};
`;

const PoolPriceBar = styled(Flex)`
  background-color: #32627d;
  margin-top: 25px;
  border-radius: 10px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: initial;
  background-color: ${({ theme }) => theme.colors.divider};
`;
