import React, { useCallback } from 'react';

import Nouislider from '@/packages/nouislider-react';
import { Currency, CurrencyAmount, Percent } from '@balancednetwork/sdk-core';
import { XChainId } from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from '@/app/components/Button';
import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { BrightPanel, SectionPanel } from '@/app/components/Panel';
import { CurrencySelectionType } from '@/app/components/SearchModal/CurrencySearch';
import { Typography } from '@/app/theme';
import { BIGINT_ZERO } from '@/constants/misc';
import { PairState, usePool } from '@/hooks/useV2Pairs';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useDerivedMintInfo, useInitialSupplyLoad, useMintActionHandlers, useMintState } from '@/store/mint/hooks';
import { Field, InputType } from '@/store/mint/reducer';
import { maxAmountSpend } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import LPDescription from './LPDescription';
import SuggestStakingLPModal from './LiquidityDetails/SuggestStakingLPModal';
import SupplyLiquidityModal from './SupplyLiquidityModal';
import WalletSection from './WalletSection';

const Slider = styled(Box)`
  margin-top: 40px;
  ${({ theme }) => theme.mediaWidth.upSmall`
     margin-top: 25px;
  `}
`;

export default function LPPanel() {
  useInitialSupplyLoad();
  const toggleWalletModal = useWalletModalToggle();

  // modal
  const [showSupplyConfirm, setShowSupplyConfirm] = React.useState(false);
  const [showSuggestStakingLP, setShowSuggestStakingLP] = React.useState(false);

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
    lpXChainId,
    account,
  } = useDerivedMintInfo();
  const { onFieldAInput, onFieldBInput, onSlide, onCurrencySelection, onChainSelection } =
    useMintActionHandlers(noLiquidity);

  const sliderInstance = React.useRef<any>(null);

  const [{ percent, needUpdate }, setPercent] = React.useState({ percent: 0, needUpdate: false });

  const pool = usePool(pair?.poolId, `${lpXChainId}/${account}`);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    sliderInstance.current?.noUiSlider.set(0);
    setPercent({ percent: 0, needUpdate: false });
    onSlide(Field.CURRENCY_A, '');
  }, [currencies, onSlide]);

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
    if (inputType === InputType.text) {
      sliderInstance.current?.noUiSlider.set(sliderValue);
      setPercent({ percent: sliderValue, needUpdate: false });
    }
  }, [inputType, sliderValue]);

  React.useEffect(() => {
    if (needUpdate) {
      const balanceA = maxAmountSpend(currencyBalances[Field.CURRENCY_A]);
      const balanceB = maxAmountSpend(currencyBalances[Field.CURRENCY_B]);
      if (balanceA && balanceB && pair && pair.reserve0 && pair.reserve1) {
        const p = new Percent(Math.floor(percent * 100), 10_000);

        const field = balanceA.multiply(pair?.reserve1).lessThan(balanceB.multiply(pair?.reserve0))
          ? Field.CURRENCY_A
          : Field.CURRENCY_B;
        onSlide(field, percent !== 0 ? currencyBalances[field]!.multiply(p).toFixed() : '');
      }
    }
  }, [percent, needUpdate, currencyBalances, onSlide, pair]);

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  const isValid = !error;

  const handleCurrencyASelect = React.useCallback(
    (currencyA: Currency) => {
      onCurrencySelection(Field.CURRENCY_A, currencyA);
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
    const balanceA = maxAmountSpend(currencyBalances[Field.CURRENCY_A]);
    const balanceB = maxAmountSpend(currencyBalances[Field.CURRENCY_B]);

    if (balanceA && balanceB && pair && pair.reserve0 && pair.reserve1) {
      const p = new Percent(Math.floor(percent * 100), 10_000);

      if (field === Field.CURRENCY_A) {
        field = balanceA.multiply(pair?.reserve1).multiply(p).lessThan(balanceB.multiply(pair?.reserve0))
          ? Field.CURRENCY_A
          : Field.CURRENCY_B;
      } else {
        field = balanceB.multiply(pair?.reserve0).multiply(p).lessThan(balanceA.multiply(pair?.reserve1))
          ? Field.CURRENCY_B
          : Field.CURRENCY_A;
      }
    }

    field === Field.CURRENCY_A
      ? onFieldAInput(maxAmounts[Field.CURRENCY_A]?.multiply(percent).divide(100)?.toExact() ?? '')
      : onFieldBInput(maxAmounts[Field.CURRENCY_B]?.multiply(percent).divide(100)?.toExact() ?? '');
  };

  const handleLPChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.CURRENCY_A, xChainId);
    },
    [onChainSelection],
  );

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
                  xChainId={currencies[Field.CURRENCY_A]?.xChainId}
                  onChainSelect={handleLPChainSelection}
                  showCrossChainOptions={true}
                  showCrossChainBreakdown={true}
                />
              </Flex>
            </AutoColumn>

            <AutoColumn gap="md">
              <Flex>
                <CurrencyInputPanel
                  account={account}
                  value={formattedAmounts[Field.CURRENCY_B]}
                  currencySelectionType={CurrencySelectionType.TRADE_MINT_QUOTE}
                  currency={currencies[Field.CURRENCY_B]}
                  onUserInput={handleTypeBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onPercentSelect={handlePercentSelect(Field.CURRENCY_B)}
                  xChainId={currencies[Field.CURRENCY_B]?.xChainId}
                  showCrossChainOptions={true}
                  showCrossChainBreakdown={false}
                  onChainSelect={handleLPChainSelection}
                />
              </Flex>
            </AutoColumn>
          </AutoColumn>
          <Flex mt={3} justifyContent="flex-end">
            <WalletSection />
          </Flex>
          {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState === PairState.NOT_EXISTS && (
            <PoolPriceBar>
              <Flex flexDirection="column" alignItems="center" my={3} flex={1}>
                <Typography>
                  <Typography color="white" as="span">
                    {price?.toSignificant(6) ?? '-'}
                  </Typography>{' '}
                  {formatSymbol(currencies[Field.CURRENCY_B]?.symbol)}
                </Typography>
                <Typography pt={1}>per {formatSymbol(currencies[Field.CURRENCY_A]?.symbol)}</Typography>
              </Flex>
              <VerticalDivider />
              <Flex flexDirection="column" alignItems="center" my={3} flex={1}>
                <Typography>
                  <Typography color="white" as="span">
                    {price?.invert()?.toSignificant(6) ?? '-'}
                  </Typography>{' '}
                  {formatSymbol(currencies[Field.CURRENCY_A]?.symbol)}
                </Typography>
                <Typography pt={1}>per {formatSymbol(currencies[Field.CURRENCY_B]?.symbol)}</Typography>
              </Flex>
            </PoolPriceBar>
          )}
          {pairState === PairState.EXISTS &&
            account &&
            maxAmountSpend(currencyBalances[Field.CURRENCY_A])?.greaterThan(0) &&
            maxAmountSpend(currencyBalances[Field.CURRENCY_B])?.greaterThan(0) && (
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
        onSuccess={() => setShowSuggestStakingLP(true)}
      />

      {pool && (
        <SuggestStakingLPModal
          isOpen={showSuggestStakingLP}
          onClose={() => setShowSuggestStakingLP(false)}
          pool={pool}
        />
      )}
    </>
  );
}

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
