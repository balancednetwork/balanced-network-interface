import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Flex, Box } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Tooltip from 'app/components/Tooltip';
import LiquiditySelect from 'app/components/trade/LiquiditySelect';
import { Typography } from 'app/theme';
import { MINIMUM_ICX_AMOUNT_IN_WALLET, SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useWalletModalToggle } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useMintState, useDerivedMintInfo, useMintActionHandlers } from 'store/mint/hooks';
import { usePool, usePoolPair } from 'store/pool/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import LPDescription from './LPDescription';
import SupplyLiquidityModal from './SupplyLiquidityModal';
import { SectionPanel, BrightPanel } from './utils';

const ZERO = new BigNumber(0);

const useAvailableLPTokenBalance = (): BigNumber => {
  const selectedPair = usePoolPair();
  const balances = useWalletBalances();
  const pool = usePool(selectedPair.poolId);

  if (selectedPair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
    return BigNumber.max(balances['ICX'].minus(MINIMUM_ICX_AMOUNT_IN_WALLET), ZERO);
  } else {
    if (pool && !pool.base.isZero() && !pool.quote.isZero()) {
      if (
        (balances[pool?.baseCurrencyKey] as BigNumber)
          .times(pool?.rate)
          .isLessThanOrEqualTo(balances[pool?.quoteCurrencyKey])
      ) {
        return balances[pool?.baseCurrencyKey].times(pool.total).div(pool.base);
      } else {
        return balances[pool?.quoteCurrencyKey].times(pool.total).div(pool.quote);
      }
    } else {
      return ZERO;
    }
  }
};

const useCalculateLPToken = (baseValue: string, quoteValue: string): BigNumber => {
  const selectedPair = usePoolPair();
  const balances = useWalletBalances();
  const pool = usePool(selectedPair.poolId);

  if (pool && !pool.base.isZero() && !pool.quote.isZero()) {
    if (selectedPair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
      return new BigNumber(baseValue).times(pool.total).div(pool.base);
    }

    if (
      (balances[pool?.baseCurrencyKey] as BigNumber)
        .times(pool?.rate)
        .isLessThanOrEqualTo(balances[pool?.quoteCurrencyKey])
    ) {
      return new BigNumber(baseValue).times(pool.total).div(pool.base);
    } else {
      return new BigNumber(quoteValue).times(pool.total).div(pool.quote);
    }
  } else {
    return ZERO;
  }
};

export default function LPPanel() {
  const { account } = useIconReact();
  const toggleWalletModal = useWalletModalToggle();
  const balances = useWalletBalances();

  // modal
  const [showSupplyConfirm, setShowSupplyConfirm] = React.useState(false);

  const handleSupplyConfirmDismiss = () => {
    setShowSupplyConfirm(false);
  };

  const [amounts, setAmounts] = React.useState<{ [field in Field]: BigNumber }>({
    [Field.CURRENCY_A]: ZERO,
    [Field.CURRENCY_B]: ZERO,
  });

  const handleConnectToWallet = () => {
    toggleWalletModal();
  };

  const handleSupply = () => {
    setShowSupplyConfirm(true);
    setAmounts(parsedAmounts);
    onFieldAInput('');
  };

  const maxSliderAmount = useAvailableLPTokenBalance();

  const { independentField, typedValue, otherTypedValue, inputType } = useMintState();
  const {
    dependentField,
    pair,
    pool,
    parsedAmounts,
    noLiquidity,
    // liquidityMinted,
    // poolTokenPercentage,
    error,
  } = useDerivedMintInfo();

  const { onFieldAInput, onFieldBInput, onSlide } = useMintActionHandlers(noLiquidity);

  const handleSlider = (values: string[], handle: number) => {
    if (pool && !pool.total.isZero()) {
      if (pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        onSlide(values[handle]);
      } else {
        const baseAmount = pool.base.times(new BigNumber(values[handle]).div(pool.total));
        onSlide(baseAmount.toFixed());
      }
    }
  };

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity
      ? otherTypedValue
      : parsedAmounts[dependentField].isZero()
      ? ''
      : parsedAmounts[dependentField].toFixed(6),
  };

  const sliderValue = useCalculateLPToken(formattedAmounts[Field.CURRENCY_A], formattedAmounts[Field.CURRENCY_B]);

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(sliderValue);
    }
  }, [inputType, sliderValue]);

  const isValid = !error;

  const baseDisplay = `${formatBigNumber(
    balances[pair.baseCurrencyKey].minus(formattedAmounts[Field.CURRENCY_A] || new BigNumber(0)),
    'currency',
  )} 
    ${pair.baseCurrencyKey}`;

  const quoteDisplay = `${formatBigNumber(
    balances[pair.quoteCurrencyKey].minus(formattedAmounts[Field.CURRENCY_B] || new BigNumber(0)),
    'currency',
  )} 
  ${pair.quoteCurrencyKey}`;

  const walletDisplayString =
    pair.baseCurrencyKey === 'sICX' && pair.quoteCurrencyKey === 'ICX'
      ? `${quoteDisplay}`
      : `${baseDisplay} / ${quoteDisplay}`;

  const issICXICXPool = pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX;
  const showMinimumTooltip =
    account && issICXICXPool
      ? parseFloat(formattedAmounts[Field.CURRENCY_B] || '0') > 0 &&
        parseFloat(formattedAmounts[Field.CURRENCY_B] || '0') < 10
      : false;

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={[5, 7]} flexDirection="column" alignItems="stretch" flex={1}>
          <Flex alignItems="flex-end">
            <Typography variant="h2">Supply:&nbsp;</Typography>
            <LiquiditySelect />
          </Flex>

          <Flex mt={3} hidden={issICXICXPool}>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              showMaxButton={false}
              currency={pair.baseCurrencyKey}
              onUserInput={onFieldAInput}
              id="supply-liquidity-input-token-a"
            />
          </Flex>

          <Tooltip
            style={{ zIndex: 1000 }}
            show={showMinimumTooltip}
            text={`10 ${pair.quoteCurrencyKey} minimum`}
            containerStyle={{ width: 'auto' }}
          >
            <Flex
              mt={3}
              sx={{
                position: 'relative',
              }}
            >
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_B]}
                showMaxButton={false}
                currency={pair.quoteCurrencyKey}
                onUserInput={onFieldBInput}
                id="supply-liquidity-input-token-b"
              />
            </Flex>
          </Tooltip>

          <Typography mt={3} textAlign="right">
            Wallet:&nbsp;
            {walletDisplayString}
          </Typography>

          {account && !maxSliderAmount.dp(2).isZero() && (
            <Box mt={5}>
              <Nouislider
                id="slider-supply"
                disabled={maxSliderAmount.dp(2).isZero()}
                start={[0]}
                padding={[0]}
                connect={[true, false]}
                range={{
                  min: [0],
                  max: [
                    maxSliderAmount.dp(2).isZero()
                      ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                      : maxSliderAmount.dp(2).toNumber(),
                  ],
                }}
                instanceRef={instance => {
                  if (instance && !sliderInstance.current && !maxSliderAmount.dp(2).isZero()) {
                    sliderInstance.current = instance;
                  }
                }}
                onSlide={handleSlider}
              />
            </Box>
          )}
          <Flex justifyContent="center">
            {isValid ? (
              <Button disabled={showMinimumTooltip} color="primary" marginTop={5} onClick={handleSupply}>
                Supply
              </Button>
            ) : (
              <Button disabled={!!account} color="primary" marginTop={5} onClick={handleConnectToWallet}>
                {account ? error : 'Supply'}
              </Button>
            )}
          </Flex>
        </BrightPanel>

        <LPDescription
          baseSuplying={new BigNumber(formattedAmounts[Field.CURRENCY_A])}
          quoteSupplying={new BigNumber(formattedAmounts[Field.CURRENCY_B])}
        />
      </SectionPanel>

      <SupplyLiquidityModal isOpen={showSupplyConfirm} onClose={handleSupplyConfirmDismiss} parsedAmounts={amounts} />
    </>
  );
}
