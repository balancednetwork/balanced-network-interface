import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';
import { useDepositedValue } from 'store/collateral/hooks';
import { useLoanBorrowedValue } from 'store/loan/hooks';

const LoanPanel = () => {
  const { account } = useIconReact();

  enum loanField {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
  }

  const stakedICXAmount = useDepositedValue();
  const loanBorrowedValue = useLoanBorrowedValue();

  const totalLoanAmount = stakedICXAmount.div(4).minus(loanBorrowedValue);

  const [{ independentLoanField, typedLoanValue }, setLoanState] = React.useState({
    independentLoanField: loanField.LEFT,
    typedLoanValue: '',
  });

  const dependentLoanField: loanField = independentLoanField === loanField.LEFT ? loanField.RIGHT : loanField.LEFT;

  const parsedLoanAmount = {
    [independentLoanField]: new BigNumber(typedLoanValue || '0'),
    [dependentLoanField]: totalLoanAmount.minus(new BigNumber(typedLoanValue || '0')),
  };

  const formattedLoanAmounts = {
    [independentLoanField]: typedLoanValue || '0',
    [dependentLoanField]: parsedLoanAmount[dependentLoanField].isZero()
      ? '0'
      : parsedLoanAmount[dependentLoanField].toFixed(2),
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoanConfirm = () => {
    if (!account) return;
    const newBorrowValue = parseFloat(formattedLoanAmounts[loanField.LEFT]);

    if (newBorrowValue === 0 && loanBorrowedValue.toNumber() > 0) {
      //repayLoan(loanBorrowedValue);
    } else if (newBorrowValue > loanBorrowedValue.toNumber() && loanBorrowedValue.toNumber() > 0) {
      //addLoan(newBorrowValue);
    }
  };

  /*function repayLoan(value) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const data = '0x' + Buffer.from('{"method": "_repay_loan", "params": {}}', 'utf8').toString('hex');
    const valueParam = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: LOAN_ADDRESS, _value: valueParam, _data: data };

    const loanPayload = callTransactionBuilder
      .from(account)
      .to(bnUSD_ADDRESS)
      .method('transfer')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      .value(0)
      .version(IconConverter.toBigNumber(3))
      .build();

    const parsed = {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(loanPayload),
      id: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload: parsed,
        },
      }),
    );
  }

  function addLoan(value) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    const data2 = Buffer.from(
      '", "_asset": "ICD", "_amount": ' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop() + '}}',
      'utf8',
    ).toString('hex');
    const params = { _data1: data1, _data2: data2 };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(LOAN_ADDRESS)
      .method('addCollateral')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(2000000))
      .value(IconAmount.of(value / (ratioValue.ICXUSDratio?.toNumber() || 0), IconAmount.Unit.ICX).toLoop())
      .version(IconConverter.toBigNumber(3))
      .build();

    const parsed = {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(depositPayload),
      id: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload: parsed,
        },
      }),
    );
  }*/

  const [isLoanEditing, setLoanEditing] = React.useState<boolean>(false);

  const handleLoanAdjust = () => {
    setLoanEditing(true);
  };

  const handleLoanCancel = () => {
    setLoanEditing(false);
  };

  const handleLoanSlider = (values: string[], handle: number) => {
    setLoanState(state => ({ independentLoanField: state['independentLoanField'], typedLoanValue: values[handle] }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBorrowedAmountType = React.useCallback(
    (value: string) => {
      setLoanState({ independentLoanField: loanField.LEFT, typedLoanValue: value });
    },
    [setLoanState, loanField.LEFT],
  );

  return (
    <BoxPanel bg="bg3">
      <Flex justifyContent="space-between" alignItems="center">
        <Typography variant="h2">Loan</Typography>

        <Box>
          {isLoanEditing ? (
            <>
              <TextButton onClick={handleLoanCancel}>Cancel</TextButton>
              <Button>Confirm</Button>
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
          start={[10000]}
          padding={[0]}
          connect={[true, false]}
          onSlide={handleLoanSlider}
          range={{
            min: [0],
            max: [15000],
          }}
        />
      </Box>

      <Flex justifyContent="space-between">
        <Box width={[1, 1 / 2]} mr={4}>
          <CurrencyField
            editable={isLoanEditing}
            isActive
            label="Borrowed"
            tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
            value={formattedLoanAmounts[loanField.LEFT]}
            currency={CURRENCYLIST['bnusd']}
          />
        </Box>

        <Box width={[1, 1 / 2]} ml={4}>
          <CurrencyField
            editable={isLoanEditing}
            isActive={false}
            label="Available"
            tooltipText="The amount of ICX available to deposit from your wallet."
            value={formattedLoanAmounts[loanField.RIGHT]}
            currency={CURRENCYLIST['bnusd']}
          />
        </Box>
      </Flex>
    </BoxPanel>
  );
};

export default LoanPanel;
