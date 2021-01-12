import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Text, Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { Divider } from 'app/components/Divider';
import { DefaultLayout } from 'app/components/Layout';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS } from 'app/components/TradingViewChart';
import { Currency } from 'types';

import { dayData, candleData, volumeData } from '../../../demo';

const StyledDL = styled.dl`
  margin: 15px 0 25px 0;
  text-align: center;

  > dd {
    margin-left: 0;
  }
`;

const SwapPanel = styled(Flex)`
  overflow: hidden;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
`;

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

  & button {
    margin-right: 5px;
  }

  & button:last-child {
    margin-right: 0;
  }
`;

const CURRENCYLIST = {
  icx: { symbol: 'ICX', decimals: 10, name: 'ICON' },
  baln: { symbol: 'BALN', decimals: 10, name: 'Blanced Token' },
  icd: { symbol: 'ICD', decimals: 10, name: 'ICON Dollars' },
};

export function TradePage() {
  const [value, setValue] = React.useState<number>(0);

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
  };

  const [swapInputAmount, setSwapInputAmount] = React.useState('0');

  const handleTypeInput = (val: string) => {
    setSwapInputAmount(val);
  };

  const [swapOutputAmount, setSwapOutputAmount] = React.useState('0');

  const handleTypeOutput = (val: string) => {
    setSwapOutputAmount(val);
  };

  const handleInputSelect = () => {};

  const inputCurrency: Currency = CURRENCYLIST['icx'];

  const outputCurrency: Currency = CURRENCYLIST['baln'];

  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleConfirmDismiss = () => {
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

  return (
    <DefaultLayout title="Trade">
      <Helmet>
        <title>Trade</title>
      </Helmet>

      <Box flex={1}>
        <Flex mb={50} flexDirection="column">
          <Flex>
            <Tabs value={value} onChange={handleTabClick}>
              <Tab>Swap</Tab>
              <Tab>Supply liquidity</Tab>
            </Tabs>
          </Flex>

          <TabPanel value={value} index={0}>
            <SwapPanel bg="bg2">
              <SwapPanel bg="bg3" p={35} flexDirection="column" alignItems="stretch" maxWidth={360} flex={1}>
                <Flex alignItems="center" justifyContent="space-between">
                  <Text as="h2" color="text" fontSize={25} fontWeight="bold">
                    Swap
                  </Text>
                  <Text color="text1" fontSize={14}>
                    Wallet: 72,273ICX
                  </Text>
                </Flex>

                <Flex mt={15} mb={25}>
                  <CurrencyInputPanel
                    value={swapInputAmount}
                    showMaxButton={false}
                    currency={inputCurrency}
                    onUserInput={handleTypeInput}
                    onCurrencySelect={handleInputSelect}
                    id="swap-currency-input"
                  />
                </Flex>

                <Flex alignItems="center" justifyContent="space-between">
                  <Text as="h2" color="text" fontSize={25} fontWeight="bold">
                    For
                  </Text>
                  <Text color="text1" fontSize={14}>
                    Wallet: 0 BALN
                  </Text>
                </Flex>

                <Flex mt={15} mb={25}>
                  <CurrencyInputPanel
                    value={swapOutputAmount}
                    showMaxButton={false}
                    currency={outputCurrency}
                    onUserInput={handleTypeOutput}
                    onCurrencySelect={handleInputSelect}
                    id="swap-currency-output"
                  />
                </Flex>

                <Divider style={{ marginBottom: 16 }} />

                <Flex alignItems="center" justifyContent="space-between">
                  <Text color="text1" fontSize={14}>
                    Minimum to receive
                  </Text>
                  <Text color="text1" fontSize={14}>
                    0 BALN
                  </Text>
                </Flex>

                <Flex alignItems="center" justifyContent="space-between">
                  <Text color="text1" fontSize={14} as="span">
                    Slippage tolerance
                    <QuestionHelper text="If the price slips by more than this amount, your swap will fail." />
                  </Text>
                  <Text color="text1" fontSize={14}>
                    2.5%
                  </Text>
                </Flex>

                <Flex justifyContent="center">
                  <Button color="primary" marginTop={25} onClick={handleSwap}>
                    Swap
                  </Button>
                </Flex>
              </SwapPanel>

              <Box bg="bg2" flex={1} padding={35}>
                <Flex mb={25}>
                  <Box width={1 / 2}>
                    <Text color="white" fontSize={20} mb={10} as="h3">
                      ICX / BALN
                    </Text>
                    <Text color="white" fontSize={16}>
                      0.7215 ICX per BALN <span className="text-red">-1.21%</span>
                    </Text>
                  </Box>
                  <Box width={1 / 2}>
                    <ChartControlGroup mb={10}>
                      {Object.keys(CHART_PERIODS).map(key => (
                        <ChartControlButton
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

                <Box hidden={chartOption.type !== CHART_TYPES.AREA}>
                  <TradingViewChart data={dayData} candleData={dayData} width={580} type={CHART_TYPES.AREA} />
                </Box>

                <Box hidden={chartOption.type !== CHART_TYPES.CANDLE}>
                  <TradingViewChart data={volumeData} candleData={candleData} width={580} type={CHART_TYPES.CANDLE} />
                </Box>
              </Box>
            </SwapPanel>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <SwapPanel bg="bg2">
              <SwapPanel bg="bg3" p={35} flexDirection="column" alignItems="stretch" maxWidth={360} flex={1}>
                <Flex alignItems="flex-end">
                  <Text as="h2" color="text" fontSize={25} fontWeight="bold">
                    Supply:
                  </Text>
                  <Text color="text" fontSize={18}>
                    ICX / ICD
                  </Text>
                </Flex>

                <Flex mt={15}>
                  <CurrencyInputPanel
                    value="0"
                    showMaxButton={false}
                    currency={CURRENCYLIST['icx']}
                    onUserInput={handleTypeInput}
                    disableCurrencySelect={true}
                    id="supply-liquidity-input-tokena"
                  />
                </Flex>

                <Flex mt={15}>
                  <CurrencyInputPanel
                    value="0"
                    showMaxButton={false}
                    currency={CURRENCYLIST['icd']}
                    onUserInput={handleTypeInput}
                    disableCurrencySelect={true}
                    id="supply-liquidity-input-tokenb"
                  />
                </Flex>

                <Text mt={15} color="text1" fontSize={14} textAlign="right">
                  Wallet: 12,000 ICX / 1,485 ICD
                </Text>

                <Text mt={15} textAlign="center">
                  Need to add slider
                </Text>

                <Flex justifyContent="center">
                  <Button color="primary" marginTop={25}>
                    Supply
                  </Button>
                </Flex>
              </SwapPanel>

              <Box bg="bg2" flex={1} padding={35}>
                <Text as="h2" color="text" fontSize={20} fontWeight="bold" mb={10}>
                  ICX / ICD liquidity pool
                </Text>
                <Text as="p" color="text1" fontSize={14} mb={25} lineHeight="25px">
                  Earn Balance Tokens every day you supply liquidity. Your assets will be locked for the first 24 hours,
                  and your supply ratio will fluctuate with the price.
                </Text>

                <Flex>
                  <Box width={1 / 2} className="border-right">
                    <StyledDL>
                      <dt>Your supply</dt>
                      <dd>9,000 ICX / 2,160 ICD</dd>
                    </StyledDL>
                    <StyledDL>
                      <dt>Your daily rewards</dt>
                      <dd>~120 BALN</dd>
                    </StyledDL>
                  </Box>
                  <Box width={1 / 2}>
                    <StyledDL>
                      <dt>Total supply</dt>
                      <dd>500,000 ICX / 400,000 ICD</dd>
                    </StyledDL>
                    <StyledDL>
                      <dt>Total daily rewards</dt>
                      <dd>~17,500 BALN</dd>
                    </StyledDL>
                  </Box>
                </Flex>
              </Box>
            </SwapPanel>
          </TabPanel>
        </Flex>

        <BoxPanel bg="bg2" mb={50}>
          <Text as="h2" color="text" fontSize={25} fontWeight="bold" mb={25}>
            Liquidity details
          </Text>

          {/* <!-- Liquidity list --> */}
          <table className="list liquidity">
            <thead>
              <tr>
                <th>Pool</th>
                <th>Your supply</th>
                <th>Pool share</th>
                <th>Daily rewards</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {/* <!-- sICX / ICX --> */}
              <tr>
                <td>sICX / ICX</td>
                <td>15,000 ICX</td>
                <td>3.1%</td>
                <td>~ 120 BALN</td>
                <td>
                  <span className="dropdown">Withdraw</span>
                </td>
              </tr>

              {/* <!-- ICX / ICD --> */}
              <tr>
                <td>ICX / ICD</td>
                <td>
                  15,000 ICX
                  <br />
                  15,000 ICD
                </td>
                <td>3.1%</td>
                <td>~ 120 BALN</td>
                <td>
                  <span className="dropdown">Withdraw</span>
                </td>
              </tr>

              {/* <!-- BALN / ICD --> */}
              <tr>
                <td>BALN / ICD</td>
                <td>
                  15,000 BALN
                  <br />
                  15,000 ICD
                </td>
                <td>3.1%</td>
                <td>~ 120 BALN</td>
                <td>
                  <span className="dropdown">Withdraw</span>
                </td>
              </tr>
            </tbody>
          </table>
        </BoxPanel>
      </Box>

      <Modal isOpen={showSwapConfirm} onDismiss={handleConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={25} width="100%">
          <Text fontSize={14} color="text1" textAlign="center" mb="5px" as="h3">
            Swap ICX for BALN?
          </Text>

          <Text fontSize={16} fontWeight="bold" textAlign="center" color="text" as="p">
            0.7215 ICX per BALN
          </Text>

          <Flex my={25}>
            <Box width={1 / 2} className="border-right" style={{ textAlign: 'center' }}>
              <Text fontSize={14} color="text1" as="p">
                Pay
              </Text>
              <Text fontSize={16} color="text" as="p">
                100.00 ICX
              </Text>
            </Box>

            <Box width={1 / 2} style={{ textAlign: 'center' }}>
              <Text fontSize={14} color="text1" as="p">
                Receive
              </Text>
              <Text fontSize={16} color="text" as="p">
                71.93 BALN
              </Text>
            </Box>
          </Flex>

          <Text fontSize={14} color="text1" textAlign="center" as="p">
            Includes a fee of 0.22 BALN.
          </Text>

          <Flex justifyContent="center" mt={20} pt={20} className="border-top">
            <TextButton>Cancel</TextButton>
            <Button>Swap</Button>
          </Flex>
        </Flex>
      </Modal>
    </DefaultLayout>
  );
}
