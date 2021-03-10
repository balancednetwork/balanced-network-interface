import React from 'react';

import BigNumber from 'bignumber.js';
import { IconBuilder, IconConverter, IconAmount } from 'icon-sdk-js';
import Nouislider from 'nouislider-react';
import {
  useIconReact,
  sICX_ADDRESS,
  LOAN_ADDRESS,
  BALN_ADDRESS,
  bnUSD_ADDRESS,
  BAND_ADDRESS,
  STAKING_ADDRESS,
  iconService,
  BALNbnUSDpoolId,
  DEX_ADDRESS,
} from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { ICONEX_RELAY_RESPONSE } from 'packages/iconex';
import { Helmet } from 'react-helmet-async';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { CurrencyField } from 'app/components/Form';
import RewardsPanel from 'app/components/home/RewardsPanel';
import WalletPanel from 'app/components/home/WalletPanel';
import { DefaultLayout } from 'app/components/Layout';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'demo';
import { useWalletICXBalance } from 'hooks';
import { useChangeAccount } from 'store/application/hooks';
import { useChangeDepositedValue, useBalance, useDepositedValue, useChangeBalanceValue } from 'store/collateral/hooks';
import {
  useLoanBorrowedValue,
  useLoanbnUSDbadDebt,
  useLoanbnUSDtotalSupply,
  useLoanChangeBorrowedValue,
  useLoanChangebnUSDbadDebt,
  useLoanChangebnUSDtotalSupply,
} from 'store/loan/hooks';
import { useRatioValue, useChangeRatio } from 'store/ratio/hooks';
import { useChangeWalletBalance } from 'store/wallet/hooks';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`;

const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: 2 / 1 / 2 / 3;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
    flex-direction: column;
  `}
`;

const Chip = styled(Box)`
  display: inline-block;
  min-width: 82px;
  text-align: center;
  border-radius: 100px;
  padding: 1px 10px;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.4;
`;

enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

enum loanField {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const client = new W3CWebSocket(`ws://35.240.219.80:8000/wss`);

export function HomePage() {
  const [isCollateralEditing, setCollateralEditing] = React.useState<boolean>(true);
  const changeAccount = useChangeAccount();

  const { account } = useIconReact();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stakedICXAmountCache, changeStakedICXAmountCache] = React.useState(0);
  const [borrowAmountCache, changeBorrowAmountCache] = React.useState(0);

  const balance = useWalletICXBalance(account);

  // collateral
  const stakedICXAmount = useDepositedValue();
  const unStackedICXAmount = useBalance();
  const changeStakedICXAmount = useChangeDepositedValue();
  const updateUnStackedICXAmount = useChangeBalanceValue();

  // loan
  const loanBorrowedValue = useLoanBorrowedValue();
  const loanbnUSDbadDebt = useLoanbnUSDbadDebt();
  const loanbnUSDtotalSupply = useLoanbnUSDtotalSupply();
  const updateChangeLoanBorrowedValue = useLoanChangeBorrowedValue();
  const updateChangeLoanbnUSDbadDebt = useLoanChangebnUSDbadDebt();
  const updateChangeLoanbnUSDtotalSupply = useLoanChangebnUSDtotalSupply();

  // wallet
  const changeBalanceValue = useChangeWalletBalance();

  // ratio
  const ratioValue = useRatioValue();
  const changeRatioValue = useChangeRatio();

  // ratio
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(BAND_ADDRESS)
        .method('get_reference_data')
        .params({ _base: 'ICX', _quote: 'USD' })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const ICXUSDratio = convertLoopToIcx(result['rate']);
          changeRatioValue({ ICXUSDratio: ICXUSDratio });
        });
    }
  }, [changeRatioValue, account]);

  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder().from(account).to(STAKING_ADDRESS).method('getTodayRate').build();
      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const sICXICXratio = convertLoopToIcx(result);
          changeRatioValue({ sICXICXratio: sICXICXratio });
        });
    }
  }, [changeRatioValue, account]);

  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('getPrice')
        .params({ _pid: BALNbnUSDpoolId.toString() })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const BALNbnUSDratio = convertLoopToIcx(result);
          changeRatioValue({ BALNbnUSDratio: BALNbnUSDratio });
        });
    }
  }, [changeRatioValue, account]);

  // wallet balance
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(sICX_ADDRESS)
        .method('balanceOf')
        .params({ _owner: account })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const balance = convertLoopToIcx(result);
          changeBalanceValue({ sICXbalance: balance });
        });
    }
  }, [changeBalanceValue, account]);

  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(BALN_ADDRESS)
        .method('balanceOf')
        .params({ _owner: account })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const balance = convertLoopToIcx(result);
          changeBalanceValue({ BALNbalance: balance });
        });
    }
  }, [changeBalanceValue, account]);

  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(bnUSD_ADDRESS)
        .method('balanceOf')
        .params({ _owner: account })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const balance = convertLoopToIcx(result);
          changeBalanceValue({ bnUSDbalance: balance });
        });
    }
  }, [changeBalanceValue, account]);

  React.useEffect(() => {
    if (account) {
      client.send(
        JSON.stringify({
          address: account,
        }),
      );
    }
    updateUnStackedICXAmount(balance);
  }, [account, updateUnStackedICXAmount, balance]);

  //loan
  React.useEffect(() => {
    if (account) {
      const callGetAvailableAssetsParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(LOAN_ADDRESS)
        .method('getAvailableAssets')
        .build();

      iconService
        .call(callGetAvailableAssetsParams)
        .execute()
        .then((result: BigNumber) => {
          const bnUSDbadDebt = convertLoopToIcx(result['ICD']['bad_debt']);

          updateChangeLoanbnUSDbadDebt(bnUSDbadDebt);
        });
    }
  }, [updateChangeLoanbnUSDbadDebt, account]);

  /*React.useEffect(() => {
    const handler = ({ detail: { type, payload } }: any) => {
      if (account && type === 'RESPONSE_JSON-RPC') {
        setTimeout(() => {
          const callParams = new IconBuilder.CallBuilder().from(account).to(bnUSD_ADDRESS).method('totalSupply').build();

          Promise.all([iconService.call(callParams).execute()]).then(
            ([result]) => {
              console.log(result);
              updateChangeLoanbnUSDtotalSupply(convertLoopToIcx(result));
            },
          );
        }, 2000);
      }
    };

    window.addEventListener(ICONEX_RELAY_RESPONSE, handler);
    return () => {
      window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
    };
  }, [account, updateChangeLoanbnUSDtotalSupply]);*/

  React.useEffect(() => {
    if (account) {
      const callParamsTest = new IconBuilder.CallBuilder()
        .from(account)
        .to(bnUSD_ADDRESS)
        .method('totalSupply')
        .build();
      iconService
        .call(callParamsTest)
        .execute()
        .then((result: BigNumber) => {
          const bnUSDtotalSupply = convertLoopToIcx(result);

          updateChangeLoanbnUSDtotalSupply(bnUSDtotalSupply);
        });
    }
  }, [updateChangeLoanbnUSDtotalSupply, account]);

  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(LOAN_ADDRESS)
        .method('getAccountPositions')
        .params({ _owner: account })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const totalDebt = convertLoopToIcx(result['total_debt'] || 0);

          updateChangeLoanBorrowedValue(totalDebt);
          changeBorrowAmountCache(totalDebt);
        });
    }
  }, [updateChangeLoanBorrowedValue, changeBorrowAmountCache, account]);

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
              const unStakedVal = convertLoopToIcx(balance);
              updateUnStackedICXAmount(unStakedVal);
              changeStakedICXAmount(stakedICXVal);
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
  }, [account, updateUnStackedICXAmount, changeStakedICXAmount, changeStakedICXAmountCache]);

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
  }

  function withdrawCollateral(value, params) {
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

  const handleCollateralConfirm = () => {
    if (!account) return;
    const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    const data2 = Buffer.from('", "_asset": "", "_amount": 0}}', 'utf8').toString('hex');
    const params = { _data1: data1, _data2: data2 };

    const newDepositedValue = parseFloat(formattedAmounts[Field.LEFT]);
    const shouldWithdraw = newDepositedValue < stakedICXAmountCache;
    if (shouldWithdraw) {
      withdrawCollateral(0, {
        _value:
          '0x' +
          IconAmount.of(stakedICXAmountCache - newDepositedValue, IconAmount.Unit.ICX)
            .toLoop()
            .toString(16),
      });
    } else {
      addCollateral(newDepositedValue - stakedICXAmountCache, params);
    }
  };

  changeAccount(`${account}`);

  const [{ independentField, typedValue }, setCollateralState] = React.useState({
    independentField: Field.LEFT,
    typedValue: '',
  });

  const handleCollateralAdjust = () => {
    setCollateralEditing(true);
  };

  const handleCollateralCancel = () => {
    setCollateralEditing(false);
  };

  // loan handle
  const handleLoanConfirm = () => {
    if (!account) return;
    const newBorrowValue = parseFloat(formattedLoanAmounts[loanField.LEFT]);

    if (newBorrowValue === 0 && loanBorrowedValue.toNumber() > 0) {
      repayLoan(loanBorrowedValue);
    } else if (newBorrowValue > loanBorrowedValue.toNumber() && loanBorrowedValue.toNumber() > 0) {
      addLoan(newBorrowValue);
    }
    /*
    const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    const data2 = Buffer.from('", "_asset": "", "_amount": 0}}', 'utf8').toString('hex');
    const params = { _data1: data1, _data2: data2 };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(LOAN_ADDRESS)
      .method('addCollateral')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      .value(IconAmount.of(formattedAmounts[Field.LEFT], IconAmount.Unit.ICX).toLoop())
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
    );*/
  };

  function repayLoan(value) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const data = '0x' + Buffer.from('{"method": "_repay_loan", "params": {}}', 'utf8').toString('hex');
    const valueParam = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: LOAN_ADDRESS, _value: valueParam, _data: data };

    const loanPayload = callTransactionBuilder
      .from(account)
      .to(bnUSD_ADDRESS)
      .method('transfer')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      .value(0)
      .version(IconConverter.toBigNumber(3))
      .build();

    const parsed = {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(loanPayload),
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

  function addLoan(value) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    const data2 = Buffer.from(
      '", "_asset": "ICD", "_amount": ' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop() + '}}',
      'utf8',
    ).toString('hex');
    const params = { _data1: data1, _data2: data2 };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(LOAN_ADDRESS)
      .method('addCollateral')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(2000000))
      .value(IconAmount.of(value / (ratioValue.ICXUSDratio?.toNumber() || 0), IconAmount.Unit.ICX).toLoop())
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

  const [isLoanEditing, setLoanEditing] = React.useState<boolean>(true);

  const handleLoanAdjust = () => {
    setLoanEditing(true);
  };

  const handleLoanCancel = () => {
    setLoanEditing(false);
  };
  //

  client.onmessage = msg => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(LOAN_ADDRESS)
        .method('getAccountPositions')
        .params({ _owner: account })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const deposited = convertLoopToIcx(result['assets'] ? result['assets']['sICX'] : 0);

          changeStakedICXAmount(deposited);
          changeStakedICXAmountCache(deposited);
        });
    }
  };

  // staked icx balance
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(LOAN_ADDRESS)
        .method('getAccountPositions')
        .params({ _owner: account })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const deposited = convertLoopToIcx(result['assets'] ? result['assets']['sICX'] : 0);

          changeStakedICXAmount(deposited);
          changeStakedICXAmountCache(deposited);
        });
    }
  }, [changeStakedICXAmount, account]);

  // totall icx balance
  const totalICXAmount = unStackedICXAmount.plus(stakedICXAmount);

  React.useEffect(() => {
    setCollateralState({ independentField: Field.LEFT, typedValue: stakedICXAmount.toFixed(2) });
  }, [stakedICXAmount]);

  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const handleStakedAmountType = React.useCallback((value: string) => {
    setCollateralState({ independentField: Field.LEFT, typedValue: value });
  }, []);

  const handleUnstakedAmountType = React.useCallback((value: string) => {
    setCollateralState({ independentField: Field.RIGHT, typedValue: value });
  }, []);

  const handleCollateralSlider = React.useCallback((values: string[], handle: number) => {
    setCollateralState({ independentField: Field.LEFT, typedValue: values[handle] });
  }, []);

  // loan slider
  const totalLoanAmount = stakedICXAmount.div(4).minus(loanBorrowedValue);

  const [{ independentLoanField, typedLoanValue }, setLoanState] = React.useState({
    independentLoanField: loanField.LEFT,
    typedLoanValue: '',
  });

  React.useEffect(() => {
    setLoanState({ independentLoanField: loanField.LEFT, typedLoanValue: loanBorrowedValue.toFixed(2) });
  }, [loanBorrowedValue]);

  const dependentLoanField: loanField = independentLoanField === loanField.LEFT ? loanField.RIGHT : loanField.LEFT;

  const handleBorrowAmountInput = React.useCallback((value: string) => {
    setLoanState({ independentLoanField: loanField.LEFT, typedLoanValue: value });
  }, []);

  const handleBorrowAvailableInput = React.useCallback((value: string) => {
    setLoanState({ independentLoanField: loanField.RIGHT, typedLoanValue: value });
  }, []);

  const handleLoanSlider = React.useCallback((values: string[], handle: number) => {
    setLoanState({ independentLoanField: loanField.LEFT, typedLoanValue: values[handle] });
  }, []);

  const parsedLoanAmount = {
    [independentLoanField]: new BigNumber(typedLoanValue),
    [dependentLoanField]: totalLoanAmount.minus(new BigNumber(typedLoanValue)),
  };

  const formattedLoanAmounts = {
    [independentLoanField]: typedLoanValue,
    [dependentLoanField]: parsedLoanAmount[dependentLoanField].toFixed(2),
  };

  // calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue),
    [dependentField]: totalICXAmount.minus(new BigNumber(typedValue)),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmount[dependentField].toFixed(2),
  };

  const sliderInstance = React.useRef<any>(null);

  const totalCollateralValue = stakedICXAmount.times(ratioValue.ICXUSDratio === undefined ? 0 : ratioValue.ICXUSDratio);
  // const totalLoanBorrowedValue = loanBorrowedValue.times(new BigNumber(ratioValue.ICXUSDratio).toNumber());
  // const totalBorrowedAvailableValue = stakedICXAmount.times(new BigNumber(ratioValue.ICXUSDratio).toNumber());
  const debtHoldShare = loanBorrowedValue.div(loanbnUSDtotalSupply.minus(loanbnUSDbadDebt)).multipliedBy(100);
  //console.log(loanBorrowedValue.toFixed(2).toString());
  //console.log(loanbnUSDtotalSupply.toString());
  //console.log(loanbnUSDbadDebt.toFixed(2).toString());

  React.useEffect(() => {
    sliderInstance.current.noUiSlider.set(new BigNumber(typedValue).toNumber());
  }, [typedValue]);

  return (
    <DefaultLayout>
      <Helmet>
        <title>Home</title>
      </Helmet>

      <Grid>
        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">Collateral</Typography>

            <Box>
              {isCollateralEditing ? (
                <>
                  <TextButton onClick={handleCollateralCancel}>Cancel</TextButton>
                  <Button onClick={handleCollateralConfirm}>Confirm</Button>
                </>
              ) : (
                <Button onClick={handleCollateralAdjust}>Adjust</Button>
              )}
            </Box>
          </Flex>

          <Box marginY={6}>
            <Nouislider
              id="slider-collateral"
              disabled={!isCollateralEditing}
              start={0}
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
                editable={isCollateralEditing}
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
                editable={isCollateralEditing}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={formattedAmounts[Field.RIGHT]}
                currency={CURRENCYLIST['icx']}
                onUserInput={handleUnstakedAmountType}
              />
            </Box>
          </Flex>
        </BoxPanel>

        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">Loan</Typography>

            <Box>
              {isLoanEditing ? (
                <>
                  <TextButton onClick={handleLoanCancel}>Cancel</TextButton>
                  <Button onClick={handleLoanConfirm}>Confirm</Button>
                </>
              ) : (
                <Button onClick={handleLoanAdjust}>Borrow</Button>
              )}
            </Box>
          </Flex>

          <Box marginY={6}>
            <Nouislider
              disabled={!isLoanEditing}
              id="slider-collateral"
              start={[0]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                // max: [totalLoanAmount.toNumber()],
                max: [1000],
              }}
              instanceRef={instance => {
                sliderInstance.current = instance;
              }}
              onSlide={handleLoanSlider}
            />
          </Box>

          <Flex justifyContent="space-between">
            <Box width={[1, 1 / 2]} mr={4}>
              <CurrencyField
                editable={isLoanEditing}
                isActive
                label="Borrowed"
                tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                value={formattedLoanAmounts[loanField.LEFT]}
                currency={CURRENCYLIST['bnusd']}
                onUserInput={handleBorrowAmountInput}
              />
            </Box>

            <Box width={[1, 1 / 2]} ml={4}>
              <CurrencyField
                editable={isLoanEditing}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={formattedLoanAmounts[loanField.RIGHT]}
                currency={CURRENCYLIST['bnusd']}
                onUserInput={handleBorrowAvailableInput}
              />
            </Box>
          </Flex>
        </BoxPanel>

        <ActivityPanel bg="bg2">
          <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 350]}>
            <Typography variant="h2" mb={5}>
              Position detail
            </Typography>

            <Flex>
              <Box width={1 / 2} className="border-right">
                <Typography>Collateral</Typography>
                <Typography variant="p">{'$' + totalCollateralValue.toFixed(2).toString()}</Typography>
              </Box>
              <Box width={1 / 2} sx={{ textAlign: 'right' }}>
                <Typography>Loan</Typography>
                <Typography variant="p">
                  {'$' + loanBorrowedValue.toFixed(2).toString() + ' / $' + totalLoanAmount.toFixed(2).toString()}
                </Typography>
              </Box>
            </Flex>
            <Divider my={4} />
            <Typography mb={2}>
              The current ICX price is{' '}
              <span className="alert">{'$' + ratioValue.ICXUSDratio?.toFixed(2).toString()}</span>.
            </Typography>
            <Typography>
              You hold{' '}
              <span className="white">
                {isNaN(debtHoldShare.toNumber()) ? '0%' : debtHoldShare.toFixed(2).toString() + '%'}
              </span>{' '}
              of the total debt.
            </Typography>
          </BoxPanel>
          <BoxPanel bg="bg2" flex={1}>
            <Typography variant="h3">Risk ratio</Typography>

            <Flex alignItems="center" justifyContent="space-between" my={4}>
              <Chip bg="primary">Low risk</Chip>
              <Box flex={1} mx={1}>
                <Nouislider
                  disabled={true}
                  id="risk-ratio"
                  start={[0]}
                  padding={[0]}
                  connect={[true, false]}
                  range={{
                    min: [0],
                    max: [15000],
                  }}
                />
              </Box>
              <Chip bg="red">Liquidated</Chip>
            </Flex>

            <Divider my={3} />

            <Flex flexWrap="wrap" alignItems="flex-end">
              <Box width={[1, 1 / 2]}>
                <Flex alignItems="center" mb={15}>
                  <Typography variant="h3" mr={15}>
                    Rebalancing
                  </Typography>
                  <DropdownText text="Past week">
                    <MenuList>
                      <MenuItem>Day</MenuItem>
                      <MenuItem>Week</MenuItem>
                      <MenuItem>Month</MenuItem>
                    </MenuList>
                  </DropdownText>
                </Flex>
                <Flex>
                  <Box width={1 / 2}>
                    <Typography variant="p">0 ICD</Typography>
                    <Typography>Collateral sold</Typography>
                  </Box>
                  <Box width={1 / 2}>
                    <Typography variant="p">0 ICD</Typography>
                    <Typography>Loan repaid</Typography>
                  </Box>
                </Flex>
              </Box>

              <Box width={[1, 1 / 2]}>
                <Typography>
                  Traders can repay loans by selling ICD for $1 of ICX collateral. Your position will rebalance based on
                  your % of the total debt.
                </Typography>
              </Box>
            </Flex>
          </BoxPanel>
        </ActivityPanel>

        <WalletPanel />

        <div>
          <RewardsPanel />
        </div>
      </Grid>
    </DefaultLayout>
  );
}
