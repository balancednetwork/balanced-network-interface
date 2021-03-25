import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';
import { useDepositedValue } from 'store/collateral/hooks';
import { useLoanBorrowedValue } from 'store/loan/hooks';
import { useRatioValue } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';

enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const LoanPanel = () => {
  const { account } = useIconReact();

  const stakedICXAmount = useDepositedValue();
  const loanBorrowedValue = useLoanBorrowedValue();
  const ratio = useRatioValue();

  const sICXUSD = (ratio.sICXICXratio || new BigNumber(0)).multipliedBy(ratio.ICXUSDratio || new BigNumber(0));
  const totalLoanAmount = stakedICXAmount.multipliedBy(sICXUSD).div(4);

  const [{ independentField, typedValue }, setLoanState] = React.useState({
    independentField: Field.LEFT,
    typedValue: '',
  });

  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalLoanAmount.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue || '0',
    [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
  };

  const [isLoanEditing, setLoanEditing] = React.useState<boolean>(false);

  const handleLoanAdjust = () => {
    setLoanEditing(true);
  };

  const handleLoanCancel = () => {
    setLoanState({ independentField: Field.LEFT, typedValue: loanBorrowedValue.toFixed(2) });
    setLoanEditing(false);
  };

  const handleLoanSlider = (values: string[], handle: number) => {
    setLoanState(state => ({ independentField: state['independentField'], typedValue: values[handle] }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBorrowedAmountType = React.useCallback(
    (value: string) => {
      sliderInstance.current.noUiSlider.set(new BigNumber(value).toNumber());
      setLoanState({ independentField: Field.LEFT, typedValue: value });
    },
    [setLoanState],
  );

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (!account) return;
    setLoanState({ independentField: Field.LEFT, typedValue: loanBorrowedValue.toFixed(2) });
  }, [account, setLoanState, loanBorrowedValue]);

  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => setOpen(!open);

  const addTransaction = useTransactionAdder();

  //before
  const beforeAmount = loanBorrowedValue;
  //after
  const afterAmount = parsedAmount[Field.LEFT];
  //difference = after-before
  const differenceAmount = afterAmount.minus(beforeAmount);
  //whether if repay or borrow
  const shouldBorrow = differenceAmount.isPositive();

  const handleLoanConfirm = () => {
    if (!account) return;

    if (shouldBorrow) {
      bnJs
        .eject({ account })
        .Loans.borrowAdd(differenceAmount.toNumber())
        .then(res => {
          addTransaction({ hash: res.result }, { summary: `Borrowed ${differenceAmount.toNumber()} bnUSD.` });
        })
        .catch(e => {
          console.error('error', e);
        });
    } else {
      bnJs
        .eject({ account })
        .bnUSD.repayLoan(differenceAmount.abs().toNumber())
        .then(res => {
          addTransaction({ hash: res.result }, { summary: `Repaid ${differenceAmount.abs().toNumber()} bnUSD.` });
        })
        .catch(e => {
          console.error('error', e);
        });
    }
  };

  return (
    <>
      <BoxPanel bg="bg3">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">Loan</Typography>

          <Box>
            {isLoanEditing ? (
              <>
                <TextButton onClick={handleLoanCancel}>Cancel</TextButton>
                <Button onClick={toggleOpen}>Confirm</Button>
              </>
            ) : (
              <Button onClick={handleLoanAdjust}>Borrow</Button>
            )}
          </Box>
        </Flex>

        <Box marginY={6}>
          <Nouislider
            disabled={!isLoanEditing}
            id="slider-collateral"
            start={[loanBorrowedValue.toNumber()]}
            padding={[0]}
            connect={[true, false]}
            range={{
              min: [0],
              max: [totalLoanAmount.toNumber()],
            }}
            instanceRef={instance => {
              if (instance && !sliderInstance.current) {
                sliderInstance.current = instance;
              }
            }}
            onSlide={handleLoanSlider}
          />
        </Box>

        <Flex justifyContent="space-between">
          <Box width={[1, 1 / 2]} mr={4}>
            <CurrencyField
              editable={isLoanEditing}
              isActive
              label="Borrowed"
              tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
              value={!account ? '-' : formattedAmounts[Field.LEFT]}
              currency={!account ? CURRENCYLIST['empty'] : CURRENCYLIST['bnusd']}
            />
          </Box>

          <Box width={[1, 1 / 2]} ml={4}>
            <CurrencyField
              editable={isLoanEditing}
              isActive={false}
              label="Available"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={!account ? '-' : formattedAmounts[Field.RIGHT]}
              currency={!account ? CURRENCYLIST['empty'] : CURRENCYLIST['bnusd']}
            />
          </Box>
        </Flex>
      </BoxPanel>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldBorrow ? 'Borrow Balanced Dollars?' : 'Repay Balanced Dollars?'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.toFixed(2)} bnUSD
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.toFixed(2)} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.toFixed(2)} bnUSD
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">Includes a fee of 14 bnUSD.</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button onClick={handleLoanConfirm} fontSize={14}>
              {shouldBorrow ? 'Borrow' : 'Repay'}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default LoanPanel;
