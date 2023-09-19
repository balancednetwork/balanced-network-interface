import React from 'react';

import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass';

import { ICON_XCALL_NETWORK_ID } from 'app/_xcall/_icon/config';
import { useICONEventListener } from 'app/_xcall/_icon/eventHandlers';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import { DestinationXCallData, XCallEvent } from 'app/_xcall/types';
import { getBytesFromString, getRlpEncodedMsg } from 'app/_xcall/utils';
import { Button } from 'app/components/Button';
import Divider from 'app/components/Divider';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import {
  useAddOriginEvent,
  useCurrentXCallState,
  useRemoveEvent,
  useXCallDestinationEvents,
  useXCallListeningTo,
  useXCallOriginEvents,
} from 'store/xCall/hooks';

import { useArchwayContext } from '../ArchwayProvider';
import { ARCHWAY_CONTRACTS, ARCHWAY_CW20_COLLATERAL } from '../config';
// import { BORROW_TX } from '../testnetChainInfo';
import { useArchwayEventListener } from '../eventHandler';
import { getXCallOriginEventDataFromArchway } from './helpers';

const ArchwayTest = () => {
  const [tokenAmount, setTokenAmount] = React.useState<number>();
  const [cw20Amount, setCw20Amount] = React.useState<number>();
  const [cw20bnUSDAmount, setCw20bnUSDAmount] = React.useState<number>();
  const [currentAllowance, setCurrentAllowance] = React.useState<string>();
  const { chain_id, address, connectToWallet, signingClient, disconnect, signingCosmWasmClient } = useArchwayContext();
  const { account } = useIconReact();
  const removeEvent = useRemoveEvent();

  const archwayDestinationEvents = useXCallDestinationEvents('archway');

  const currentXcallState = useCurrentXCallState();

  const iconDestinationEvents = useXCallDestinationEvents('icon');
  const archwayOriginEvents = useXCallOriginEvents('archway');
  const addOriginEvent = useAddOriginEvent();

  const listeningTo = useXCallListeningTo();
  useArchwayEventListener(listeningTo?.chain === 'archway' ? listeningTo.event : null);
  useICONEventListener(listeningTo?.chain === 'icon' ? listeningTo.event : null);

  // const xCallState = useXCallState();
  // console.log('xCallState: ', xCallState);

  //probably not needed, just use destination events with data hash
  const xCallData = React.useMemo(() => {
    if (iconDestinationEvents.length && archwayOriginEvents.length) {
      return iconDestinationEvents.map(event => {
        const { sn } = event;
        const archwayOrigin = archwayOriginEvents.find(archwayEvent => archwayEvent.sn === sn);
        if (archwayOrigin) {
          return event;
        }
        return undefined;
      });
    }
  }, [iconDestinationEvents, archwayOriginEvents]);

  React.useEffect(() => {
    // get fee token amount
    if (signingClient && address) {
      signingClient.getBalance(address, 'aconst').then(res => {
        try {
          setTokenAmount(parseInt(res.amount || '0') / 10 ** 18);
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
      //same on ICON with
      // const params = {
      //   _net: NETWORK_LABEL_DESTINATION,
      //   _rollback: useRollback ? "0x1" : "0x0"
      // };
      const fee = await signingCosmWasmClient.queryContractSmart(ARCHWAY_CONTRACTS.xcall, {
        get_fee: { nid: ICON_XCALL_NETWORK_ID, rollback: false },
      });

      console.log('fee: ', fee);

      const msg = {
        deposit: {
          token_address: ARCHWAY_CW20_COLLATERAL.address,
          amount: '100000',
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
          data: getBytesFromString(JSON.stringify({ _amount: '0' })),
        },
      };
      try {
        const res = await signingCosmWasmClient.execute(
          address,
          ARCHWAY_CONTRACTS.assetManager,
          msg,
          'auto',
          undefined,
          [{ amount: fee, denom: 'aconst' }],
        );
        console.log(res);

        //XCALL: Step one - get sn from initial transaction
        const originEventData = getXCallOriginEventDataFromArchway(res.events);
        originEventData && addOriginEvent('archway', originEventData);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const borrowFromIcon = async () => {
    //ad get fee and pass it to transfer funds
    if (signingCosmWasmClient && address) {
      const fee = await signingCosmWasmClient.queryContractSmart(ARCHWAY_CONTRACTS.xcall, {
        get_fee: { nid: '0x7.icon', rollback: false },
      });

      const msg = {
        send_call_message: {
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
          data: getRlpEncodedMsg(['xBorrow', 'TwitterAsset', 1]),
        },
      };

      try {
        const res: ExecuteResult = await signingCosmWasmClient.execute(
          address,
          ARCHWAY_CONTRACTS.xcall,
          msg,
          'auto',
          undefined,
          [{ amount: fee, denom: 'aconst' }],
        );
        console.log(res);

        const originEventData = getXCallOriginEventDataFromArchway(res.events);
        originEventData && addOriginEvent('archway', originEventData);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExecuteXCall = (data: { reqId: number; data: string }) => async () => {
    if (account) {
      bnJs.inject({ account });
      const { result: hash } = await bnJs.XCall.executeCall(`0x${data.reqId.toString(16)}`, data.data);
      const txResult = await fetchTxResult(hash);
      if (txResult?.status === 1 && txResult.eventLogs.length) {
        // looking for CallExecuted event
        // then set listener to ResponseMessage / RollbackMessage
        const callExecutedEvent = txResult.eventLogs.find(event =>
          event.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
        );

        console.log('txResult: ', txResult);

        if (callExecutedEvent?.data[0] === '0x1') {
          console.log('xCALL EXECUTED SUCCESSFULLY');

          //has xCall emitted CallMessageSent event?
          const callMessageSentEvent = txResult.eventLogs.find(event =>
            event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
          );

          if (callMessageSentEvent) {
            console.log('CALL MESSAGE SENT EVENT DETECTED');
            console.log(callMessageSentEvent);
            const originEventData = getXCallOriginEventDataFromICON(callMessageSentEvent);
            originEventData && addOriginEvent('icon', originEventData);
          }

          const sn = iconDestinationEvents.find(event => event.reqId === data.reqId)?.sn;
          sn && removeEvent(sn, true);
        }

        if (callExecutedEvent?.data[0] === '0x0') {
          console.log('xCALL EXECUTED WITH ERROR');
          if (callExecutedEvent?.data[1].toLocaleLowerCase().includes('revert')) {
            console.log('xCALL EXECUTED WITH ERROR: ROLLBACK NEEDED');
          }
        }
        // Find out if CallMessageSent was emitted as well
      }
    }
  };

  const handleArchwayExecuteXCall = (data: DestinationXCallData) => async () => {
    if (signingCosmWasmClient && address) {
      const msg = {
        execute_call: {
          request_id: `${data.reqId}`,
          data: JSON.parse(data.data),
        },
      };

      try {
        const res: ExecuteResult = await signingCosmWasmClient.execute(address, ARCHWAY_CONTRACTS.xcall, msg, {
          amount: [{ amount: '1', denom: 'aconst' }],
          gas: '600000',
        });
        console.log(res);

        console.log('ARCHWAY executeCall complete', res);

        const callExecuted = res.events.some(
          e => e.type === 'wasm-CallExecuted' && e.attributes.some(a => a.key === 'code' && a.value === '1'),
        );
        if (callExecuted) {
          removeEvent(data.sn, true);
          console.log('ARCHWAY executeCall - SUCCESS');
          //TODO: Check for wasm-CallMessageSent - low priority and probability I guess
        } else {
          console.log('ARCHWAY executeCall - FAIL');
          //TODO: check for RollbackMessage on ICON
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <BoxPanel bg="bg2" width="100%">
      <Flex alignItems="center">
        <Typography variant="h2">Archway Test</Typography>
        <Typography variant="h3" marginLeft="auto">
          xCall: {currentXcallState}
        </Typography>
      </Flex>
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
          <Flex mt={3}>{/* <Button onClick={depositToIconAndBorrow}>Deposit collateral and borrow</Button> */}</Flex>
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
      {xCallData ? 'ICON' : null}
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
      {archwayDestinationEvents.length ? 'ARCHWAY' : null}
      {address &&
        archwayDestinationEvents.map(event => (
          <Flex alignItems="center" key={event.reqId}>
            <Button onClick={handleArchwayExecuteXCall(event)}>Execute</Button>
            <Typography color="text" marginLeft="30px">
              reqId: {event.reqId}
            </Typography>
          </Flex>
        ))}
    </BoxPanel>
  );
};

export default ArchwayTest;
