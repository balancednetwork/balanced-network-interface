import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
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
import { CURRENCY_LIST, getFilteredCurrencies, SUPPORTED_BASE_CURRENCIES } from 'constants/currency';
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
  text-align: left;

  ${({ theme }) => theme.mediaWidth.upSmall`
    text-align: right;
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
  const addTransaction = useTransactionAdder();
  const changeRatioValue = useChangeRatio();
  const toggleWalletModal = useWalletModalToggle();

  const shouldLedgerSign = useShouldLedgerSign();
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

  const getBalance = React.useCallback(
    (symbol: string) => {
      if (symbol.toLocaleLowerCase() === 'icx') {
        return balances.ICX;
      } else if (symbol.toLocaleLowerCase() === 'sicx') {
        return balances.sICX;
      } else if (symbol.toLocaleLowerCase() === 'baln') {
        return balances.BALN;
      } else if (symbol.toLocaleLowerCase() === 'bnusd') {
        return balances.bnUSD;
      }
    },
    [balances],
  );

  const tokenRatio = React.useCallback(
    (symbolInput: string, symbolOutput: string) => {
      if (symbolInput === 'ICX') {
        let icxRatio = ratio.sICXICXratio?.toNumber() || 0;
        return icxRatio ? new BigNumber(1 / icxRatio) : new BigNumber(0);
      } else if (symbolInput === 'BALN') {
        return ratio.BALNbnUSDratio || new BigNumber(0);
      } else if (symbolInput === 'sICX' && symbolOutput === 'bnUSD') {
        return ratio.sICXbnUSDratio || new BigNumber(0);
      } else if (symbolInput === 'sICX' && symbolOutput === 'ICX') {
        return ratio.sICXICXratio || new BigNumber(0);
      } else if (symbolInput === 'bnUSD' && symbolOutput === 'sICX') {
        let bnUSDRatio = ratio.sICXbnUSDratio || new BigNumber(0);
        return bnUSDRatio ? new BigNumber(1).dividedBy(bnUSDRatio) : new BigNumber(0);
      } else if (symbolInput === 'bnUSD' && symbolOutput === 'BALN') {
        let bnUSDRatio = ratio.BALNbnUSDratio || new BigNumber(0);
        return bnUSDRatio ? new BigNumber(1).dividedBy(bnUSDRatio) : new BigNumber(0);
      }
      return 0;
    },
    [ratio.BALNbnUSDratio, ratio.sICXICXratio, ratio.sICXbnUSDratio],
  );

  const getPoolData = React.useCallback(
    (symbolInput: string, symbolOutput: string) => {
      if (symbolInput === 'sicx' && symbolOutput === 'icx') {
        return {
          poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXICX].base,
          poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXICX].quote,
        };
      } else if (symbolInput === 'icx' && symbolOutput === 'sicx') {
        return {
          poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXICX].quote,
          poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXICX].base,
        };
      } else if (symbolInput === 'sicx' && symbolOutput === 'bnusd') {
        return {
          poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].base,
          poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].quote,
        };
      } else if (symbolInput === 'bnusd' && symbolOutput === 'sicx') {
        return {
          poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].quote,
          poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].base,
        };
      } else if (symbolInput === 'baln' && symbolOutput === 'bnusd') {
        return {
          poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].base,
          poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].quote,
        };
      } else if (symbolInput === 'bnusd' && symbolOutput === 'baln') {
        return {
          poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].quote,
          poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].base,
        };
      }
    },
    [pools],
  );

  const calculateOutputAmount = React.useCallback(
    (symbolInput: string, symbolOutput: string, amountInput: string, amountOutput: string) => {
      let poolTotalInput = getPoolData(symbolInput, symbolOutput)?.poolTotalInput || ZERO;
      let poolTotalOutput = getPoolData(symbolInput, symbolOutput)?.poolTotalOutput || ZERO;

      if ((symbolInput === 'icx' && symbolOutput === 'sicx') || (symbolInput === 'sicx' && symbolOutput === 'icx')) {
        return amountInput ? new BigNumber(amountInput) : new BigNumber(amountOutput);
      }

      let inputBalance = getBalance(symbolInput) || new BigNumber(0);
      if (new BigNumber(amountInput).isGreaterThanOrEqualTo(inputBalance)) {
        amountInput = inputBalance.toString();
      }

      if (amountOutput === '') {
        // let new_from_token = poolTotalInput.plus(new BigNumber(amountInput));
        // let new_to_token = poolTotalInput.multipliedBy(poolTotalOutput).dividedBy(new_from_token);
        // let receive_token = poolTotalOutput.minus(new_to_token);

        let receive_token = poolTotalOutput.minus(
          poolTotalOutput.multipliedBy(poolTotalInput).dividedBy(poolTotalInput.plus(new BigNumber(amountInput))),
        );

        return receive_token;
      } else {
        // let new_to_token = poolTotalOutput.minus(new BigNumber(amountOutput));
        // let new_from_token = poolTotalInput.multipliedBy(poolTotalOutput).dividedBy(new_to_token);
        // let amountInput = new_from_token.minus(poolTotalInput);

        let amountInput = poolTotalOutput
          .multipliedBy(poolTotalInput)
          .dividedBy(poolTotalOutput.minus(amountOutput))
          .minus(poolTotalInput);
        let inputBalance = getBalance(symbolInput) || new BigNumber(0);
        if (amountInput.isGreaterThanOrEqualTo(inputBalance)) {
          amountInput = inputBalance;
        }
        return amountInput;
      }
    },
    [getPoolData, getBalance],
  );

  const handleConvertOutputRate = React.useCallback(
    (inputCurrency: any, outputCurrency: any, val: string) => {
      let ratioLocal = tokenRatio(inputCurrency.symbol, outputCurrency.symbol);
      if (!ratioLocal) {
        console.log(`Cannot get rate from this pair`);
      }
      if (!val) {
        val = '0';
      }
      if (inputCurrency.symbol.toLowerCase() === 'icx' && outputCurrency.symbol.toLowerCase() === 'sicx') {
        setSwapOutputAmount(formatBigNumber(new BigNumber(val).multipliedBy(ratioLocal), 'input'));
      } else if (inputCurrency.symbol.toLowerCase() === 'sicx' && outputCurrency.symbol.toLowerCase() === 'icx') {
        const fee = parseFloat(val) / 100;
        setSwapFee(new BigNumber(fee).toString());
        val = (parseFloat(val) - fee).toString();
        setSwapOutputAmount(formatBigNumber(new BigNumber(val).multipliedBy(ratioLocal), 'input'));
      } else {
        bnJs
          .inject({ account })
          .Dex.getFees()
          .then(res => {
            const bal_holder_fee = parseInt(res[`pool_baln_fee`], 16);
            const lp_fee = parseInt(res[`pool_lp_fee`], 16);
            const fee = (parseFloat(val) * (bal_holder_fee + lp_fee)) / 10000;
            setSwapFee(new BigNumber(fee).toString());
            val = (parseFloat(val) - fee).toString();
            setSwapOutputAmount(
              formatBigNumber(
                calculateOutputAmount(inputCurrency.symbol.toLowerCase(), outputCurrency.symbol.toLowerCase(), val, ''),
                'ratio',
              ),
            );
            //setSwapOutputAmount(formatBigNumber(new BigNumber(val).multipliedBy(ratioLocal), 'ratio'));
          })
          .catch(e => {
            console.error('error', e);
          });
      }
    },
    [account, tokenRatio, calculateOutputAmount],
  );

  const handleTypeOutput = (val: string) => {
    let ratioLocal = tokenRatio(inputCurrency.symbol, outputCurrency.symbol);
    let poolTotalBase =
      getPoolData(inputCurrency.symbol.toLowerCase(), outputCurrency.symbol.toLowerCase())?.poolTotalInput || ZERO;
    let maxOutputAmount = calculateOutputAmount(
      inputCurrency.symbol.toLowerCase(),
      outputCurrency.symbol.toLowerCase(),
      poolTotalBase.toString(),
      '',
    );
    let inputAmount = new BigNumber(0);
    if (!ratioLocal) {
      console.log(`Cannot get rate from this pair`);
    }

    if (new BigNumber(val).isGreaterThanOrEqualTo(maxOutputAmount)) {
      setSwapOutputAmount(formatBigNumber(maxOutputAmount, 'input'));
      inputAmount = calculateOutputAmount(
        inputCurrency.symbol.toLowerCase(),
        outputCurrency.symbol.toLowerCase(),
        '',
        maxOutputAmount.toString(),
      );
    } else {
      setSwapOutputAmount(val);
      inputAmount = calculateOutputAmount(
        inputCurrency.symbol.toLowerCase(),
        outputCurrency.symbol.toLowerCase(),
        '',
        val,
      );
    }

    if (!val) {
      val = '0';
    }

    if (inputCurrency.symbol.toLowerCase() === 'sicx' && outputCurrency.symbol.toLowerCase() === 'icx') {
      inputAmount = new BigNumber(val).plus(new BigNumber(val).multipliedBy(0.01));
      setSwapInputAmount(formatBigNumber(inputAmount, 'input'));
    } else if (inputCurrency.symbol.toLowerCase() === 'icx' && outputCurrency.symbol.toLowerCase() === 'sicx') {
      setSwapInputAmount(formatBigNumber(new BigNumber(val), 'input'));
    } else {
      bnJs
        .inject({ account })
        .Dex.getFees()
        .then(res => {
          const bal_holder_fee = parseInt(res[`pool_baln_fee`], 16);
          const lp_fee = parseInt(res[`pool_lp_fee`], 16);
          const fee = inputAmount.multipliedBy(new BigNumber(bal_holder_fee + lp_fee)).dividedBy(new BigNumber(10000));
          setSwapFee(new BigNumber(fee).toString());
          inputAmount = inputAmount.plus(fee);
          let inputBalance = getBalance(inputCurrency.symbol.toLowerCase()) || new BigNumber(0);
          if (inputAmount.isGreaterThanOrEqualTo(inputBalance)) {
            inputAmount = inputBalance;
            setSwapInputAmount(formatBigNumber(inputAmount, 'input'));
            inputAmount = inputAmount.minus(fee);
            let outputAmount = calculateOutputAmount(
              inputCurrency.symbol.toLowerCase(),
              outputCurrency.symbol.toLowerCase(),
              inputAmount.toString(),
              '',
            );
            setSwapOutputAmount(formatBigNumber(outputAmount, 'input'));
          } else {
            setSwapInputAmount(formatBigNumber(inputAmount, 'input'));
          }
        })
        .catch(e => {
          console.error('error', e);
        });
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
      let inputBalance = getBalance(inputCurrency.symbol.toLowerCase()) || new BigNumber(0);
      if (new BigNumber(val).isGreaterThanOrEqualTo(inputBalance)) {
        val = formatBigNumber(inputBalance, 'input');
      }
      let poolTotalBase =
        getPoolData(inputCurrency.symbol.toLowerCase(), outputCurrency.symbol.toLowerCase())?.poolTotalInput || ZERO;
      if (new BigNumber(val).isGreaterThanOrEqualTo(poolTotalBase)) {
        val = formatBigNumber(poolTotalBase, 'input');
      }
      setSwapInputAmount(val);
      handleConvertOutputRate(inputCurrency, outputCurrency, val);
    },
    [inputCurrency, outputCurrency, handleConvertOutputRate, getPoolData, getBalance],
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
    if (inputCurrency.symbol === 'sICX' && outputCurrency.symbol === 'bnUSD') {
      bnJs
        .inject({ account })
        .sICX.swapBybnUSD(new BigNumber(swapInputAmount), BalancedJs.utils.toLoop(minimumToReceive))
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
          setSwapInputAmount('0');
          setSwapOutputAmount('0');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else if (inputCurrency.symbol === 'sICX' && outputCurrency.symbol === 'ICX') {
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
          setSwapInputAmount('0');
          setSwapOutputAmount('0');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else if (inputCurrency.symbol === 'BALN') {
      bnJs
        .inject({ account: account })
        .BALN.swapToBnUSD(new BigNumber(swapInputAmount), BalancedJs.utils.toLoop(minimumToReceive))
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
          setSwapInputAmount('0');
          setSwapOutputAmount('0');
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
          setSwapInputAmount('0');
          setSwapOutputAmount('0');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
        });
    } else if (inputCurrency.symbol === 'bnUSD') {
      bnJs
        .inject({ account })
        .bnUSD.swapToOutputCurrency(
          new BigNumber(swapInputAmount),
          outputCurrency.symbol,
          BalancedJs.utils.toLoop(minimumToReceive),
        )
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
          setSwapInputAmount('0');
          setSwapOutputAmount('0');
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
              currencyList={SUPPORTED_BASE_CURRENCIES}
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
              currencyList={getFilteredCurrencies(inputCurrency.symbol)}
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
