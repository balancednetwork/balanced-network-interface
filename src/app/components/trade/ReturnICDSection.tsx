import React from 'react';

import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';
import { useRatioValue } from 'store/ratio/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

const Grid = styled.div`
  display: grid;
  grid-template-rows: auto;
  grid-gap: 15px;
`;

const ReturnICDSection = () => {
  const wallet = useWalletBalanceValue();
  const ratio = useRatioValue();

  const [retireAmount, setRetireAmount] = React.useState('0');
  const [receiveAmount, setReceiveAmount] = React.useState('0');

  const handleTypeInput = React.useCallback(
    (val: string) => {
      setRetireAmount(val);
      setReceiveAmount((parseFloat(val) / ratio.sICXbnUSDratio?.toNumber()).toFixed(2).toString());
    },
    [ratio],
  );

  const below800 = useMedia('(max-width: 800px)');

  if (below800) {
    return null;
  }

  return (
    <DropdownText text="Retire Balanced assets">
      <Box padding={5} bg="bg4">
        <Grid>
          <Typography variant="h2">Retire bnUSD</Typography>

          <Typography>Sell your bnUSD for ${ratio.sICXbnUSDratio?.toFixed(2)} of sICX (staked ICX).</Typography>

          <CurrencyInputPanel
            currency={CURRENCYLIST['bnusd']}
            value={retireAmount}
            onUserInput={handleTypeInput}
            showMaxButton={false}
            id="return-icd-input"
            bg="bg5"
          />

          <Flex flexDirection="column" alignItems="flex-end">
            <Typography mb={2}>Minimum: 1000 bnUSD</Typography>
            <Typography>Wallet: {wallet.bnUSDbalance?.toFixed(2)} bnUSD</Typography>
          </Flex>

          <Divider />

          <Flex alignItems="flex-start" justifyContent="space-between">
            <Typography variant="p">Total</Typography>
            <Flex flexDirection="column" alignItems="flex-end">
              <Typography variant="p">{receiveAmount} sICX</Typography>
              <Typography variant="p" color="text1" fontSize={14}>
                ~ {parseFloat(receiveAmount) * ratio.sICXICXratio?.toNumber()} ICX
              </Typography>
            </Flex>
          </Flex>
        </Grid>

        <Flex justifyContent="center" mt={5}>
          <Button>Retire bnUSD</Button>
        </Flex>
      </Box>
    </DropdownText>
  );
};

export default ReturnICDSection;
