import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { isAddress } from 'icon-sdk-js/lib/data/Validator.js';
import { isEmpty } from 'lodash';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import { useTheme } from 'styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletBalances } from 'store/wallet/hooks';
import { CurrencyAmount, Currency, Token } from 'types/balanced-sdk-core';
import { maxAmountSpend, parseUnits, toHex } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Grid, MaxButton } from './utils';

export default function SendPanel({ currency }: { currency: Currency }) {
  const [value, setValue] = React.useState('');

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleCurrencyInput = (value: string) => {
    setValue(value);
  };

  const [address, setAddress] = React.useState('');

  const handleAddressInput = (value: string) => {
    setAddress(value);
  };

  const { account } = useIconReact();

  const wallet = useWalletBalances();

  const walletAmount = CurrencyAmount.fromRawAmount(
    currency,
    parseUnits(wallet[currency.symbol!].toFixed(), currency.decimals!),
  );
  const maxAmount = new BigNumber(maxAmountSpend(walletAmount)?.toFixed() || '0');

  const handleMax = () => {
    setValue(maxAmount.toFixed());
  };

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;

    setOpen(!open);
  };

  const beforeAmount = wallet[currency.symbol!];

  const differenceAmountBN = useMemo(() => (isNaN(parseFloat(value)) ? new BigNumber(0) : new BigNumber(value)), [
    value,
  ]);

  const differenceAmount = useMemo(() => {
    if (differenceAmountBN.isZero()) return CurrencyAmount.fromRawAmount(beforeAmount.currency, 0);
    const [num, deno] = differenceAmountBN.toFraction();
    return CurrencyAmount.fromFractionalAmount(beforeAmount.currency, num.toFixed(), deno.toFixed());
  }, [differenceAmountBN, beforeAmount.currency]);

  const afterAmount = beforeAmount.subtract(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleSend = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const contractCall =
      currency.symbol === 'ICX'
        ? bnJs.inject({ account }).transfer(address, differenceAmountBN)
        : bnJs
            .inject({ account })
            .getContract((currency as Token).address)
            .transfer(address, toHex(differenceAmount));

    contractCall
      .then((res: any) => {
        if (!isEmpty(res.result)) {
          addTransaction(
            { hash: res.result },
            {
              pending: `Sending ${currency.symbol}...`,
              summary: `Sent ${differenceAmountBN.dp(2).toFormat()} ${currency.symbol} to ${address}.`,
            },
          );
          toggleOpen();
          setValue('');
          setAddress('');
        } else {
          console.error(res);
        }
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const isDisabled =
    !isAddress(address) ||
    differenceAmountBN.isNegative() ||
    differenceAmountBN.isZero() ||
    differenceAmountBN.isGreaterThan(maxAmount);

  const hasEnoughICX = useHasEnoughICX();

  const theme = useTheme();

  return (
    <>
      <Grid>
        <Flex alignItems="center" justifyContent="space-between">
          <Typography variant="h3">Send {currency.symbol}</Typography>
          <MaxButton onClick={handleMax}>Send max</MaxButton>
        </Flex>

        <CurrencyInputPanel
          value={value}
          currency={currency}
          onUserInput={handleCurrencyInput}
          id={`${currency.symbol}-currency-input-in-wallet-panel`}
        />

        <AddressInputPanel value={address} onUserInput={handleAddressInput} />
      </Grid>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        <Button onClick={toggleOpen} disabled={isDisabled}>
          Send
        </Button>
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Send asset?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${differenceAmountBN.dp(2).toFormat()} ${currency?.symbol}`}
          </Typography>

          <Typography textAlign="center" mb="2px" mt="20px">
            Address
          </Typography>

          <Typography variant="p" textAlign="center" margin={'auto'} maxWidth={200} fontSize={16}>
            {address}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {`${beforeAmount.toFixed(2, { groupSeparator: ',' })} ${currency?.symbol}`}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {`${afterAmount.toFixed(2, { groupSeparator: ',' })} ${currency?.symbol}`}
              </Typography>
            </Box>
          </Flex>
          {currency?.symbol === 'sICX' && (
            <Typography variant="content" textAlign="center" color={theme.colors.alert}>
              Do not send sICX to an exchange.
            </Typography>
          )}
          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button onClick={handleSend} fontSize={14} disabled={!hasEnoughICX}>
                  Send
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </>
  );
}
