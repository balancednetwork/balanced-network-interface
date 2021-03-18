import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';
import { useDepositedValue } from 'store/collateral/hooks';
import { useLoanBorrowedValue } from 'store/loan/hooks';

const LoanPanel = () => {
  const { account } = useIconReact();

  enum Field {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
  }

  const stakedICXAmount = useDepositedValue();
  const loanBorrowedValue = useLoanBorrowedValue();
  const totalLoanAmount = stakedICXAmount.div(4).minus(loanBorrowedValue);
  // const [loanAmountCache, changeLoanAmountCache] = React.useState(new BigNumber(0));

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoanConfirm = () => {
    if (!account) return;
    const newBorrowValue = parseFloat(formattedAmounts[Field.LEFT]);

    if (newBorrowValue === 0 && loanBorrowedValue.toNumber() > 0) {
      //repayLoan(loanBorrowedValue);
      bnJs
        .eject({ account: account })
        .bnUSD.repayLoan(loanBorrowedValue.toNumber())
        .then(res => {
          console.log('res', res);
        })
        .catch(e => {
          console.error('error', e);
        });
    } else {
      //addLoan(newBorrowValue);
      bnJs
        .eject({ account: account })
        //.sICX.borrowAdd(newBorrowValue)
        .Loans.borrowAdd(newBorrowValue)
        .then(res => {
          console.log('res', res);
        })
        .catch(e => {
          console.error('error', e);
        });
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
    setLoanState(state => ({ independentField: state['independentField'], typedValue: values[handle] }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBorrowedAmountType = React.useCallback(
    (value: string) => {
      sliderInstance.current.noUiSlider.set(new BigNumber(value).toNumber());
      setLoanState({ independentField: Field.LEFT, typedValue: value });
    },
    [setLoanState, Field.LEFT],
  );

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (!account) return;
    setLoanState({ independentField: Field.LEFT, typedValue: loanBorrowedValue.toFixed(2) });
  }, [account, setLoanState, Field.LEFT, loanBorrowedValue]);

  return (
    <BoxPanel bg="bg3">
      <Flex justifyContent="space-between" alignItems="center">
        <Typography variant="h2">Loan</Typography>

        <Box>
          {isLoanEditing ? (
            <>
              <TextButton onClick={handleLoanCancel}>Cancel</TextButton>
              <Button onClick={handleLoanConfirm}>Confirm</Button>
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
  );
};

export default LoanPanel;
