import React from 'react';

import Nouislider from 'nouislider-react';
import { Helmet } from 'react-helmet-async';
import { Flex, Box } from 'rebass/styled-components';
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
import { Typography } from 'app/theme';
import { dayData, candleData, volumeData, CURRENCYLIST } from 'demo';

const StyledDL = styled.dl`
  margin: 15px 0 25px 0;
  text-align: center;

  > dd {
    margin-left: 0;
  }
`;

const Panel = styled(Flex)`
  overflow: hidden;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
`;

const SectionPanel = styled(Panel)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`;

const BrightPanel = styled(Panel)`
  max-width: 360px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: initial;
  `}
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

  const handleInputSelect = ccy => {
    setInputCurrency(ccy);
  };

  const handleOutputSelect = ccy => {
    setOutputCurrency(ccy);
  };

  const [inputCurrency, setInputCurrency] = React.useState(CURRENCYLIST['icx']);

  const [outputCurrency, setOutputCurrency] = React.useState(CURRENCYLIST['baln']);

  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
  };

  const handleSwap = () => {
    setShowSwapConfirm(true);
  };

  const [showSupplyConfirm, setShowSupplyConfirm] = React.useState(false);

  const handleSupplyConfirmDismiss = () => {
    setShowSupplyConfirm(false);
  };

  const handleSupply = () => {
    setShowSupplyConfirm(true);
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
            <SectionPanel bg="bg2">
              <BrightPanel bg="bg3" p={35} flexDirection="column" alignItems="stretch" flex={1}>
                <Flex alignItems="center" justifyContent="space-between">
                  <Typography variant="h2">Swap</Typography>
                  <Typography>Wallet: 72,273ICX</Typography>
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
                  <Typography variant="h2">For</Typography>
                  <Typography>Wallet: 0 BALN</Typography>
                </Flex>

                <Flex mt={15} mb={25}>
                  <CurrencyInputPanel
                    value={swapOutputAmount}
                    showMaxButton={false}
                    currency={outputCurrency}
                    onUserInput={handleTypeOutput}
                    onCurrencySelect={handleOutputSelect}
                    id="swap-currency-output"
                  />
                </Flex>

                <Divider style={{ marginBottom: 16 }} />

                <Flex alignItems="center" justifyContent="space-between">
                  <Typography>Minimum to receive</Typography>
                  <Typography>0 BALN</Typography>
                </Flex>

                <Flex alignItems="center" justifyContent="space-between">
                  <Typography as="span">
                    Slippage tolerance
                    <QuestionHelper text="If the price slips by more than this amount, your swap will fail." />
                  </Typography>
                  <Typography>2.5%</Typography>
                </Flex>

                <Flex justifyContent="center">
                  <Button color="primary" marginTop={25} onClick={handleSwap}>
                    Swap
                  </Button>
                </Flex>
              </BrightPanel>

              <Box bg="bg2" flex={1} padding={35}>
                <Flex mb={25} flexWrap="wrap">
                  <Box width={[1, 1 / 2]}>
                    <Typography variant="h3" mb={10}>
                      ICX / BALN
                    </Typography>
                    <Typography variant="p">
                      0.7215 ICX per BALN <span className="text-red">-1.21%</span>
                    </Typography>
                  </Box>
                  <Box width={[1, 1 / 2]} marginTop={['15px', 0]}>
                    <ChartControlGroup mb={10}>
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
                  <Box ref={ref}>
                    <TradingViewChart data={dayData} candleData={dayData} width={width} type={CHART_TYPES.AREA} />
                  </Box>
                )}

                {chartOption.type === CHART_TYPES.CANDLE && (
                  <Box ref={ref}>
                    <TradingViewChart
                      data={volumeData}
                      candleData={candleData}
                      width={width}
                      type={CHART_TYPES.CANDLE}
                    />
                  </Box>
                )}
              </Box>
            </SectionPanel>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <SectionPanel bg="bg2">
              <BrightPanel bg="bg3" p={35} flexDirection="column" alignItems="stretch" flex={1}>
                <Flex alignItems="flex-end">
                  <Typography variant="h2">Supply:</Typography>
                  <Typography fontSize={18}>ICX / ICD</Typography>
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

                <Typography mt={15} textAlign="right">
                  Wallet: 12,000 ICX / 1,485 ICD
                </Typography>

                <Box mt={25}>
                  <Nouislider
                    id="slider-supply"
                    start={[0]}
                    padding={[0]}
                    connect={[true, false]}
                    range={{
                      min: [0],
                      max: [100],
                    }}
                  />
                </Box>

                <Flex justifyContent="center">
                  <Button color="primary" marginTop={25} onClick={handleSupply}>
                    Supply
                  </Button>
                </Flex>
              </BrightPanel>

              <Box bg="bg2" flex={1} padding={35}>
                <Typography variant="h3" mb={10}>
                  ICX / ICD liquidity pool
                </Typography>
                <Typography mb={25} lineHeight="25px">
                  Earn Balance Tokens every day you supply liquidity. Your assets will be locked for the first 24 hours,
                  and your supply ratio will fluctuate with the price.
                </Typography>

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
            </SectionPanel>
          </TabPanel>
        </Flex>

        <BoxPanel bg="bg2" mb={50}>
          <Typography variant="h2" mb={25}>
            Liquidity details
          </Typography>

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

      <Modal isOpen={showSwapConfirm} onDismiss={handleSwapConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={25} width="100%">
          <Typography textAlign="center" mb="5px" as="h3">
            Swap ICX for BALN?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            0.7215 ICX per BALN
          </Typography>

          <Flex my={25}>
            <Box width={1 / 2} className="border-right" style={{ textAlign: 'center' }}>
              <Typography>Pay</Typography>
              <Typography variant="p">100.00 ICX</Typography>
            </Box>

            <Box width={1 / 2} style={{ textAlign: 'center' }}>
              <Typography>Receive</Typography>
              <Typography variant="p">71.93 BALN</Typography>
            </Box>
          </Flex>

          <Typography textAlign="center" as="p">
            Includes a fee of 0.22 BALN.
          </Typography>

          <Flex justifyContent="center" mt={20} pt={20} className="border-top">
            <TextButton onClick={handleSwapConfirmDismiss}>Cancel</TextButton>
            <Button>Swap</Button>
          </Flex>
        </Flex>
      </Modal>

      <Modal isOpen={showSupplyConfirm} onDismiss={handleSupplyConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={25} width="100%">
          <Typography textAlign="center" mb="5px" as="h3">
            Supply liquidity?
          </Typography>

          <Typography variant="p" textAlign="center" mb={20}>
            Send each asset to the pool, <br />
            then click Supply
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" mb={20}>
            0 ICX
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" mb={20}>
            0 ICD
          </Typography>

          <Typography textAlign="center" as="p">
            Your ICX will be staked, and your
            <br />
            assets will be locked for 24 hours.
          </Typography>

          <Flex justifyContent="center" mt={20} pt={20} className="border-top">
            <TextButton onClick={handleSupplyConfirmDismiss}>Cancel</TextButton>
            <Button>Supply</Button>
          </Flex>
        </Flex>
      </Modal>
    </DefaultLayout>
  );
}
