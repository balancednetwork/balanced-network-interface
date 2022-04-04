import React from 'react';

// import Transfer from 'btp/src/containers/Transfer';
import store from 'btp/src/store';
import { Provider } from 'react-redux';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import { Typography } from 'app/theme';

import Address from './Address';
import AssetToTransfer from './AssetToTransfer';
import NetworkSelector from './NetworkSelector';
// import WalletConnect from './Wallets/WalletConnect';

interface BTPProps {
  handleDismiss: (boolean) => void;
}

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 35px;
  margin-top: 15px;

  .full-width {
    grid-column: span 2;
  }
`;

const BTP = ({ handleDismiss }: BTPProps) => {
  return (
    <Provider store={store}>
      <Flex flexDirection={'column'} width={'100%'}>
        <Typography variant={'h2'}>Transfer assets</Typography>
        <Typography padding={'10px 0'}>Move assets between ICON and other blockchains</Typography>

        <Grid>
          <Box>
            <NetworkSelector label={'From'} />
          </Box>
          <Box>
            <NetworkSelector label={'To'} />
          </Box>
          <Box className="full-width">
            <AssetToTransfer />
          </Box>
          <Box className="full-width">
            <Address />
          </Box>
        </Grid>

        <Divider margin={'20px 0'} />
        <Flex justifyContent={'center'}>
          <TextButton onClick={() => handleDismiss(true)}>Cancel</TextButton>
          <Button>Transfer</Button>
        </Flex>
      </Flex>

      {/* <WalletConnect />
        
            <Transfer /> */}
    </Provider>
  );
};

export default BTP;
