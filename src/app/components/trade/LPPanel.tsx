import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Plus } from 'react-feather';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { Typography } from 'app/theme';
import { isNativeCurrency } from 'constants/tokens';
import { useWalletModalToggle } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useMintState, useDerivedMintInfo, useMintActionHandlers } from 'store/mint/hooks';
import { CurrencyAmount, Currency } from 'types/balanced-sdk-core';
import { maxAmountSpend } from 'utils';

import LPDescription from './LPDescription';
import SupplyLiquidityModal from './SupplyLiquidityModal';
import { SectionPanel, BrightPanel } from './utils';

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
    onFieldBInput('');
  };

  const { independentField, typedValue, otherTypedValue } = useMintState();
  const { dependentField, parsedAmounts, noLiquidity, currencies, currencyBalances, error } = useDerivedMintInfo();

  const { onFieldAInput, onFieldBInput, onCurrencySelection } = useMintActionHandlers(noLiquidity);

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  const isValid = !error;

  const handleCurrencyASelect = React.useCallback(
    (currencyA: Currency) => onCurrencySelection(Field.CURRENCY_A, currencyA),
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

  const handlePercentSelect = (field: Field) => (percent: number) => {
    field === Field.CURRENCY_A
      ? onFieldAInput(maxAmounts[Field.CURRENCY_A]?.multiply(percent).divide(100)?.toExact() ?? '')
      : onFieldBInput(maxAmounts[Field.CURRENCY_B]?.multiply(percent).divide(100)?.toExact() ?? '');
  };

  //
  const isQueue = isNativeCurrency(currencies[Field.CURRENCY_A]);

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={[5, 7]} flexDirection="column" alignItems="stretch" flex={1}>
          <AutoColumn gap="md">
            <AutoColumn gap="md">
              <Flex alignItems="center" justifyContent="space-between">
                <Typography variant="h2">Supply A</Typography>
                <Typography as="div" hidden={!account}>
                  {'Wallet: '}
                  {`${currencyBalances[Field.CURRENCY_A]?.toSignificant()} ${currencies[Field.CURRENCY_A]?.symbol}`}
                </Typography>
              </Flex>

              <Flex>
                <CurrencyInputPanel
                  id="supply-liquidity-input-token-a"
                  value={formattedAmounts[Field.CURRENCY_A]}
                  showMaxButton={false}
                  showCommonBases={false}
                  currency={currencies[Field.CURRENCY_A]}
                  onUserInput={onFieldAInput}
                  onCurrencySelect={handleCurrencyASelect}
                  onPercentSelect={handlePercentSelect(Field.CURRENCY_A)}
                />
              </Flex>
            </AutoColumn>

            <Flex alignItems="center" justifyContent="center" my={-1} hidden={isQueue}>
              <Plus />
            </Flex>

            <AutoColumn gap="md" hidden={isQueue}>
              <Flex alignItems="center" justifyContent="space-between">
                <Typography variant="h2">Supply B</Typography>
                <Typography as="div" hidden={!account}>
                  {'Wallet: '}
                  {`${currencyBalances[Field.CURRENCY_B]?.toSignificant()} ${currencies[Field.CURRENCY_B]?.symbol}`}
                </Typography>
              </Flex>

              <Flex>
                <CurrencyInputPanel
                  id="supply-liquidity-input-token-b"
                  value={formattedAmounts[Field.CURRENCY_B]}
                  showMaxButton={false}
                  showCommonBases={true}
                  currency={currencies[Field.CURRENCY_B]}
                  onUserInput={onFieldBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onPercentSelect={handlePercentSelect(Field.CURRENCY_B)}
                />
              </Flex>
            </AutoColumn>
          </AutoColumn>

          <AutoColumn gap="5px" mt={5}>
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
          </AutoColumn>
        </BrightPanel>

        <LPDescription />
      </SectionPanel>

      <SupplyLiquidityModal
        isOpen={showSupplyConfirm}
        onClose={handleSupplyConfirmDismiss}
        parsedAmounts={amounts}
        currencies={currencies}
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
