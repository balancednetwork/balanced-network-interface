import React from 'react';

import { Flex } from 'rebass';

import { Button } from 'app/components/Button';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';

import { useArchwayContext } from '../archway/ArchwayProvider';

const ArchwayTest = () => {
  const [tokenAmount, setTokenAmount] = React.useState<number>();
  const { chain_id, address, connectToWallet, signingClient, disconnect } = useArchwayContext();

  React.useEffect(() => {
    if (signingClient && address) {
      signingClient.getAllBalances(address).then(res => {
        try {
          setTokenAmount(parseInt(res[0].amount || '0') / 10 ** 18);
        } catch (e) {
          console.error(e);
          setTokenAmount(0);
        }
      });
    }
  }, [signingClient, address]);

  return (
    <BoxPanel bg="bg2" width="100%">
      <Typography variant="h2">Archway Test</Typography>
      <Flex mt={4}>
        {address ? (
          <Button onClick={disconnect}>Disconnect</Button>
        ) : (
          <Button onClick={connectToWallet}>Connect wallet</Button>
        )}
      </Flex>
      <Flex mt={4}>
        <Typography mr={2}>Chain ID: </Typography>
        <Typography fontWeight="700" color="text">
          {chain_id}
        </Typography>
      </Flex>
      <Flex mt={1}>
        <Typography mr={2}>Address: </Typography>
        <Typography fontWeight="700" color="text">
          {address}
        </Typography>
      </Flex>
      <Flex mt={1}>
        <Typography mr={2}>Arch tokens: </Typography>
        <Typography fontWeight="700" color="text">
          {address && tokenAmount?.toFixed(2)}
        </Typography>
      </Flex>
    </BoxPanel>
  );
};

export default ArchwayTest;
