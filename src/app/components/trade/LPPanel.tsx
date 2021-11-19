import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import LiquiditySelect from 'app/components/trade/LiquiditySelect';
import { Typography } from 'app/theme';
import { ZERO } from 'constants/index';
import { useWalletModalToggle } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useMintState, useDerivedMintInfo, useMintActionHandlers } from 'store/mint/hooks';
import { usePool, usePoolPair } from 'store/pool/hooks';
import { CurrencyAmount } from 'types';
import { formatBigNumber, maxAmountSpend } from 'utils';

import LPDescription from './LPDescription';
import SupplyLiquidityModal from './SupplyLiquidityModal';
import { SectionPanel, BrightPanel } from './utils';

const useCalculateLiquidity = (tokenAmountA: BigNumber, tokenAmountB: BigNumber): BigNumber => {
  const selectedPair = usePoolPair();
  const pool = usePool(selectedPair.poolId);

  if (pool && !pool.base.isZero() && !pool.quote.isZero()) {
    if (selectedPair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
      return tokenAmountB;
    }

    return BigNumber.min(tokenAmountA.times(pool.total).div(pool.base), tokenAmountB.times(pool.total).div(pool.quote));
  } else {
    return ZERO;
  }
};

const Slider = styled(Box)`
  margin-top: 40px;
  ${({ theme }) => theme.mediaWidth.upSmall`
     margin-top: 25px;
  `}
`;

export default function LPPanel() {
  const { account } = useIconReact();
  const toggleWalletModal = useWalletModalToggle();

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

  const { independentField, typedValue, otherTypedValue, inputType } = useMintState();
  const {
    dependentField,
    pair,
    pool,
    parsedAmounts,
    noLiquidity,
    currencyBalances,
    // liquidityMinted,
    // poolTokenPercentage,
    error,
  } = useDerivedMintInfo();

  const { onFieldAInput, onFieldBInput, onSlide } = useMintActionHandlers(noLiquidity);

  const [percent, setPercent] = React.useState(0);

  React.useEffect(() => {
    if (pool && !pool.total.isZero()) {
      if (pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        onSlide(
          Field.CURRENCY_B,
          maxAmountSpend(new CurrencyAmount('ICX', currencyBalances[Field.CURRENCY_B]))!
            .raw.times(percent)
            .div(100)
            .toFixed(),
        );
      } else {
        const field = currencyBalances[Field.CURRENCY_A]
          .times(pool.quote)
          .isLessThan(currencyBalances[Field.CURRENCY_B].times(pool.base))
          ? Field.CURRENCY_A
          : Field.CURRENCY_B;
        onSlide(field, currencyBalances[field].times(percent).div(100).toFixed());
      }
    }
  }, [percent, currencyBalances, onSlide, pool, pair.poolId]);

  React.useEffect(() => {
    setPercent(0);
  }, [pair]);

  const handleSlider = (values: string[], handle: number) => {
    setPercent(parseFloat(values[handle]));
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

  const totalLiquidity = useCalculateLiquidity(currencyBalances[Field.CURRENCY_A], currencyBalances[Field.CURRENCY_B]);
  const liquidity = useCalculateLiquidity(parsedAmounts[Field.CURRENCY_A], parsedAmounts[Field.CURRENCY_B]);
  const sliderValue = Math.min(liquidity.div(totalLiquidity).times(100).toNumber(), 100);
  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(sliderValue);
    }
  }, [inputType, sliderValue]);

  const isValid = !error;

  const baseDisplay = `${formatBigNumber(
    currencyBalances[Field.CURRENCY_A].minus(formattedAmounts[Field.CURRENCY_A] || new BigNumber(0)),
    'currency',
  )} 
    ${pair.baseCurrencyKey}`;

  const quoteDisplay = `${formatBigNumber(
    currencyBalances[Field.CURRENCY_B].minus(formattedAmounts[Field.CURRENCY_B] || new BigNumber(0)),
    'currency',
  )} 
  ${pair.quoteCurrencyKey}`;

  const walletDisplayString =
    pair.baseCurrencyKey === 'sICX' && pair.quoteCurrencyKey === 'ICX'
      ? `${quoteDisplay}`
      : `${baseDisplay} / ${quoteDisplay}`;

  const isQueue = pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX;

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={[5, 7]} flexDirection="column" alignItems="stretch" flex={1}>
          <LiquiditySelect />

          <Flex mt={3} hidden={isQueue}>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              showMaxButton={false}
              currency={pair.baseCurrencyKey}
              onUserInput={onFieldAInput}
              id="supply-liquidity-input-token-a"
            />
          </Flex>

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

          <Typography mt={3} textAlign="right">
            Wallet:&nbsp;
            {walletDisplayString}
          </Typography>

          {account && !totalLiquidity.isZero() && (
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
          <Flex justifyContent="center">
            {isValid ? (
              <Button
                // disabled={showMinimumTooltip}
                color="primary"
                marginTop={5}
                onClick={handleSupply}
              >
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
