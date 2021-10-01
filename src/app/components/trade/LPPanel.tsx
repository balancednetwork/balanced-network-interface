import React from 'react';

import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import PairSelector from 'app/components/trade/PairSelector';
import { Typography } from 'app/theme';
import { useWalletModalToggle } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useMintState, useDerivedMintInfo, useMintActionHandlers } from 'store/mint/hooks';
import { CurrencyAmount, Currency, Percent } from 'types/balanced-sdk-core';
import { maxAmountSpend } from 'utils';

import LPDescription from './LPDescription';
import SupplyLiquidityModal from './SupplyLiquidityModal';
import { SectionPanel, BrightPanel } from './utils';

const Slider = styled(Box)`
  margin-top: 40px;
  ${({ theme }) => theme.mediaWidth.upSmall`
     margin-top: 25px;
  `}
`;

function WalletSection() {
  const { account } = useIconReact();
  const { currencies, currencyBalances, parsedAmounts } = useDerivedMintInfo();

  if (account) {
    let baseValStr = '-';
    if (currencyBalances[Field.CURRENCY_A]) {
      baseValStr = parsedAmounts[Field.CURRENCY_A]
        ? `${currencyBalances[Field.CURRENCY_A]!.subtract(parsedAmounts[Field.CURRENCY_A]!).toSignificant(4)}`
        : `${currencyBalances[Field.CURRENCY_A]?.toSignificant(4)}`;
    }

    let quoteValStr = '-';
    if (currencyBalances[Field.CURRENCY_B]) {
      quoteValStr = parsedAmounts[Field.CURRENCY_B]
        ? `${currencyBalances[Field.CURRENCY_B]!.subtract(parsedAmounts[Field.CURRENCY_B]!).toSignificant(4)}`
        : `${currencyBalances[Field.CURRENCY_B]?.toSignificant(4)}`;
    }

    if (currencies[Field.CURRENCY_A]?.symbol === 'sICX' && currencies[Field.CURRENCY_B]?.symbol === 'ICX') {
      return (
        <Flex flexDirection="row" justifyContent="center" alignItems="center">
          <Typography>{`Wallet: ${quoteValStr} ${currencies[Field.CURRENCY_B]?.symbol}`}</Typography>
        </Flex>
      );
    } else {
      return (
        <Flex flexDirection="row" justifyContent="center" alignItems="center">
          <Typography>
            {`Wallet: ${baseValStr} ${currencies[Field.CURRENCY_A]?.symbol} / 
                      ${quoteValStr} ${currencies[Field.CURRENCY_B]?.symbol}`}
          </Typography>
        </Flex>
      );
    }
  } else {
    return null;
  }
}

export default function LPPanel() {
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
  };

  const { independentField, typedValue, otherTypedValue, inputType } = useMintState();
  const {
    dependentField,
    pairInfo,
    pair,
    parsedAmounts,
    noLiquidity,
    currencyBalances,
    currencies,
    liquidityMinted,
    availableLiquidity,
    // poolTokenPercentage,
    error,
  } = useDerivedMintInfo();

  const { onFieldAInput, onFieldBInput, onSlide } = useMintActionHandlers(noLiquidity);

  const [percent, setPercent] = React.useState(0);

  React.useEffect(() => {
    const balanceA = maxAmountSpend(currencyBalances[Field.CURRENCY_A]);
    const balanceB = maxAmountSpend(currencyBalances[Field.CURRENCY_B]);

    if (balanceA && balanceB && pair && pair.reserve0 && pair.reserve1) {
      const p = new Percent(Math.floor(percent * 100), 10_000);

      if (pairInfo.id === BalancedJs.utils.POOL_IDS.sICXICX) {
        onSlide(Field.CURRENCY_B, percent !== 0 ? balanceB.multiply(p).toFixed() : '');
      } else {
        const field = balanceA.multiply(pair?.reserve1).lessThan(balanceB.multiply(pair?.reserve0))
          ? Field.CURRENCY_A
          : Field.CURRENCY_B;
        onSlide(field, percent !== 0 ? currencyBalances[field]!.multiply(p).toFixed() : '');
      }
    }
  }, [percent, currencyBalances, onSlide, pair, pairInfo.id]);

  React.useEffect(() => {
    setPercent(0);
  }, [pairInfo]);

  const handleSlider = (values: string[], handle: number) => {
    setPercent(parseFloat(values[handle]));
  };

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  const sliderValue =
    liquidityMinted && availableLiquidity
      ? Math.min(
          JSBI.toNumber(
            JSBI.multiply(JSBI.divide(liquidityMinted.quotient, availableLiquidity.quotient), JSBI.BigInt(100)),
          ),
          100,
        )
      : 0;
  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(sliderValue);
    }
  }, [inputType, sliderValue]);

  const isValid = !error;

  const isQueue = pairInfo.id === BalancedJs.utils.POOL_IDS.sICXICX;

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={[5, 7]} flexDirection="column" alignItems="stretch" flex={1}>
          <PairSelector />

          <Flex mt={3} hidden={isQueue}>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              showMaxButton={false}
              currency={currencies[Field.CURRENCY_A]}
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
              currency={currencies[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              id="supply-liquidity-input-token-b"
            />
          </Flex>

          <Flex mt={3} justifyContent="flex-end">
            <WalletSection />
          </Flex>

          {account && availableLiquidity && (
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
              <Button color="primary" marginTop={5} onClick={handleSupply}>
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
