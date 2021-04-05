import React from 'react';

import { Tabs, TabPanels, TabPanel } from '@reach/tabs';
import BigNumber from 'bignumber.js';
import { isAddress } from 'icon-sdk-js/lib/data/Validator.js';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Box, Flex } from 'rebass/styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

import { StyledTabList, StyledTab, Grid, MaxButton } from './utils';

export default function ICXWallet() {
  const [value, setValue] = React.useState('');

  const handleCurrencyInput = (value: string) => {
    setValue(value);
  };

  const [address, setAddress] = React.useState('');

  const handleAddressInput = (value: string) => {
    setAddress(value);
  };

  const { account } = useIconReact();

  const wallet = useWalletBalanceValue();

  const maxAmount = wallet.ICXbalance.minus(0.1).isNegative() ? new BigNumber(0) : wallet.ICXbalance.minus(0.1);

  const handleMax = () => {
    setValue(maxAmount.toFixed());
  };

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const beforeAmount = wallet.ICXbalance;

  const differenceAmount = isNaN(parseFloat(value)) ? new BigNumber(0) : new BigNumber(value);

  const afterAmount = beforeAmount.minus(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleSend = () => {
    bnJs
      .eject({ account })
      .transfer(address, differenceAmount)
      .then(res => {
        if (res.result) {
          addTransaction({ hash: res.result }, { summary: `Sent ${differenceAmount.toNumber()} ICX to ${address}.` });
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

  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabsChange = index => {
    setTabIndex(index);
  };

  const [list, setList] = React.useState<BigNumber[]>([]);

  React.useEffect(() => {
    const fetchUserUnstakeInfo = async () => {
      if (account) {
        const result = await bnJs.Staking.getUserUnstakeInfo(account);
        setList(result.map(record => convertLoopToIcx(new BigNumber(record[0], 16))));
      }
    };

    fetchUserUnstakeInfo();
  }, [account, tabIndex]);

  return (
    <BoxPanel bg="bg3">
      <Tabs index={tabIndex} onChange={handleTabsChange}>
        <StyledTabList>
          <StyledTab>Send</StyledTab>
          <StyledTab>Unstaking</StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <Grid>
              <Flex alignItems="center" justifyContent="space-between">
                <Typography variant="h3">Send ICX</Typography>
                <MaxButton onClick={handleMax}>Send max</MaxButton>
              </Flex>

              <CurrencyInputPanel
                value={value}
                showMaxButton={false}
                currency={CURRENCYLIST['icx']}
                onUserInput={handleCurrencyInput}
                id="icx-currency-input-in-icx-wallet"
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

              <Typography>Your ICX will be unstaked as more collateral is deposited into Balanced.</Typography>

              <Box>
                {list.map(item => (
                  <Typography variant="p">{item.dp(2).toFormat()} ICX unstaking</Typography>
                ))}
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
            {differenceAmount.dp(2).toFormat() + ' ICX'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' ICX'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + ' ICX'}
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
