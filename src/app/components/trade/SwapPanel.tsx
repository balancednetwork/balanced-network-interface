import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import ShouldLedgerConfirmMessage from 'app/components/DepositStakeMessage';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import Spinner from 'app/components/Spinner';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST, SUPPORTED_PAIRS } from 'constants/currency';
import { ZERO } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useWalletModalToggle } from 'store/application/hooks';
import { usePools } from 'store/pool/hooks';
import { useRatio, useChangeRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import { SectionPanel, BrightPanel, swapMessage } from './utils';

const ChartControlButton = styled(Button)<{ active: boolean }>`
  padding: 1px 12px;
  border-radius: 100px;
  color: #ffffff;
  font-size: 14px;
  background-color: ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.bg3)};
  transition: background-color 0.3s ease;

  :hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ChartControlGroup = styled(Box)`
  text-align: right;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    text-align: left;
  `}

  & button {
    margin-right: 5px;
  }

  & button:last-child {
    margin-right: 0;
  }
`;

const ChartContainer = styled(Box)`
  position: relative;
  height: ${HEIGHT}px;
`;

export default function SwapPanel() {
  const { account } = useIconReact();
  const balances = useWalletBalances();
  const ratio = useRatio();
  const pools = usePools();
  const shouldLedgerSign = useShouldLedgerSign();

  const addTransaction = useTransactionAdder();
  const changeRatioValue = useChangeRatio();
  const toggleWalletModal = useWalletModalToggle();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const refreshPrice = React.useCallback(async () => {
    const res = await bnJs.Band.getReferenceData({ _base: 'ICX', _quote: 'USD' });
    const ICXUSDratio = BalancedJs.utils.toIcx(res['rate']);
    changeRatioValue({ ICXUSDratio });

    const sICXICXratio = BalancedJs.utils.toIcx(await bnJs.Staking.getTodayRate());
    changeRatioValue({ sICXICXratio });

    const sICXbnUSDratio = BalancedJs.utils.toIcx(await bnJs.Dex.getPrice(BalancedJs.utils.POOL_IDS.sICXbnUSD));
    changeRatioValue({ sICXbnUSDratio });

    const BALNbnUSDratio = BalancedJs.utils.toIcx(await bnJs.Dex.getPrice(BalancedJs.utils.POOL_IDS.BALNbnUSD));
    changeRatioValue({ BALNbnUSDratio });
  }, [changeRatioValue]);

  const [swapInputAmount, setSwapInputAmount] = React.useState('');

  const [swapOutputAmount, setSwapOutputAmount] = React.useState('');

  const [inputCurrency, setInputCurrency] = React.useState(CURRENCY_LIST['sicx']);

  const [outputCurrency, setOutputCurrency] = React.useState(CURRENCY_LIST['bnusd']);

  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const [swapFee, setSwapFee] = React.useState('0');

  const tokenRatio = React.useCallback(
    (symbolInput: string, symbolOutput: string) => {
      const hasSICXICXRatio = isEmpty(ratio.sICXICXratio?.toNumber());
      const hasSICXbnUSDRatio = isEmpty(ratio.sICXbnUSDratio?.toNumber());
      const hasBALNbnUSDRatio = isEmpty(ratio.BALNbnUSDratio?.toNumber());
      symbolInput = symbolInput.toLowerCase();
      symbolOutput = symbolOutput.toLowerCase();

      switch (true) {
        case symbolInput === 'icx' && hasSICXICXRatio:
          return new BigNumber(1).dividedBy(ratio.sICXICXratio);

        case symbolInput === 'baln' && symbolOutput === 'bnusd':
          return ratio.BALNbnUSDratio;

        case symbolInput === 'baln' && symbolOutput === 'sicx':
          return ratio.BALNsICXratio;

        case symbolInput === 'sicx' && symbolOutput === 'bnusd':
          return ratio.sICXbnUSDratio;

        case symbolInput === 'sicx' && symbolOutput === 'baln':
          return new BigNumber(1).dividedBy(ratio.BALNsICXratio);

        case symbolInput === 'sicx' && symbolOutput === 'icx':
          return ratio.sICXICXratio;

        case symbolInput === 'bnusd' && symbolOutput === 'sicx' && hasSICXbnUSDRatio:
          return new BigNumber(1).dividedBy(ratio.sICXbnUSDratio);

        case symbolInput === 'bnusd' && symbolOutput === 'baln' && hasBALNbnUSDRatio:
          return new BigNumber(1).dividedBy(ratio.BALNbnUSDratio);

        default:
          return new BigNumber(0);
      }
    },
    [ratio],
  );

  const getPoolData = React.useCallback(
    (symbolInput: string, symbolOutput: string) => {
      symbolInput = symbolInput.toLocaleLowerCase();
      symbolOutput = symbolOutput.toLocaleLowerCase();

      return {
        sicx: {
          icx: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXICX]?.base || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXICX]?.quote || ZERO,
          },
          bnusd: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD]?.base || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD]?.quote || ZERO,
          },
          baln: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNsICX]?.quote || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNsICX]?.base || ZERO,
          },
        },
        icx: {
          sicx: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXICX]?.quote || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXICX]?.base || ZERO,
          },
        },
        bnusd: {
          sicx: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD]?.quote || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD]?.base || ZERO,
          },
          baln: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD]?.quote || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD]?.base || ZERO,
          },
        },
        baln: {
          bnusd: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD]?.base || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD]?.quote || ZERO,
          },
          sicx: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNsICX]?.base || ZERO,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNsICX]?.quote || ZERO,
          },
        },
      }[symbolInput][symbolOutput];
    },
    [pools],
  );

  const calculateOutputAmount = React.useCallback(
    (symbolInput: string, symbolOutput: string, amountInput: string, amountOutput: string) => {
      const symbol = `${symbolInput}_${symbolOutput}`;

      if (symbol === 'icx_sicx' || symbol === 'sicx_icx') {
        return new BigNumber(amountInput || amountOutput);
      }

      const poolTotalInput = getPoolData(symbolInput, symbolOutput)?.poolTotalInput || ZERO;
      const poolTotalOutput = getPoolData(symbolInput, symbolOutput)?.poolTotalOutput || ZERO;

      if (amountOutput === '') {
        const receiveToken = poolTotalOutput.minus(
          poolTotalOutput.multipliedBy(poolTotalInput).dividedBy(poolTotalInput.plus(new BigNumber(amountInput))),
        );

        return receiveToken;
      } else {
        amountInput = poolTotalOutput
          .multipliedBy(poolTotalInput)
          .dividedBy(poolTotalOutput.minus(amountOutput))
          .minus(poolTotalInput);

        return amountInput;
      }
    },
    [getPoolData],
  );

  const calculate_ICX_2_sICX_output_amount = ({ inputAmount, ratio }) => {
    return formatBigNumber(new BigNumber(inputAmount).multipliedBy(ratio), 'input');
  };

  const calculate_sICX_2_ICX_output_amount = ({ inputAmount, ratio }) => {
    const fee = parseFloat(inputAmount) / 100;
    setSwapFee(new BigNumber(fee).toString());
    inputAmount = (parseFloat(inputAmount) - fee).toString();
    return formatBigNumber(new BigNumber(inputAmount).multipliedBy(ratio), 'input');
  };

  const calculate_default_output_amount = React.useCallback(
    async ({ inputAmount, inputCurrencySymbol, outputCurrencySymbol }) => {
      const res = await bnJs.inject({ account }).Dex.getFees();

      const bal_holder_fee = parseInt(res[`pool_baln_fee`], 16);
      const lp_fee = parseInt(res[`pool_lp_fee`], 16);
      const inputAmountF = parseFloat(inputAmount);
      const fee = (inputAmountF * (bal_holder_fee + lp_fee)) / 10000;
      setSwapFee(new BigNumber(fee).toString());
      const amount = (inputAmountF - fee).toString();

      return formatBigNumber(calculateOutputAmount(inputCurrencySymbol, outputCurrencySymbol, amount, ''), 'ratio');
    },
    [account, calculateOutputAmount],
  );

  const handleConvertOutputRate = React.useCallback(
    async (inputCurrency: any, outputCurrency: any, inputAmount: string) => {
      let outputAmount;

      const ratioLocal = tokenRatio(inputCurrency.symbol, outputCurrency.symbol);

      const inputCurrencySymbol = inputCurrency.symbol.toLowerCase();
      const outputCurrencySymbol = outputCurrency.symbol.toLowerCase();

      inputAmount = inputAmount || '0';

      if (!ratioLocal) {
        console.log(`Cannot get rate from this pair`);
      }

      const symbol = `${inputCurrencySymbol}_${outputCurrencySymbol}`;

      switch (true) {
        case symbol === 'icx_sicx':
          outputAmount = calculate_ICX_2_sICX_output_amount({ inputAmount, ratio: ratioLocal });
          break;

        case symbol === 'sicx_icx':
          outputAmount = calculate_sICX_2_ICX_output_amount({ inputAmount, ratio: ratioLocal });
          break;

        default:
          outputAmount = await calculate_default_output_amount({
            inputAmount,
            inputCurrencySymbol,
            outputCurrencySymbol,
          });
          break;
      }

      if (outputAmount === '0') {
        setSwapOutputAmount('');
      } else {
        setSwapOutputAmount(outputAmount);
      }
    },
    [tokenRatio, calculate_default_output_amount],
  );

  const validate_with_wallet_balance = React.useCallback(
    (inputTypedValue: BigNumber, currency: string) => {
      if (currency.toLowerCase() === 'icx') {
        if (
          new BigNumber(inputTypedValue).isGreaterThanOrEqualTo(balances[currency].minus(new BigNumber(2))) &&
          balances[currency].isGreaterThan(new BigNumber(0))
        ) {
          return balances[currency].minus(new BigNumber(2));
        } else {
          return inputTypedValue;
        }
      } else {
        if (
          new BigNumber(inputTypedValue).isGreaterThanOrEqualTo(balances[currency]) &&
          balances[currency].isGreaterThan(new BigNumber(0))
        ) {
          return balances[currency];
        } else {
          return inputTypedValue;
        }
      }
    },
    [balances],
  );

  const calculate_sICX_2_ICX_intput_amount = outputTypedValue => {
    const inputAmount = new BigNumber(outputTypedValue).plus(new BigNumber(outputTypedValue).multipliedBy(0.01));
    return formatBigNumber(inputAmount, 'input');
  };

  const calculate_ICX_2_sICX_intput_amount = outputTypedValue => {
    return formatBigNumber(new BigNumber(outputTypedValue), 'input');
  };

  const calculate_default_intput_amount = async inputAmount => {
    if (!account) return '0';

    const res = await bnJs.inject({ account }).Dex.getFees();
    const bal_holder_fee = parseInt(res[`pool_baln_fee`], 16);
    const lp_fee = parseInt(res[`pool_lp_fee`], 16);
    const fee = inputAmount.multipliedBy(new BigNumber(bal_holder_fee + lp_fee)).dividedBy(new BigNumber(10000));
    setSwapFee(new BigNumber(fee).toString());
    inputAmount = inputAmount.plus(fee);

    return formatBigNumber(inputAmount, 'input');
  };

  const handleTypeOutput = async (outputTypedValue: string) => {
    let inputAmount;
    let amount;

    const inputCurrencySymbol = inputCurrency.symbol.toLowerCase();
    const outputCurrencySymbol = outputCurrency.symbol.toLowerCase();

    const ratioLocal = tokenRatio(inputCurrency.symbol, outputCurrency.symbol);

    if (!ratioLocal) {
      console.log(`Cannot get rate from this pair`);
    }

    const poolTotalBase = getPoolData(inputCurrency.symbol, outputCurrency.symbol)?.poolTotalInput || ZERO;

    let maxOutputAmount = calculateOutputAmount(
      inputCurrencySymbol,
      outputCurrencySymbol,
      poolTotalBase.toString(),
      '',
    );

    if (new BigNumber(outputTypedValue).isGreaterThanOrEqualTo(maxOutputAmount)) {
      maxOutputAmount = validate_with_wallet_balance(maxOutputAmount, outputCurrency.symbol);
      setSwapOutputAmount(formatBigNumber(maxOutputAmount, 'input'));
      inputAmount = calculateOutputAmount(inputCurrencySymbol, outputCurrencySymbol, '', maxOutputAmount.toString());
    } else {
      let validatedAmount = validate_with_wallet_balance(new BigNumber(outputTypedValue), outputCurrency.symbol);
      outputTypedValue === ''
        ? setSwapOutputAmount('')
        : setSwapOutputAmount(
            validatedAmount.isEqualTo(new BigNumber(outputTypedValue))
              ? validatedAmount
              : formatBigNumber(validatedAmount, 'input'),
          );

      inputAmount = calculateOutputAmount(inputCurrencySymbol, outputCurrencySymbol, '', outputTypedValue);
    }

    outputTypedValue = outputTypedValue || '';

    const symbol = `${inputCurrencySymbol}_${outputCurrencySymbol}`;

    switch (true) {
      case symbol === 'sicx_icx':
        amount = calculate_sICX_2_ICX_intput_amount(outputTypedValue);
        break;

      case symbol === 'icx_sicx':
        amount = calculate_ICX_2_sICX_intput_amount(outputTypedValue);
        break;

      default:
        amount = await calculate_default_intput_amount(inputAmount);
        break;
    }

    if (amount === '0') {
      setSwapInputAmount('');
    } else {
      setSwapInputAmount(amount);
    }
  };

  const [chartOption, setChartOption] = React.useState({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['5m'],
  });

  const handleChartPeriodChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const interval: any = event.currentTarget.value;
    loadChartData({
      inputSymbol: inputCurrency.symbol.toLowerCase(),
      outputSymbol: outputCurrency.symbol.toLowerCase(),
      interval: interval.toLowerCase(),
    });
    setChartOption({
      ...chartOption,
      period: interval,
    });
  };

  const handleChartTypeChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setChartOption({
      ...chartOption,
      type: event.currentTarget.value,
    });
  };

  const handleTypeInput = React.useCallback(
    (val: string) => {
      const poolTotalBase = getPoolData(inputCurrency.symbol, outputCurrency.symbol)?.poolTotalInput || ZERO;

      if (new BigNumber(val).isGreaterThanOrEqualTo(poolTotalBase)) {
        val = formatBigNumber(poolTotalBase, 'input');
      }

      let validatedAmount = validate_with_wallet_balance(new BigNumber(val), inputCurrency.symbol);
      if (!validatedAmount.isEqualTo(new BigNumber(val))) {
        val = validatedAmount.toString();
        setSwapInputAmount(formatBigNumber(validatedAmount, 'input'));
      } else {
        setSwapInputAmount(val ? val : '');
      }

      handleConvertOutputRate(inputCurrency, outputCurrency, val);
    },
    [inputCurrency, outputCurrency, handleConvertOutputRate, getPoolData, validate_with_wallet_balance],
  );

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
    changeShouldLedgerSign(false);
  };

  const handleSwap = () => {
    if (!account) {
      toggleWalletModal();
    } else {
      if (!swapInputAmount || !swapOutputAmount) {
        return;
      }
      setShowSwapConfirm(true);
    }
  };

  const handleSwapConfirm = async () => {
    if (!account) return;

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const minimumToReceive = new BigNumber(((1e4 - rawSlippage) * parseFloat(swapOutputAmount)) / 1e4);
    if (inputCurrency.symbol.toLowerCase() === 'sicx' && outputCurrency.symbol.toLowerCase() !== 'icx') {
      bnJs
        .inject({ account })
        .sICX.swap(new BigNumber(swapInputAmount), outputCurrency.symbol, BalancedJs.utils.toLoop(minimumToReceive))
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .pendingMessage,
              summary: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .successMessage,
            },
          );
          refreshPrice();
          setSwapInputAmount('');
          setSwapOutputAmount('');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else if (inputCurrency.symbol.toLowerCase() === 'sicx' && outputCurrency.symbol.toLowerCase() === 'icx') {
      bnJs
        .inject({ account })
        .sICX.swapToICX(new BigNumber(swapInputAmount))
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .pendingMessage,
              summary: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .successMessage,
            },
          );
          refreshPrice();
          setSwapInputAmount('');
          setSwapOutputAmount('');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else if (inputCurrency.symbol.toLowerCase() === 'baln') {
      bnJs
        .inject({ account: account })
        .BALN.swap(new BigNumber(swapInputAmount), outputCurrency.symbol, BalancedJs.utils.toLoop(minimumToReceive))
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .pendingMessage,
              summary: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .successMessage,
            },
          );
          refreshPrice();
          setSwapInputAmount('');
          setSwapOutputAmount('');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else if (inputCurrency.symbol === 'ICX') {
      bnJs
        .inject({ account: account })
        .Staking.stakeICX(account, new BigNumber(swapInputAmount))
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .pendingMessage,
              summary: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .successMessage,
            },
          );
          refreshPrice();
          setSwapInputAmount('');
          setSwapOutputAmount('');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else if (inputCurrency.symbol.toLowerCase() === 'bnusd') {
      bnJs
        .inject({ account })
        .bnUSD.swap(new BigNumber(swapInputAmount), outputCurrency.symbol, BalancedJs.utils.toLoop(minimumToReceive))
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .pendingMessage,
              summary: swapMessage(swapInputAmount, inputCurrency.symbol, swapOutputAmount, outputCurrency.symbol)
                .successMessage,
            },
          );
          refreshPrice();
          setSwapInputAmount('');
          setSwapOutputAmount('');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else {
      console.log(`this pair is currently not supported on balanced interface`);
    }
  };

  //
  const [rawSlippage, setRawSlippage] = React.useState(250);
  const [ttl, setTtl] = React.useState(0);

  // update the width on a window resize
  const ref = React.useRef<HTMLDivElement>();
  const [width, setWidth] = React.useState(ref?.current?.clientWidth);
  React.useEffect(() => {
    function handleResize() {
      setWidth(ref?.current?.clientWidth ?? width);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const loadChartData = React.useCallback(
    ({ interval, inputSymbol, outputSymbol }: { interval: string; inputSymbol: string; outputSymbol: string }) => {
      setLoading(true);
      try {
        axios
          .get(
            `https://balanced.techiast.com:8069/api/v1/chart/lines?symbol=${
              inputSymbol === 'bnusd' || inputSymbol === 'icx' ? outputSymbol + inputSymbol : inputSymbol + outputSymbol
            }&interval=${interval}&limit=500&order=desc`,
          )
          .then(res => {
            const { data: d } = res;
            let t = d.map(item => ({
              time: item.time,
              value:
                inputSymbol === 'bnusd' || inputSymbol === 'icx'
                  ? 1 / BalancedJs.utils.toIcx(new BigNumber(item.price)).toNumber()
                  : BalancedJs.utils.toIcx(new BigNumber(item.price)).toNumber(),
            }));

            if (!t.length) {
              console.log('No chart data, switch to others trading pairs');
              return;
            }
            setData(t);
            setLoading(false);
          });
      } catch (e) {
        console.error(e);
        setData([]);
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    loadChartData({
      inputSymbol: inputCurrency.symbol.toLowerCase(),
      outputSymbol: outputCurrency.symbol.toLowerCase(),
      interval: '5m',
    });
    refreshPrice();
  }, [inputCurrency.symbol, outputCurrency.symbol, loadChartData, refreshPrice]);

  const handleInputSelect = React.useCallback(
    ccy => {
      setInputCurrency(ccy);
      handleConvertOutputRate(ccy, outputCurrency, swapInputAmount);
      loadChartData({
        inputSymbol: ccy.symbol.toLowerCase(),
        outputSymbol: outputCurrency.symbol.toLowerCase(),
        interval: chartOption.period.toLowerCase(),
      });
    },
    [swapInputAmount, handleConvertOutputRate, outputCurrency, chartOption, loadChartData],
  );

  const handleOutputSelect = React.useCallback(
    ccy => {
      setOutputCurrency(ccy);
      handleConvertOutputRate(inputCurrency, ccy, swapInputAmount);
      loadChartData({
        inputSymbol: inputCurrency.symbol.toLowerCase(),
        outputSymbol: ccy.symbol.toLowerCase(),
        interval: chartOption.period.toLowerCase(),
      });
    },
    [swapInputAmount, handleConvertOutputRate, inputCurrency, chartOption, loadChartData],
  );

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={[5, 7]} flexDirection="column" alignItems="stretch" flex={1}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">Swap</Typography>
            <Typography>
              {`Wallet: ${formatBigNumber(balances[inputCurrency.symbol], 'currency')} ${inputCurrency.symbol}`}
            </Typography>
          </Flex>

          <Flex mt={3} mb={5}>
            <CurrencyInputPanel
              value={swapInputAmount}
              showMaxButton={false}
              currency={inputCurrency}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              id="swap-currency-input"
              currencyList={Object.keys(SUPPORTED_PAIRS)}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">For</Typography>
            <Typography>
              {`Wallet: ${formatBigNumber(balances[outputCurrency.symbol], 'currency')} ${outputCurrency.symbol}`}
            </Typography>
          </Flex>

          <Flex mt={3} mb={5}>
            <CurrencyInputPanel
              value={swapOutputAmount}
              showMaxButton={false}
              currency={outputCurrency}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              id="swap-currency-output"
              currencyList={Object.keys(SUPPORTED_PAIRS[inputCurrency.symbol])}
            />
          </Flex>

          <Divider mb={3} />

          <Flex alignItems="center" justifyContent="space-between" mb={1}>
            <Typography>Minimum to receive</Typography>
            <Typography>
              {!swapOutputAmount
                ? formatBigNumber(new BigNumber(0), 'ratio')
                : formatBigNumber(
                    new BigNumber(((1e4 - rawSlippage) * parseFloat(swapOutputAmount)) / 1e4),
                    'currency',
                  )}{' '}
              {outputCurrency.symbol}
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography as="span">
              Slippage tolerance
              <QuestionHelper text="If the price slips by more than this amount, your swap will fail." />
            </Typography>
            <DropdownText text={`${formatBigNumber(new BigNumber(rawSlippage / 100), 'currency')}%`}>
              <SlippageSetting
                rawSlippage={rawSlippage}
                setRawSlippage={setRawSlippage}
                deadline={ttl}
                setDeadline={setTtl}
              />
            </DropdownText>
          </Flex>

          <Flex justifyContent="center">
            <Button color="primary" marginTop={5} onClick={handleSwap}>
              Swap
            </Button>
          </Flex>
        </BrightPanel>

        <Box bg="bg2" flex={1} padding={[5, 7]}>
          <Flex mb={5} flexWrap="wrap">
            <Box width={[1, 1 / 2]}>
              <Typography variant="h3" mb={2}>
                {inputCurrency.symbol} / {outputCurrency.symbol}
              </Typography>
              <Typography variant="p">
                {formatBigNumber(new BigNumber(tokenRatio(inputCurrency.symbol, outputCurrency.symbol)), 'currency')}{' '}
                {outputCurrency.symbol} per {inputCurrency.symbol}{' '}
                <span className="alert" style={{ display: 'none' }}>
                  -1.21%
                </span>
              </Typography>
            </Box>
            <Box width={[1, 1 / 2]} marginTop={[3, 0]} style={{ display: 'none' }}>
              <ChartControlGroup mb={2}>
                {Object.keys(CHART_PERIODS).map(key => (
                  <ChartControlButton
                    key={key}
                    type="button"
                    value={CHART_PERIODS[key]}
                    onClick={handleChartPeriodChange}
                    active={chartOption.period === CHART_PERIODS[key]}
                  >
                    {CHART_PERIODS[key]}
                  </ChartControlButton>
                ))}
              </ChartControlGroup>

              <ChartControlGroup>
                <ChartControlButton
                  key={CHART_TYPES.AREA}
                  type="button"
                  value={CHART_TYPES.AREA}
                  onClick={handleChartTypeChange}
                  active={chartOption.type === CHART_TYPES.AREA}
                >
                  {CHART_TYPES.AREA}
                </ChartControlButton>
              </ChartControlGroup>
            </Box>
          </Flex>
          <Flex
            alignItems="center"
            justifyContent="center"
            mt={3}
            style={{ height: 'calc(100% - 60px)', marginTop: '0px' }}
          >
            Chart coming soon.
          </Flex>
          {chartOption.type === CHART_TYPES.AREA && (
            <ChartContainer ref={ref} style={{ display: 'none' }}>
              {loading ? <Spinner centered /> : <TradingViewChart data={data} width={width} type={CHART_TYPES.AREA} />}
            </ChartContainer>
          )}
        </Box>
      </SectionPanel>
      <Modal isOpen={showSwapConfirm} onDismiss={handleSwapConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Swap {inputCurrency.symbol} for {outputCurrency.symbol}?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {formatBigNumber(new BigNumber(tokenRatio(outputCurrency.symbol, inputCurrency.symbol)), 'ratio')}{' '}
            {inputCurrency.symbol} per {outputCurrency.symbol}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Pay</Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(swapInputAmount), 'currency')} {inputCurrency.symbol}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(swapOutputAmount), 'currency')} {outputCurrency.symbol}
              </Typography>
            </Box>
          </Flex>

          <Typography
            textAlign="center"
            style={
              inputCurrency.symbol.toLowerCase() === 'icx' && outputCurrency.symbol.toLowerCase() === 'sicx'
                ? { display: 'none' }
                : {}
            }
          >
            Includes a fee of {formatBigNumber(new BigNumber(swapFee), 'currency')} {inputCurrency.symbol}.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleSwapConfirmDismiss}>Cancel</TextButton>
            <Button onClick={handleSwapConfirm}>Swap</Button>
          </Flex>
          {shouldLedgerSign && <ShouldLedgerConfirmMessage />}
        </Flex>
      </Modal>
    </>
  );
}
