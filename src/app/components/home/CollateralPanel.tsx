import React from 'react';

import BigNumber from 'bignumber.js';
import { IconBuilder } from 'icon-sdk-js';
import Nouislider from 'nouislider-react';
import { LOAN_ADDRESS, useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { ICONEX_RELAY_RESPONSE } from 'packages/iconex';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';
// import { useWalletICXBalance, useStakedICXBalance } from 'hooks';
import {
  /* useChangeDepositedValue, */ useBalance,
  useDepositedValue /* , useChangeBalanceValue */,
} from 'store/collateral/hooks';

enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const CollateralPanel = () => {
  const { account, iconService } = useIconReact();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<boolean>(false);
  const [{ independentField, typedValue }, setCollateralState] = React.useState({
    independentField: Field.LEFT,
    typedValue: '',
  });

  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  // wallet icx balance

  // staked icx balance
  const stakedICXAmount = useDepositedValue();
  const unStackedICXAmount = useBalance();
  // const changeStakedICXAmount = useChangeDepositedValue();
  // const updateUnStackedICXAmount = useChangeBalanceValue();
  const [stakedICXAmountCache, changeStakedICXAmountCache] = React.useState(new BigNumber(0));
  // changeStakedICXAmountCache(stakedICXAmount);

  //bug here
  React.useEffect(() => {
    setCollateralState({ independentField: Field.LEFT, typedValue: stakedICXAmount.toFixed(2) });
  }, [stakedICXAmount]);
  /*******/

  const toggleOpen = () => {
    setOpen(!open);
  };

  const toggleEditing = () => {
    setEditing(!editing);
  };

  const handleStakedAmountType = React.useCallback(
    (value: string) => {
      setCollateralState({ independentField: Field.LEFT, typedValue: value });
    },
    [setCollateralState],
  );

  const handleUnstakedAmountType = React.useCallback(
    (value: string) => {
      setCollateralState({ independentField: Field.RIGHT, typedValue: value });
    },
    [setCollateralState],
  );

  const handleCollateralSlider = (values: string[], handle: number) => {
    setCollateralState(state => ({ independentField: state['independentField'], typedValue: values[handle] }));
  };

  // totall icx balance
  const totalICXAmount = unStackedICXAmount.plus(stakedICXAmount);

  // calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue || '0',
    [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
  };

  /*console.log(
    independentField,
    unStackedICXAmount.toFixed(2),
    stakedICXAmount.toFixed(2),
    totalICXAmount.toFixed(2),
    parsedAmount,
    formattedAmounts,
  );*/

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCollateralConfirm = () => {
    if (!account) return;
    //const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    //const data2 = Buffer.from('", "_asset": "", "_amount": 0}}', 'utf8').toString('hex');
    //const params = { _data1: data1, _data2: data2 };

    const newDepositedValue = parseFloat(formattedAmounts[Field.LEFT]);
    const shouldWithdraw = newDepositedValue < stakedICXAmountCache.toNumber();
    if (shouldWithdraw) {
      /*withdrawCollateral(0, {
        _value:
          '0x' +
          IconAmount.of(stakedICXAmountCache.toNumber() - newDepositedValue, IconAmount.Unit.ICX)
            .toLoop()
            .toString(16),
      });*/
    } else {
      //addCollateral(newDepositedValue - stakedICXAmountCache.toNumber(), params);
      //deposit
      bnJs
        .eject({ account: account })
        .Loans.depositAddCollateral(newDepositedValue)
        .then(res => {
          console.log('res', res);
        })
        .catch(e => {
          console.error('error', e);
        });
    }
  };

  /*function withdrawCollateral(value, params) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const depositPayload = callTransactionBuilder
      .from(account)
      .to(LOAN_ADDRESS)
      .method('withdrawCollateral')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      .value(IconAmount.of(value, IconAmount.Unit.ICX).toLoop())
      .version(IconConverter.toBigNumber(3))
      .build();

    const parsed = {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(depositPayload),
      id: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload: parsed,
        },
      }),
    );
  }

  function addCollateral(value, params) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(LOAN_ADDRESS)
      .method('addCollateral')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      .value(IconAmount.of(value, IconAmount.Unit.ICX).toLoop())
      .version(IconConverter.toBigNumber(3))
      .build();

    const parsed = {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(depositPayload),
      id: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload: parsed,
        },
      }),
    );
  }*/

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    sliderInstance.current.noUiSlider.set(new BigNumber(typedValue).toNumber());
  }, [typedValue, editing]);

  React.useEffect(() => {
    const handler = ({ detail: { type, payload } }: any) => {
      setTimeout(() => {
        if (account && type === 'RESPONSE_JSON-RPC') {
          const callParams = new IconBuilder.CallBuilder()
            .from(account)
            .to(LOAN_ADDRESS)
            .method('getAccountPositions')
            .params({ _owner: account })
            .build();

          Promise.all([iconService.call(callParams).execute(), iconService.getBalance(account).execute()]).then(
            ([result, balance]) => {
              const stakedICXVal = convertLoopToIcx(result['assets'] ? result['assets']['sICX'] : 0);
              changeStakedICXAmountCache(stakedICXVal);
            },
          );
        }
      }, 5000);
    };

    window.addEventListener(ICONEX_RELAY_RESPONSE, handler);
    return () => {
      window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
    };
  }, [account, changeStakedICXAmountCache, iconService]);

  return (
    <>
      <BoxPanel bg="bg3">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">Collateral</Typography>

          <Box>
            {editing ? (
              <>
                <TextButton onClick={toggleEditing}>Cancel</TextButton>
                <Button onClick={toggleOpen}>Confirm</Button>
              </>
            ) : (
              <Button onClick={toggleEditing}>Deposit</Button>
            )}
          </Box>
        </Flex>

        <Box marginY={6} height={20}>
          <Nouislider
            id="slider-collateral"
            disabled={!editing}
            start={[0]}
            padding={[0]}
            connect={[true, false]}
            range={{
              min: [0],
              max: [totalICXAmount.toNumber()],
            }}
            instanceRef={instance => {
              sliderInstance.current = instance;
            }}
            onSlide={handleCollateralSlider}
          />
        </Box>

        <Flex justifyContent="space-between">
          <Box width={[1, 1 / 2]} mr={4}>
            <CurrencyField
              id="staked-icx-amount"
              editable={editing}
              isActive
              label="Deposited"
              tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
              value={formattedAmounts[Field.LEFT]}
              currency={CURRENCYLIST['icx']}
              onUserInput={handleStakedAmountType}
            />
          </Box>

          <Box width={[1, 1 / 2]} ml={4}>
            <CurrencyField
              id="unstaked-icx-amount"
              editable={editing}
              isActive={false}
              label="Wallet"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={formattedAmounts[Field.RIGHT]}
              currency={CURRENCYLIST['icx']}
              onUserInput={handleUnstakedAmountType}
            />
          </Box>
        </Flex>
      </BoxPanel>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3">
            Deposit ICON collateral?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {formattedAmounts[Field.LEFT] + ' ICX'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {unStackedICXAmount.toFixed(2) + ' ICX'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {formattedAmounts[Field.RIGHT] + ' ICX'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">Your ICX will be staked as sICX.</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen}>Cancel</TextButton>
            <Button onClick={handleCollateralConfirm}>Deposit</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default CollateralPanel;
