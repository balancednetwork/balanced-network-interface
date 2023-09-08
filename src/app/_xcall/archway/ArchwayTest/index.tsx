import React from 'react';

import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass';

import { getRlpEncodedMsg } from 'app/_xcall/utils';
import { Button } from 'app/components/Button';
import Divider from 'app/components/Divider';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useAddOriginEvent, useXCallDestinationEvents, useXCallOriginEvents } from 'store/xCall/hooks';

import { useArchwayContext } from '../ArchwayProvider';
import { ARCHWAY_CONTRACTS, ARCHWAY_CW20_COLLATERAL } from '../config';
// import { BORROW_TX } from '../testnetChainInfo';
import { getXCallOriginEventDataFromArchway } from './helpers';

const ArchwayTest = () => {
  const [tokenAmount, setTokenAmount] = React.useState<number>();
  const [cw20Amount, setCw20Amount] = React.useState<number>();
  const [cw20bnUSDAmount, setCw20bnUSDAmount] = React.useState<number>();
  const [currentAllowance, setCurrentAllowance] = React.useState<string>();
  const { chain_id, address, connectToWallet, signingClient, disconnect, signingCosmWasmClient } = useArchwayContext();
  const { account } = useIconReact();

  const iconDestinationEvents = useXCallDestinationEvents('icon');
  const archwayOriginEvents = useXCallOriginEvents('archway');
  const addOriginEvent = useAddOriginEvent();

  const xCallData = React.useMemo(() => {
    if (iconDestinationEvents.length && archwayOriginEvents.length) {
      return iconDestinationEvents.map(event => {
        const { sn } = event;
        const archwayOrigin = archwayOriginEvents.find(archwayEvent => archwayEvent.sn === sn);
        if (archwayOrigin) {
          return {
            reqId: event.reqId,
            data: archwayOrigin?.data,
          };
        }
        return undefined;
      });
    }
  }, [iconDestinationEvents, archwayOriginEvents]);

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
          amount: '100000000',
        },
      };
      try {
        const res = await signingCosmWasmClient.execute(address, ARCHWAY_CW20_COLLATERAL.address, msg, {
          amount: [{ amount: '1', denom: 'aconst' }],
          gas: '200000',
        });
        console.log(res);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const depositToIcon = async () => {
    //needs allowance
    if (signingCosmWasmClient && address) {
      const fee = await signingCosmWasmClient.queryContractSmart(ARCHWAY_CONTRACTS.xcall, {
        get_fee: { nid: '0x7.icon', rollback: false },
      });

      console.log('fee: ', fee);

      const msg = {
        deposit: {
          token_address: ARCHWAY_CW20_COLLATERAL.address,
          amount: '100000',
          to: '0x7.icon/cx501cce20fc5d5a0e322d5a600a9903f3f4832d43',
        },
      };
      try {
        const res = await signingCosmWasmClient.execute(
          address,
          ARCHWAY_CONTRACTS.assetManager,
          msg,
          {
            amount: [{ amount: '1', denom: 'aconst' }],
            gas: '1200000',
          },
          undefined,
          [{ amount: '100000', denom: 'aconst' }],
        );
        console.log(res);

        const originEventData = getXCallOriginEventDataFromArchway(res.events);
        originEventData && addOriginEvent('archway', originEventData);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const depositToIconAndBorrow = async () => {
    if (signingCosmWasmClient && address) {
      const msg = {
        deposit: {
          token_address: ARCHWAY_CW20_COLLATERAL.address,
          amount: '100000',
          to: '0x7.icon/cx501cce20fc5d5a0e322d5a600a9903f3f4832d43',
          data: getRlpEncodedMsg(['{"_asset":"bnUSD","_amount":"10"}']),
        },
      };
      try {
        const res = await signingCosmWasmClient.execute(address, ARCHWAY_CONTRACTS.assetManager, msg, {
          amount: [{ amount: '1', denom: 'aconst' }],
          gas: '1200000',
        });
        console.log(res);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const borrowFromIcon = async () => {
    //ad get fee and pass it to transfer funds
    if (signingCosmWasmClient && address) {
      const msg = {
        send_call_message: {
          to: `0x7.icon/${bnJs.Loans.address}`,
          data: getRlpEncodedMsg(['xBorrow', 'TwitterAsset', 1]),
        },
      };
      console.log(msg);
      try {
        const res: ExecuteResult = await signingCosmWasmClient.execute(address, ARCHWAY_CONTRACTS.xcall, msg, {
          amount: [{ amount: '1', denom: 'aconst' }],
          gas: '700000',
        });
        console.log(res);

        const xCallMeta = getXCallOriginEventDataFromArchway(res.events);

        console.log(xCallMeta);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExecuteXCall = (data: { reqId: string; data: string }) => async () => {
    if (account) {
      bnJs.inject({ account });
      bnJs.XCall.executeCall(data.reqId, data.data);
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
            Asset Manager contract
          </Typography>
          <Flex alignItems="center">
            <Button onClick={increaseAllowance}>Increase Allowance</Button>
            <Typography ml={2} color="text">
              current AM allowance: {parseInt(currentAllowance || '0') / 10 ** 6}
            </Typography>
          </Flex>
        </>
      )}
      {address && signingCosmWasmClient && (
        <>
          <Flex mt={3}>
            <Button onClick={depositToIcon}>Deposit collateral</Button>
          </Flex>
          <Flex mt={3}>
            <Button onClick={depositToIconAndBorrow}>Deposit collateral and borrow</Button>
          </Flex>
        </>
      )}
      {/* xCall token transfer */}
      {address && signingCosmWasmClient && (
        <>
          <Divider my={5}></Divider>
          <Typography variant="h3" fontSize={18} mb={4}>
            xCall contract
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
      {/* Executable calls */}
      {address && signingCosmWasmClient && (
        <>
          <Divider my={5}></Divider>
          <Typography variant="h3" fontSize={18} mb={4}>
            xCalls to execute
          </Typography>
        </>
      )}
      {address &&
        signingCosmWasmClient &&
        xCallData?.map(
          data =>
            data && (
              <Flex alignItems="center" key={data.reqId}>
                <Button onClick={handleExecuteXCall(data)}>Execute</Button>
                <Typography color="text" marginLeft="30px">
                  reqId: {data.reqId}
                </Typography>
              </Flex>
            ),
        )}
    </BoxPanel>
  );
};

export default ArchwayTest;
