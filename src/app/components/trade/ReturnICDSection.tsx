import React from 'react';

import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

import { retireMessage } from './utils';

const Grid = styled.div`
  display: grid;
  grid-template-rows: auto;
  grid-gap: 15px;
`;

const ReturnICDSection = () => {
  const { account } = useIconReact();
  const [value, setValue] = React.useState('0');
  const [showRetireConfirm, setShowRetireConfirm] = React.useState(false);
  const addTransaction = useTransactionAdder();

  const walletBalance = useWalletBalanceValue();

  const handleInput = v => {
    setValue(v);
  };

  const handleRetireConfirm = () => {
    if (parseFloat(value) < 50) {
      console.log(`Can not retire with amount lower than minimum value`);
      return;
    }
    bnJs
      .eject({ account: account })
      .bnUSD.retireBnUSD(new BigNumber(value))
      .then(res => {
        console.log('res', res);
        setShowRetireConfirm(false);
        addTransaction(
          { hash: res.result },
          {
            summary: retireMessage(value),
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleShowRetireConfirm = () => {
    setShowRetireConfirm(true);
  };

  const handleRetireConfirmDismiss = () => {
    setShowRetireConfirm(false);
  };

  const below800 = useMedia('(max-width: 800px)');

  if (below800) {
    return null;
  }

  return (
    <DropdownText text="Retire bnUSD">
      <Box padding={5} bg="bg4">
        <Grid>
          <Typography variant="h2">Retire bnUSD</Typography>

          <Typography>Sell your bnUSD for $1 of sICX (staked ICX).</Typography>

          <CurrencyInputPanel
            currency={CURRENCYLIST['bnusd']}
            value={value}
            onUserInput={handleInput}
            showMaxButton={false}
            id="return-icd-input"
            bg="bg5"
          />

          <Flex flexDirection="column" alignItems="flex-end">
            <Typography mb={2}>Minimum: 50 bnUSD</Typography>
            <Typography variant="p">
              Wallet: {walletBalance.bnUSDbalance.toFixed(CURRENCYLIST['bnusd'].decimals).toString()} bnUSD
            </Typography>
          </Flex>

          <Divider />

          <Flex alignItems="flex-start" justifyContent="space-between">
            <Typography variant="p">Total</Typography>
            <Flex flexDirection="column" alignItems="flex-end">
              <Typography variant="p">0 sICX</Typography>
              <Typography variant="p" color="text1" fontSize={14}>
                ~ 0 sICX
              </Typography>
            </Flex>
          </Flex>
        </Grid>

        <Flex justifyContent="center" mt={5}>
          {showRetireConfirm ? (
            <Flex flexDirection="column" alignItems="stretch" m={1} width="100%">
              <Typography textAlign="center">Are you sure to retire {value} bnUSD ?</Typography>
              <Flex justifyContent="center" mt={1} pt={1}>
                <TextButton onClick={handleRetireConfirmDismiss}>Cancel</TextButton>
                <Button onClick={handleRetireConfirm}>Retire</Button>
              </Flex>
            </Flex>
          ) : (
            <Button onClick={handleShowRetireConfirm}>Retire bnUSD</Button>
          )}
        </Flex>
      </Box>
    </DropdownText>
  );
};

export default ReturnICDSection;
