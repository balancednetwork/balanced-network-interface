import React from 'react';

import { Flex } from 'rebass';

import { getRlpEncodedMsg } from 'app/_xcall/utils';
import { Button } from 'app/components/Button';
import Divider from 'app/components/Divider';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';

import { useArchwayContext } from '../ArchwayProvider';
import { ARCHWAY_CONTRACTS, ARCHWAY_CW20_COLLATERAL } from '../config';

const ArchwayTest = () => {
  const [tokenAmount, setTokenAmount] = React.useState<number>();
  const [cw20Amount, setCw20Amount] = React.useState<number>();
  const [cw20bnUSDAmount, setCw20bnUSDAmount] = React.useState<number>();
  const [currentAllowance, setCurrentAllowance] = React.useState<string>();
  const { chain_id, address, connectToWallet, signingClient, disconnect, signingCosmWasmClient } = useArchwayContext();

  React.useEffect(() => {
    // get fee token amount
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

    // get collateral token amount
    if (signingCosmWasmClient && address) {
      ARCHWAY_CW20_COLLATERAL.address
        ? signingCosmWasmClient
            .queryContractSmart(ARCHWAY_CW20_COLLATERAL.address, { balance: { address } })
            .then(res => {
              try {
                const { balance } = res;
                setCw20Amount(parseInt(balance || '0') / 10 ** ARCHWAY_CW20_COLLATERAL.decimals);
              } catch (e) {
                console.log(e);
                setCw20Amount(0);
              }
            })
        : setCw20Amount(0);
    }

    // get AM allowance
    if (signingCosmWasmClient && address) {
      signingCosmWasmClient
        .queryContractSmart(ARCHWAY_CW20_COLLATERAL.address, {
          allowance: { owner: address, spender: ARCHWAY_CONTRACTS.assetManager },
        })
        .then(res => {
          setCurrentAllowance(res.allowance);
        });
    }
  }, [signingClient, signingCosmWasmClient, address]);

  // get bnUSD cw20 token amount
  if (signingCosmWasmClient && address) {
    ARCHWAY_CONTRACTS.bnusd
      ? signingCosmWasmClient.queryContractSmart(ARCHWAY_CONTRACTS.bnusd, { balance: { address } }).then(res => {
          try {
            const { balance } = res;
            console.log('bnUSD cw20 bal,', res);
            setCw20bnUSDAmount(parseInt(balance || '0') / 10 ** 18);
          } catch (e) {
            console.log(e);
            setCw20bnUSDAmount(0);
          }
        })
      : setCw20Amount(0);
  }

  const increaseAllowance = async () => {
    if (signingCosmWasmClient && address) {
      const msg = {
        increase_allowance: {
          spender: ARCHWAY_CONTRACTS.assetManager,
          amount: '100',
        },
      };
      try {
        const res = await signingCosmWasmClient.execute(address, ARCHWAY_CW20_COLLATERAL.address, msg, {
          amount: [{ amount: '1', denom: 'uconst' }],
          gas: '200000',
        });
        console.log(res);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const depositToIcon = async () => {
    //increase allowance
    if (signingCosmWasmClient && address) {
      const msg = {
        deposit: {
          token_address: ARCHWAY_CW20_COLLATERAL.address,
          amount: '10',
          to: '0x7.icon/hx2cb62eb17836201c7e4df1186348859dedc018ae',
          data: [],
        },
      };
      try {
        const res = await signingCosmWasmClient.execute(address, ARCHWAY_CONTRACTS.assetManager, msg, {
          amount: [{ amount: '1', denom: 'uconst' }],
          gas: '1200000',
        });
        console.log(res);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const borrowFromIcon = async () => {
    if (signingCosmWasmClient && address) {
      const msg = {
        send_call_message: {
          to: `0x7.icon/${bnJs.Loans.address}`,
          data: getRlpEncodedMsg(['xBorrow', 'TwitterAsset', '1000']),
        },
      };
      console.log(msg);
      try {
        const res = await signingCosmWasmClient.execute(address, ARCHWAY_CONTRACTS.xcall, msg, {
          amount: [{ amount: '1', denom: 'uconst' }],
          gas: '1000000',
        });
        console.log(res);
      } catch (e) {
        console.error(e);
      }
    }
  };

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
      <Flex mt={1}>
        <Typography mr={2}>CW20 twitter tokens: </Typography>
        <Typography fontWeight="700" color="text">
          {address && cw20Amount?.toFixed(6)}
        </Typography>
      </Flex>
      {/* deposit through asset manager */}
      {address && signingCosmWasmClient && (
        <>
          <Divider my={5}></Divider>
          <Typography variant="h3" fontSize={18} mb={4}>
            Asset Manager
          </Typography>
          <Flex alignItems="center">
            <Button onClick={increaseAllowance}>Increase Allowance</Button>
            <Typography ml={2} color="text">
              current AM allowance: {currentAllowance}
            </Typography>
          </Flex>
        </>
      )}
      {address && signingCosmWasmClient && (
        <Flex mt={3}>
          <Button onClick={depositToIcon}>Deposit collateral</Button>
        </Flex>
      )}
      {/* xCall token transfer */}
      {address && signingCosmWasmClient && (
        <>
          <Divider my={5}></Divider>
          <Typography variant="h3" fontSize={18} mb={4}>
            xCall
          </Typography>
        </>
      )}
      {address && signingCosmWasmClient && (
        <Flex mt={3} alignItems="center">
          <Button onClick={borrowFromIcon}>Borrow bnUSD</Button>
          <Typography ml={2} color="text">
            cw20 bnUSD balance: {cw20bnUSDAmount}
          </Typography>
        </Flex>
      )}
    </BoxPanel>
  );
};

export default ArchwayTest;
