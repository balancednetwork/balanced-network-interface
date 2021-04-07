import React from 'react';

import { Tabs, TabPanels, TabPanel } from '@reach/tabs';
import BigNumber from 'bignumber.js';
import { isAddress } from 'icon-sdk-js/lib/data/Validator.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST } from 'constants/currency';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

import { StyledTabList, StyledTab, Grid, MaxButton } from './utils';

export default function BALNWallet() {
  const [value, setValue] = React.useState('');

  const handleCurrencyInput = (value: string) => {
    setValue(value);
  };

  const [address, setAddress] = React.useState('');

  const handleAddressInput = (value: string) => {
    setAddress(value);
  };

  const { account } = useIconReact();

  const wallet = useWalletBalances();

  const maxAmount = wallet.BALNbalance;

  const handleMax = () => {
    setValue(maxAmount.toFixed());
  };

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const beforeAmount = wallet.BALNbalance;

  const differenceAmount = isNaN(parseFloat(value)) ? new BigNumber(0) : new BigNumber(value);

  const afterAmount = beforeAmount.minus(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleSend = () => {
    bnJs
      .eject({ account })
      .Baln.transfer(address, differenceAmount)
      .then(res => {
        if (res.result) {
          addTransaction(
            { hash: res.result },
            {
              pending: `Sending BALN...`,
              summary: `Sent ${differenceAmount.dp(2).toFormat()} BALN.`,
            },
          );
          toggleOpen();
          setValue('');
          setAddress('');
        } else {
          // to do
          // need to handle error case
          // for example: out of balance
          console.error(res);
        }
      });
  };

  const isDisabled =
    !isAddress(address) ||
    differenceAmount.isNegative() ||
    differenceAmount.isZero() ||
    differenceAmount.isGreaterThan(maxAmount);

  return (
    <BoxPanel bg="bg3">
      <Tabs>
        <StyledTabList>
          <StyledTab>Stake</StyledTab>
          <StyledTab>Send</StyledTab>
          <StyledTab>Unstaking</StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <Typography variant="h3">Stake Balance Tokens</Typography>

            <Typography my={1}>Stake your Balance Tokens to earn dividends.</Typography>

            <Box my={3}>
              <Nouislider
                disabled
                id="slider-collateral"
                start={[10000]}
                padding={[0]}
                connect={[true, false]}
                range={{
                  min: [0],
                  max: [15000],
                }}
              />
            </Box>

            <Flex my={1} alignItems="center" justifyContent="space-between">
              <Typography>0 / 724</Typography>
              <Typography>97% staked</Typography>
            </Flex>

            <Flex alignItems="center" justifyContent="center" mt={5}>
              <Button>Adjust</Button>
            </Flex>
          </TabPanel>

          <TabPanel>
            <Grid>
              <Flex alignItems="center" justifyContent="space-between">
                <Typography variant="h3">Send BALN</Typography>
                <MaxButton onClick={handleMax}>Send max</MaxButton>
              </Flex>

              <CurrencyInputPanel
                value={value}
                showMaxButton={false}
                currency={CURRENCY_LIST['baln']}
                onUserInput={handleCurrencyInput}
                id="baln-currency-input-in-baln-wallet"
              />

              <AddressInputPanel value={address} onUserInput={handleAddressInput} />
            </Grid>

            <Flex alignItems="center" justifyContent="center" mt={5}>
              <Button onClick={toggleOpen} disabled={isDisabled}>
                Send
              </Button>
            </Flex>
          </TabPanel>

          <TabPanel>
            <Grid>
              <Typography variant="h3">Unstaking</Typography>

              <Box>
                <Typography>Collateral unstaking</Typography>
                <Typography variant="p">9,716 ICX ~12 days remaining.</Typography>
              </Box>

              <Box>
                <Typography>Liquidity unstaking</Typography>
                <Typography variant="p">3,468 ICX ~5 days remaining.</Typography>
              </Box>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Send asset?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + ' BALN'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button onClick={handleSend} fontSize={14}>
              Send
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </BoxPanel>
  );
}
