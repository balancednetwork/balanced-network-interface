import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Flex, Box } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import LiquiditySelect from 'app/components/trade/LiquiditySelect';
import { Typography } from 'app/theme';
import { CURRENCY_LIST, SUPPORTED_PAIRS } from 'constants/currency';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
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

  if (pool && !pool.base.isZero() && !pool.quote.isZero()) {
    if (selectedPair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
      return balances['ICX'];
    }

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

  const handleSupply = () => {
    if (account) {
      setShowSupplyConfirm(true);
    } else {
      toggleWalletModal();
    }
  };

  const selectedPair = usePoolPair();

  const maxSliderAmount = useAvailableLPTokenBalance();

  const pool = usePool(selectedPair.poolId);
  const handleSlider = (values: string[], handle: number) => {
    if (pool && !pool.total.isZero()) {
      const baseAmount = pool.base.times(new BigNumber(values[handle]).div(pool.total));
      onFieldAInput(baseAmount.toFixed());
    }
  };

  const { independentField, typedValue, otherTypedValue } = useMintState();
  const {
    dependentField,
    // currencies,
    // pair,
    // pairState,
    // currencyBalances,
    parsedAmounts,
    // price,
    noLiquidity,
    // liquidityMinted,
    // poolTokenPercentage,
    // error
  } = useDerivedMintInfo();

  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity);

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity
      ? otherTypedValue
      : parsedAmounts[dependentField].isZero()
      ? ''
      : parsedAmounts[dependentField].toFixed(6),
  };

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={7} flexDirection="column" alignItems="stretch" flex={1}>
          <Flex alignItems="flex-end">
            <Typography variant="h2">Supply:&nbsp;</Typography>
            <LiquiditySelect />
          </Flex>

          <Flex mt={3}>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              showMaxButton={false}
              currency={CURRENCY_LIST[selectedPair.baseCurrencyKey.toLowerCase()]}
              onUserInput={onFieldAInput}
              id="supply-liquidity-input-token-a"
            />
          </Flex>

          <Flex mt={3} style={selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx' ? { display: 'none' } : {}}>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_B]}
              showMaxButton={false}
              currency={CURRENCY_LIST[selectedPair.quoteCurrencyKey.toLowerCase()]}
              onUserInput={onFieldBInput}
              id="supply-liquidity-input-token-b"
            />
          </Flex>

          <Typography mt={3} textAlign="right">
            Wallet: {formatBigNumber(balances[selectedPair.baseCurrencyKey], 'currency')} {selectedPair.baseCurrencyKey}
            {selectedPair === SUPPORTED_PAIRS[2]
              ? ''
              : ' / ' +
                formatBigNumber(balances[selectedPair.quoteCurrencyKey], 'currency') +
                ' ' +
                selectedPair.quoteCurrencyKey}
          </Typography>

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
                  maxSliderAmount.dp(2).isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : maxSliderAmount.dp(2).toNumber(),
                ],
              }}
              onSlide={handleSlider}
            />
          </Box>

          <Flex justifyContent="center">
            <Button color="primary" marginTop={5} onClick={handleSupply}>
              Supply
            </Button>
          </Flex>
        </BrightPanel>

        <LPDescription />
      </SectionPanel>

      <SupplyLiquidityModal isOpen={showSupplyConfirm} onClose={handleSupplyConfirmDismiss} />
    </>
  );
}
