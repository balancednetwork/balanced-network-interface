import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import Spinner from 'app/components/Spinner';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST, getFilteredCurrencies, SupportedBaseCurrencies } from 'constants/currency';
import { dayData, candleData, volumeData } from 'demo';
import { useWalletICXBalance } from 'hooks';
import { useRatioValue } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

import { SectionPanel, BrightPanel } from './utils';

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

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export default function SwapPanel() {
  const { account } = useIconReact();
  const walletBalance = useWalletBalanceValue();
  const ratio = useRatioValue();
  const addTransaction = useTransactionAdder();
  const ICXbalance = useWalletICXBalance(account);

  const tokenBalance = (symbol: string) => {
    if (account) {
      if (symbol === 'ICX') {
        return ICXbalance;
      } else if (symbol === 'BALN') {
        return walletBalance.BALNbalance;
      } else if (symbol === 'sICX') {
        return walletBalance.sICXbalance;
      } else if (symbol === 'bnUSD') {
        return walletBalance.bnUSDbalance;
      }
    }
  };

  const [swapInputAmount, setSwapInputAmount] = React.useState('0');

  const [swapOutputAmount, setSwapOutputAmount] = React.useState('0');

  const [inputCurrency, setInputCurrency] = React.useState(CURRENCYLIST['sicx']);

  const [outputCurrency, setOutputCurrency] = React.useState(CURRENCYLIST['bnusd']);

  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const [swapFee, setSwapFee] = React.useState('0');

  const tokenRatio = React.useCallback(
    (symbol: string) => {
      if (symbol === 'ICX') {
        let icxRatio = ratio.sICXICXratio?.toNumber() || 0;
        return icxRatio ? 1 / icxRatio : 0;
      } else if (symbol === 'BALN') {
        return ratio.BALNbnUSDratio?.toNumber() || 0;
      } else if (symbol === 'sICX' && outputCurrency.symbol === 'bnUSD') {
        return ratio.sICXbnUSDratio?.toNumber() || 0;
      } else if (symbol === 'sICX' && outputCurrency.symbol === 'ICX') {
        return ratio.sICXICXratio?.toNumber() || 0;
      }
      return 0;
    },
    [outputCurrency.symbol, ratio.BALNbnUSDratio, ratio.sICXICXratio, ratio.sICXbnUSDratio],
  );

  const handleTypeOutput = (val: string) => {
    setSwapOutputAmount(val);
    let ratioLocal = tokenRatio(inputCurrency.symbol);
    if (!ratioLocal) {
      console.log(`Cannot get rate from this pair`);
    }
    if (!val) {
      val = '0';
    }
    setSwapInputAmount((parseFloat(val) / ratioLocal).toFixed(inputCurrency.decimals).toString());
  };

  const handleTypeInput = React.useCallback(
    (val: string) => {
      setSwapInputAmount(val);
      let ratioLocal = tokenRatio(inputCurrency.symbol);
      if (!ratioLocal) {
        console.log(`Cannot get rate from this pair`);
      }
      if (!val) {
        val = '0';
      }
      if (inputCurrency.symbol.toLowerCase() === 'icx' && outputCurrency.symbol.toLowerCase() === 'sicx') {
        setSwapOutputAmount((parseFloat(val) * ratioLocal).toFixed(outputCurrency.decimals).toString());
      } else if (inputCurrency.symbol.toLowerCase() === 'sicx' && outputCurrency.symbol.toLowerCase() === 'icx') {
        const fee = parseFloat(val) * 0.1;
        setSwapFee(fee.toFixed(inputCurrency.decimals).toString());
        val = (parseFloat(val) - fee).toString();
        setSwapOutputAmount((parseFloat(val) * ratioLocal).toFixed(outputCurrency.decimals).toString());
      } else {
        bnJs
          .eject({ account: account })
          .Dex.getFees()
          .then(res => {
            const bal_holder_fee = parseInt(res[`pool_baln_fee`], 16);
            const lp_fee = parseInt(res[`pool_lp_fee`], 16);
            const fee = (parseFloat(val) * (bal_holder_fee + lp_fee)) / 10000;
            setSwapFee(fee.toFixed(inputCurrency.decimals).toString());
            val = (parseFloat(val) - fee).toString();
            setSwapOutputAmount((parseFloat(val) * ratioLocal).toFixed(outputCurrency.decimals).toString());
          })
          .catch(e => {
            console.error('error', e);
          });
      }
    },
    [account, inputCurrency.decimals, inputCurrency.symbol, tokenRatio, outputCurrency.decimals, outputCurrency.symbol],
  );

  const handleInputSelect = React.useCallback(
    ccy => {
      setInputCurrency(ccy);
      handleTypeInput(swapInputAmount);
    },
    [swapInputAmount, handleTypeInput],
  );

  const handleOutputSelect = React.useCallback(
    ccy => {
      setOutputCurrency(ccy);
      handleTypeInput(swapInputAmount);
    },
    [swapInputAmount, handleTypeInput],
  );

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
  };

  const handleSwap = () => {
    if (!account) {
      // todo: require access to wallet to execute trade
    } else {
      if (!swapInputAmount || !swapOutputAmount) {
        return;
      }
      setShowSwapConfirm(true);
    }
  };

  const handleSwapConfirm = () => {
    if (!account) return;
    if (inputCurrency.symbol === 'sICX' && outputCurrency.symbol === 'bnUSD') {
      bnJs
        .eject({ account: account })
        //.sICX.borrowAdd(newBorrowValue)
        //.bnUSD.swapBysICX(parseFloat(swapInputAmount), '10')
        .sICX.swapBybnUSD(parseFloat(swapInputAmount), rawSlippage + '')
        .then(res => {
          console.log('res', res);
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            { summary: `Created tx swap from ${inputCurrency.symbol} to ${outputCurrency.symbol} successfully.` },
          );
        })
        .catch(e => {
          console.error('error', e);
        });
    } else if (inputCurrency.symbol === 'sICX' && outputCurrency.symbol === 'ICX') {
      bnJs
        .eject({ account: account })
        .sICX.swapToICX(parseFloat(swapInputAmount))
        .then(res => {
          console.log('res', res);
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            { summary: `Created tx swap from ${inputCurrency.symbol} to ${outputCurrency.symbol} successfully.` },
          );
        })
        .catch(e => {
          console.error('error', e);
        });
    } else if (inputCurrency.symbol === 'BALN') {
      bnJs
        .eject({ account: account })
        .Baln.swapToBnUSD(parseFloat(swapInputAmount), rawSlippage + '')
        .then(res => {
          console.log('res', res);
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            { summary: `Created tx swap from ${inputCurrency.symbol} to ${outputCurrency.symbol} successfully.` },
          );
        })
        .catch(e => {
          console.error('error', e);
        });
    } else if (inputCurrency.symbol === 'ICX') {
      bnJs
        .eject({ account: account })
        .Dex.transferICX(parseFloat(swapInputAmount))
        .then(res => {
          console.log('res', res);
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            { summary: `Created tx swap from ${inputCurrency.symbol} to ${outputCurrency.symbol} successfully.` },
          );
        })
        .catch(e => {
          console.error('error', e);
        });
    } else {
      console.log(`this pair is currently not supported on balanced interface`);
    }
  };

  const [chartOption, setChartOption] = React.useState({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['5m'],
  });

  const handleChartPeriodChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setChartOption({
      ...chartOption,
      period: event.currentTarget.value,
    });
  };

  const handleChartTypeChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setChartOption({
      ...chartOption,
      type: event.currentTarget.value,
    });
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

  React.useEffect(() => {
    setLoading(true);
    try {
      axios.get('http://35.240.219.80:8069/api/v1/chart/lines?symbol=SICXbnUSD&limit=500&order=desc').then(res => {
        const { data: d } = res;
        let t = d.map(item => ({ time: item.time, value: convertLoopToIcx(new BigNumber(item.price)) }));
        setData(t);
        setLoading(false);
      });
    } catch (e) {
      console.error(e);
      setData([]);
      setLoading(false);
    }
  }, []);

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={7} flexDirection="column" alignItems="stretch" flex={1}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">Swap</Typography>
            <Typography>
              Wallet: {tokenBalance(inputCurrency.symbol)?.toFixed(inputCurrency.decimals)} {inputCurrency.symbol}{' '}
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
              currencyList={SupportedBaseCurrencies}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">For</Typography>
            <Typography>
              Wallet: {tokenBalance(outputCurrency.symbol)?.toFixed(outputCurrency.decimals)} {outputCurrency.symbol}
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
                ? new BigNumber(0).toNumber().toFixed(outputCurrency.decimals)
                : (((1e4 - rawSlippage) * parseFloat(swapOutputAmount)) / 1e4).toFixed(outputCurrency.decimals)}{' '}
              {outputCurrency.symbol}
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography as="span">
              Slippage tolerance
              <QuestionHelper text="If the price slips by more than this amount, your swap will fail." />
            </Typography>
            <DropdownText text={`${(rawSlippage / 100).toFixed(2)}%`}>
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

        <Box bg="bg2" flex={1} padding={7}>
          <Flex mb={5} flexWrap="wrap">
            <Box width={[1, 1 / 2]}>
              <Typography variant="h3" mb={2}>
                {inputCurrency.symbol} / {outputCurrency.symbol}
              </Typography>
              <Typography variant="p">
                {ratio.sICXbnUSDratio?.toFixed(2)} {outputCurrency.symbol} per {inputCurrency.symbol}{' '}
                <span className="alert">-1.21%</span>
              </Typography>
            </Box>
            <Box width={[1, 1 / 2]} marginTop={[3, 0]}>
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
                {Object.keys(CHART_TYPES).map(key => (
                  <ChartControlButton
                    key={key}
                    type="button"
                    value={CHART_TYPES[key]}
                    onClick={handleChartTypeChange}
                    active={chartOption.type === CHART_TYPES[key]}
                  >
                    {CHART_TYPES[key]}
                  </ChartControlButton>
                ))}
              </ChartControlGroup>
            </Box>
          </Flex>

          {chartOption.type === CHART_TYPES.AREA && (
            <ChartContainer ref={ref}>
              {loading ? (
                <Spinner centered />
              ) : (
                <TradingViewChart data={data} candleData={dayData} width={width} type={CHART_TYPES.AREA} />
              )}
            </ChartContainer>
          )}

          {chartOption.type === CHART_TYPES.CANDLE && (
            <Box ref={ref}>
              <TradingViewChart data={volumeData} candleData={candleData} width={width} type={CHART_TYPES.CANDLE} />
            </Box>
          )}
        </Box>
      </SectionPanel>
      <Modal isOpen={showSwapConfirm} onDismiss={handleSwapConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Swap {inputCurrency.symbol} for {outputCurrency.symbol}?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {tokenRatio(inputCurrency.symbol).toFixed(2)} {inputCurrency.symbol} per {outputCurrency.symbol}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Pay</Typography>
              <Typography variant="p" textAlign="center">
                {swapInputAmount} {inputCurrency.symbol}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
              <Typography variant="p" textAlign="center">
                {swapOutputAmount} {outputCurrency.symbol}
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
            Includes a fee of {swapFee} {inputCurrency.symbol}.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleSwapConfirmDismiss}>Cancel</TextButton>
            <Button onClick={handleSwapConfirm}>Swap</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
