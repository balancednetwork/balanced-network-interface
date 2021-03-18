import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
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
import { CURRENCYLIST, SupportedBaseCurrencies } from 'constants/currency';
import { TRILLION } from 'constants/index';
import { dayData, candleData, volumeData } from 'demo';

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
  const [swapInputAmount, setSwapInputAmount] = React.useState('0');

  const handleTypeInput = (val: string) => {
    setSwapInputAmount(val);
  };

  const [swapOutputAmount, setSwapOutputAmount] = React.useState('0');

  const handleTypeOutput = (val: string) => {
    setSwapOutputAmount(val);
  };

  const handleInputSelect = React.useCallback(ccy => {
    setInputCurrency(ccy);
  }, []);

  const handleOutputSelect = React.useCallback(ccy => {
    setOutputCurrency(ccy);
  }, []);

  const [inputCurrency, setInputCurrency] = React.useState(CURRENCYLIST['icx']);

  const [outputCurrency, setOutputCurrency] = React.useState(CURRENCYLIST['baln']);

  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
  };

  const handleSwap = () => {
    setShowSwapConfirm(true);
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
      axios.get('http://35.240.219.80:8069/api/v1/chart/lines?symbol=BALNICD&limit=5&order=desc').then(res => {
        const { data: d } = res;
        let t = d.map(item => ({ time: item.time, value: new BigNumber(item.price).dividedBy(TRILLION).toNumber() }));
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
            <Typography>Wallet: 72,273ICX</Typography>
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
            <Typography>Wallet: 0 BALN</Typography>
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
                0.7215 {inputCurrency.symbol} per {outputCurrency.symbol} <span className="alert">-1.21%</span>
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
            Swap ICX for BALN?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            0.7215 ICX per BALN
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Pay</Typography>
              <Typography variant="p" textAlign="center">
                100.00 ICX
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
              <Typography variant="p" textAlign="center">
                71.93 BALN
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">Includes a fee of 0.22 BALN.</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleSwapConfirmDismiss}>Cancel</TextButton>
            <Button>Swap</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
