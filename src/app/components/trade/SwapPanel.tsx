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
import { CURRENCYLIST, SupportedBaseCurrencies } from 'constants/currency';
import { dayData /* , candleData, volumeData */ } from 'demo';
import { useRatioValue } from 'store/ratio/hooks';
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
  const sICXbnUSDratio = ratio.sICXbnUSDratio?.toNumber() || 0;

  const [swapInputAmount, setSwapInputAmount] = React.useState('0');

  const handleTypeInput = (val: string) => {
    setSwapInputAmount(val);
    setSwapOutputAmount((parseFloat(val) * sICXbnUSDratio).toFixed(2).toString());
  };

  const [swapOutputAmount, setSwapOutputAmount] = React.useState('0');

  const handleTypeOutput = (val: string) => {
    setSwapOutputAmount(val);
    setSwapInputAmount((parseFloat(val) / sICXbnUSDratio).toFixed(2).toString());
  };

  const defaultInputCurrency = CURRENCYLIST['sicx'];
  const defaultOutputCurrency = CURRENCYLIST['bnusd'];

  const [inputCurrency, setInputCurrency] = React.useState(defaultInputCurrency);

  const [outputCurrency, setOutputCurrency] = React.useState(defaultOutputCurrency);

  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
  };

  const handleSwap = () => {
    setShowSwapConfirm(true);
  };

  const handleSwapConfirm = () => {
    if (!account) return;
    bnJs
      .eject({ account: account })
      //.sICX.borrowAdd(newBorrowValue)
      //.bnUSD.swapBysICX(parseFloat(swapInputAmount), '10')
      .sICX.swapBybnUSD(parseFloat(swapOutputAmount), '250')
      .then(res => {
        console.log('res', res);
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const [chartOption, setChartOption] = React.useState({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['5m'],
  });

  const handleChartPeriodChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const interval: any = event.currentTarget.value;
    loadChartData({
      interval: interval.toLowerCase(),
      symbol: `${inputCurrency.symbol.toLocaleUpperCase()}${outputCurrency.symbol}`,
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

  const loadChartData = React.useCallback(({ interval, symbol }: { interval: string; symbol: string }) => {
    setLoading(true);
    try {
      axios
        .get(`http://35.240.219.80:8069/api/v1/chart/lines?symbol=${symbol}&interval=${interval}&limit=500&order=desc`)
        .then(res => {
          const { data: d } = res;
          let t = d.map(item => ({
            time: item.time,
            value: convertLoopToIcx(new BigNumber(item.price)).toNumber(),
          }));

          if (!t.length) {
            alert('No chart data, switch to others trading pairs');
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
  }, []);

  const handleInputSelect = React.useCallback(
    ccy => {
      setInputCurrency(ccy);
      loadChartData({
        interval: chartOption.period.toLowerCase(),
        symbol: `${ccy.symbol.toLocaleUpperCase()}${outputCurrency.symbol}`,
      });
    },
    [chartOption.period, outputCurrency.symbol, loadChartData],
  );

  const handleOutputSelect = React.useCallback(
    ccy => {
      setOutputCurrency(ccy);
      loadChartData({
        interval: chartOption.period.toLowerCase(),
        symbol: `${inputCurrency.symbol.toLocaleUpperCase()}${ccy.symbol}`,
      });
    },
    [chartOption.period, inputCurrency.symbol, loadChartData],
  );

  React.useEffect(() => {
    loadChartData({
      symbol: `${defaultInputCurrency.symbol.toLocaleUpperCase()}${defaultOutputCurrency.symbol}`,
      interval: '5m',
    });
  }, [defaultInputCurrency.symbol, defaultOutputCurrency.symbol, loadChartData]);

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={7} flexDirection="column" alignItems="stretch" flex={1}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">Swap</Typography>
            <Typography>Wallet: {walletBalance.sICXbalance?.toFixed(2)} sICX</Typography>
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
            <Typography>Wallet: {walletBalance.bnUSDbalance?.toFixed(2)} bnUSD</Typography>
          </Flex>

          <Flex mt={3} mb={5}>
            <CurrencyInputPanel
              value={swapOutputAmount}
              showMaxButton={false}
              currency={outputCurrency}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              id="swap-currency-output"
              otherCurrency={inputCurrency.symbol}
            />
          </Flex>

          <Divider mb={3} />

          <Flex alignItems="center" justifyContent="space-between" mb={1}>
            <Typography>Minimum to receive</Typography>
            <Typography>0 BALN</Typography>
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

          {chartOption.type === CHART_TYPES.AREA && (
            <ChartContainer ref={ref}>
              {loading ? (
                <Spinner centered />
              ) : (
                <TradingViewChart data={data} candleData={dayData} width={width} type={CHART_TYPES.AREA} />
              )}
            </ChartContainer>
          )}
          {/* 
          {chartOption.type === CHART_TYPES.CANDLE && (
            <Box ref={ref}>
              <TradingViewChart data={volumeData} candleData={candleData} width={width} type={CHART_TYPES.CANDLE} />
            </Box>
          )} */}
        </Box>
      </SectionPanel>
      <Modal isOpen={showSwapConfirm} onDismiss={handleSwapConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Swap sICX for bnUSD?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {sICXbnUSDratio.toFixed(2)} sICX per bnUSD
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Pay</Typography>
              <Typography variant="p" textAlign="center">
                {swapInputAmount} sICX
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
              <Typography variant="p" textAlign="center">
                {swapOutputAmount} bnUSD
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">Includes a fee of 0.22 BALN.</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleSwapConfirmDismiss}>Cancel</TextButton>
            <Button onClick={handleSwapConfirm}>Swap</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
