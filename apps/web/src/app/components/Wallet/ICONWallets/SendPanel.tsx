import React from 'react';

import { useIconReact } from '@/packages/icon-react';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import { isEmpty } from 'lodash-es';
import { Box, Flex } from 'rebass/styled-components';
import { useTheme } from 'styled-components';

import AddressInputPanel from '@/app/components/AddressInputPanel';
import { Button, TextButton } from '@/app/components/Button';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { BIGINT_ZERO } from '@/constants/misc';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useHasEnoughICX, useICONWalletBalances } from '@/store/wallet/hooks';
import { maxAmountSpend, toCurrencyAmount, toDec } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance } from '@/utils/formatter';
import { Grid, MaxButton } from './utils';

export default function SendPanel({ currency }: { currency: Currency }) {
  const [value, setValue] = React.useState('');

  const handleCurrencyInput = (value: string) => {
    setValue(value);
  };

  const [address, setAddress] = React.useState('');

  const handleAddressInput = (value: string) => {
    setAddress(value);
  };

  const { account } = useIconReact();

  const wallet = useICONWalletBalances();
  const rates = useRatesWithOracle();

  const walletAmount = wallet[currency.wrapped.address];

  const maxAmount = maxAmountSpend(walletAmount) ?? CurrencyAmount.fromRawAmount(currency.wrapped, BIGINT_ZERO);

  const handleMax = () => {
    setValue(maxAmount.toFixed());
  };

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const beforeAmount = wallet[currency.wrapped.address];

  const differenceAmount = toCurrencyAmount(
    beforeAmount.currency.wrapped,
    Number.isNaN(parseFloat(value)) ? new BigNumber(0) : new BigNumber(value),
  );

  const afterAmount = beforeAmount.subtract(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleSend = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const contract =
      currency.wrapped.address === bnJs.ICX.address
        ? bnJs.inject({ account })
        : bnJs.inject({ account }).getContract(currency.wrapped.address);

    contract
      .transfer(address, toDec(differenceAmount))
      .then((res: any) => {
        if (!isEmpty(res.result)) {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Sending ${currency.symbol}...`,
              summary: t`Sent ${formatBalance(differenceAmount.toFixed(), rates?.[currency.symbol]?.toFixed())} ${currency.symbol} to ${address}.`,
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
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const isDisabled =
    !Validator.isAddress(address) ||
    differenceAmount.lessThan(BIGINT_ZERO) ||
    differenceAmount.equalTo(BIGINT_ZERO) ||
    differenceAmount.greaterThan(maxAmount);

  const hasEnoughICX = useHasEnoughICX();

  const theme = useTheme();

  return (
    <>
      <Grid>
        <Flex alignItems="center" justifyContent="space-between">
          <Typography variant="h3">
            <Trans>Send {currency.symbol}</Trans>
          </Typography>
          <MaxButton onClick={handleMax}>
            <Trans>Send max</Trans>
          </MaxButton>
        </Flex>

        <CurrencyInputPanel //
          value={value}
          currency={currency}
          onUserInput={handleCurrencyInput}
        />

        <AddressInputPanel value={address} onUserInput={handleAddressInput} />
      </Grid>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        <Button onClick={toggleOpen} disabled={isDisabled}>
          <Trans>Send</Trans>
        </Button>
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            <Trans>Send asset?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${formatBalance(differenceAmount.toFixed(), rates?.[currency.symbol]?.toFixed())} ${currency?.symbol}`}
          </Typography>

          <Typography textAlign="center" mb="2px" mt="20px">
            <Trans>Address</Trans>
          </Typography>

          <Typography variant="p" textAlign="center" margin={'auto'} maxWidth={200} fontSize={16}>
            {address}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {`${formatBalance(beforeAmount.toFixed(), rates?.[currency.symbol]?.toFixed())} ${currency?.symbol}`}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {`${formatBalance(afterAmount.toFixed(), rates?.[currency.symbol]?.toFixed())} ${currency?.symbol}`}
              </Typography>
            </Box>
          </Flex>
          {currency?.wrapped.address === bnJs.sICX.address && (
            <Typography variant="content" textAlign="center" color={theme.colors.alert}>
              <Trans>Do not send sICX to an exchange.</Trans>
            </Typography>
          )}
          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              <Trans>Cancel</Trans>
            </TextButton>
            <Button onClick={handleSend} fontSize={14} disabled={!hasEnoughICX}>
              <Trans>Send</Trans>
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
