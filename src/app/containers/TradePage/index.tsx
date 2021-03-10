import React from 'react';

import BigNumber from 'bignumber.js';
import { IconBuilder, IconConverter, IconAmount } from 'icon-sdk-js';
import Nouislider from 'nouislider-react';
import {
  useIconReact,
  sICX_ADDRESS,
  DEX_ADDRESS,
  bnUSD_ADDRESS,
  iconService,
  BALN_ADDRESS,
  sICXbnUSDpoolId,
} from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Helmet } from 'react-helmet-async';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { DefaultLayout } from 'app/components/Layout';
import Modal from 'app/components/Modal';
import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import { Tab, Tabs, TabPanel } from 'app/components/Tab';
import LiquidityDetails from 'app/components/trade/LiquidityDetails';
import ReturnICDSection from 'app/components/trade/ReturnICDSection';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import { dayData, candleData, volumeData, CURRENCYLIST } from 'demo';
import { useChangeLiquiditySupply } from 'store/liquidity/hooks';
import { useRatioValue, useChangeRatio } from 'store/ratio/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

const StyledDL = styled.dl`
  margin: 15px 0 5px 0;
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

const SupplyButton = styled(Button)`
  padding: 5px 10px;
  font-size: 12px;
`;

export function TradePage() {
  const { account } = useIconReact();
  const walletBalance = useWalletBalanceValue();
  const ratio = useRatioValue();
  const changeRatio = useChangeRatio();
  const changeLiquiditySupply = useChangeLiquiditySupply();
  const sICXbnUSDratio = (ratio.sICXICXratio?.toNumber() || 0) * (ratio.ICXUSDratio?.toNumber() || 0);
  const BALNbnUSDratio = ratio.BALNbnUSDratio?.toNumber() || 0;

  const [value, setValue] = React.useState<number>(0);

  const handleTabClick = (event: React.MouseEvent, value: number) => {
    setValue(value);
  };

  const [supplyInputAmount, setSupplyInputAmount] = React.useState('0');

  const handleSupplyTypeInput = (val: string) => {
    setSupplyInputAmount(val);
    setSupplyOutputAmount((parseFloat(val) * BALNbnUSDratio).toFixed(2).toString());
  };

  const [supplyOutputAmount, setSupplyOutputAmount] = React.useState('0');

  const handleSupplyTypeOutput = (val: string) => {
    setSupplyOutputAmount(val);
    setSupplyInputAmount((parseFloat(val) / BALNbnUSDratio).toFixed(2).toString());
  };

  const [swapInputAmount, setSwapInputAmount] = React.useState('0');

  const [swapOutputAmount, setSwapOutputAmount] = React.useState('0');

  const handleTypeInput = (val: string) => {
    setSwapInputAmount(val);
    setSwapOutputAmount((parseFloat(val) * BALNbnUSDratio).toFixed(2).toString());
  };

  const handleTypeOutput = (val: string) => {
    setSwapOutputAmount(val);
    setSwapInputAmount((parseFloat(val) / BALNbnUSDratio).toFixed(2).toString());
  };

  const handleInputSelect = ccy => {
    setInputCurrency(ccy);
  };

  const handleOutputSelect = ccy => {
    setOutputCurrency(ccy);
  };

  const [inputCurrency, setInputCurrency] = React.useState(CURRENCYLIST['baln']);

  const [outputCurrency, setOutputCurrency] = React.useState(CURRENCYLIST['bnusd']);

  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
  };

  // const handleSwap = () => {
  //   setShowSwapConfirm(true);
  // };

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

  const handleSupplyConfirm = () => {
    if (!account) return;
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();

    //const data = "0x" + Buffer.from("{\"method\": \"_swap\", \"params\": {\"toToken\":\"" + bnUSD_ADDRESS + "\", \"maxSlippage\":" + rawSlippage.toString() + "}}", 'utf8').toString("hex");
    //const value = "0x" + IconAmount.of(swapInputAmount, IconAmount.Unit.ICX).toLoop().toString(16);
    const hexSupplyInputAmount = '0x' + IconAmount.of(supplyInputAmount, IconAmount.Unit.ICX).toLoop().toString(16);
    const hexSupplyOutputAmount = '0x' + IconAmount.of(supplyOutputAmount, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = {
      _baseToken: BALN_ADDRESS,
      _quoteToken: bnUSD_ADDRESS,
      _baseValue: hexSupplyInputAmount,
      _quoteValue: hexSupplyOutputAmount,
    };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(DEX_ADDRESS)
      .method('add')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(30000000))
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
  };

  const handleSupplyInputDepositConfirm = () => {
    if (!account) return;
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();

    const data = '0x' + Buffer.from('{"method": "_deposit"}', 'utf8').toString('hex');
    const value = '0x' + IconAmount.of(supplyInputAmount, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: DEX_ADDRESS, _value: value, _data: data };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(BALN_ADDRESS)
      .method('transfer')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(30000000))
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
  };

  const handleSupplyOutputDepositConfirm = () => {
    if (!account) return;
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();

    const data = '0x' + Buffer.from('{"method": "_deposit"}', 'utf8').toString('hex');
    const value = '0x' + IconAmount.of(supplyOutputAmount, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: DEX_ADDRESS, _value: value, _data: data };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(bnUSD_ADDRESS)
      .method('transfer')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(30000000))
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
  };

  const handleSwapConfirm = () => {
    //swap sICX to bnUSD
    if (!account) return;
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();

    const data =
      '0x' +
      Buffer.from(
        '{"method": "_swap", "params": {"toToken":"' +
          BALN_ADDRESS +
          '", "maxSlippage":' +
          rawSlippage.toString() +
          '}}',
        'utf8',
      ).toString('hex');
    //const data = '0x' + Buffer.from('{"method": "_swap", "params": {"toToken":"' + bnUSD_ADDRESS + '"}}', 'utf8').toString('hex');
    const value = '0x' + IconAmount.of(swapInputAmount, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: DEX_ADDRESS, _value: value, _data: data };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(bnUSD_ADDRESS)
      .method('transfer')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(30000000))
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

    /*** sICX to ICX case 
    if (!account) return;
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();

    const data = '0x' + Buffer.from('{"method": "_swap_icx"}', 'utf8').toString('hex');
    const value = '0x' + IconAmount.of(swapInputAmount, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: DEX_ADDRESS, _value: value, _data: data };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(sICX_ADDRESS)
      .method('transfer')
      .params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(30000000))
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
    );***/
  };

  // get sICX:ICX ratio
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('getPrice')
        .params({ _pid: sICXbnUSDpoolId.toString() })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const sICXbnUSDratio = convertLoopToIcx(result);
          changeRatio({ sICXbnUSDratio: sICXbnUSDratio });
        });
    }
  }, [changeRatio, account]);

  /** get liquidity sICX:bnUSD supply
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('balanceOf')
        .params({ _owner: account, _id: sICXbnUSDpoolId })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const sICXbnUSDsupply = convertLoopToIcx(result);

          changeLiquiditySupply({ sICXbnUSDsupply: sICXbnUSDsupply });
        });
    }
  }, [changeLiquiditySupply, account]);

  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('getDeposit')
        .params({ _user: account, _tokenAddress: bnUSD_ADDRESS })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const bnUSDsupply = convertLoopToIcx(result);

          changeLiquiditySupply({ bnUSDsupply: bnUSDsupply });
        });
    }
  }, [changeLiquiditySupply, account]);
  **/

  // get liquidity BALN supply
  React.useEffect(() => {
    if (account) {
      const callParams = new IconBuilder.CallBuilder()
        .from(account)
        .to(DEX_ADDRESS)
        .method('balanceOf')
        .params({ _owner: account, _id: BALN_ADDRESS })
        .build();

      iconService
        .call(callParams)
        .execute()
        .then((result: BigNumber) => {
          const sICXbnUSDsupply = convertLoopToIcx(result);

          changeLiquiditySupply({ sICXbnUSDsupply: sICXbnUSDsupply });
        });
    }
  }, [changeLiquiditySupply, account]);

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

  //
  const [rawSlippage, setRawSlippage] = React.useState(250);
  const [ttl, setTtl] = React.useState(0);

  return (
    <DefaultLayout title="Trade">
      <Helmet>
        <title>Trade</title>
      </Helmet>

      <Box flex={1}>
        <Flex mb={10} flexDirection="column">
          <Flex alignItems="center" justifyContent="space-between">
            <Tabs value={value} onChange={handleTabClick}>
              <Tab>Swap</Tab>
              <Tab>Supply liquidity</Tab>
            </Tabs>

            <ReturnICDSection />
          </Flex>

          <TabPanel value={value} index={0}>
            <SectionPanel bg="bg2">
              <BrightPanel bg="bg3" p={7} flexDirection="column" alignItems="stretch" flex={1}>
                <Flex alignItems="center" justifyContent="space-between">
                  <Typography variant="h2">Swap</Typography>
                  <Typography>{'Wallet: ' + walletBalance.BALNbalance?.toFixed(2).toString() + ' BALN'}</Typography>
                </Flex>

                <Flex mt={3} mb={5}>
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
                  <Typography>{'Wallet: ' + walletBalance.bnUSDbalance?.toFixed(2).toString() + ' bnUSD'}</Typography>
                </Flex>

                <Flex mt={3} mb={5}>
                  <CurrencyInputPanel
                    value={swapOutputAmount}
                    showMaxButton={false}
                    currency={outputCurrency}
                    onUserInput={handleTypeOutput}
                    onCurrencySelect={handleOutputSelect}
                    id="swap-currency-output"
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
                  <Button color="primary" marginTop={5} onClick={handleSwapConfirm}>
                    Swap
                  </Button>
                </Flex>
              </BrightPanel>

              <Box bg="bg2" flex={1} padding={7}>
                <Flex mb={5} flexWrap="wrap">
                  <Box width={[1, 1 / 2]}>
                    <Typography variant="h3" mb={2}>
                      ICX / BALN
                    </Typography>
                    <Typography variant="p">
                      0.7215 ICX per BALN <span className="text-red">-1.21%</span>
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
              <BrightPanel bg="bg3" p={7} flexDirection="column" alignItems="stretch" flex={1}>
                <Flex alignItems="flex-end">
                  <Typography variant="h2">Supply:</Typography>
                  <Typography fontSize={18}>BALN / bnUSD</Typography>
                </Flex>

                <Flex mt={3}>
                  <CurrencyInputPanel
                    value={supplyInputAmount}
                    showMaxButton={false}
                    currency={CURRENCYLIST['baln']}
                    onUserInput={handleSupplyTypeInput}
                    disableCurrencySelect={true}
                    id="supply-liquidity-input-tokena"
                  />
                </Flex>

                <Flex mt={3}>
                  <CurrencyInputPanel
                    value={supplyOutputAmount}
                    showMaxButton={false}
                    currency={CURRENCYLIST['bnusd']}
                    onUserInput={handleSupplyTypeOutput}
                    disableCurrencySelect={true}
                    id="supply-liquidity-input-tokenb"
                  />
                </Flex>

                <Typography mt={3} textAlign="right">
                  {'Wallet: ' +
                    walletBalance.BALNbalance?.toFixed(2).toString() +
                    ' BALN / ' +
                    walletBalance.bnUSDbalance?.toFixed(2).toString() +
                    ' bnUSD'}
                </Typography>

                <Box mt={5}>
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
                  <Button color="primary" marginTop={5} onClick={handleSupply}>
                    Supply
                  </Button>
                </Flex>
              </BrightPanel>

              <Box bg="bg2" flex={1} padding={7}>
                <Typography variant="h3" mb={2}>
                  ICX / bnUSD liquidity pool
                </Typography>
                <Typography mb={5} lineHeight={'25px'}>
                  Earn Balance Tokens every day you supply liquidity. Your assets will be locked for the first 24 hours,
                  and your supply ratio will fluctuate with the price.
                </Typography>

                <Flex>
                  <Box width={1 / 2} className="border-right">
                    <StyledDL>
                      <dt>Your supply</dt>
                      <dd>9,000 ICX / 2,160 bnUSD</dd>
                    </StyledDL>
                    <StyledDL>
                      <dt>Your daily rewards</dt>
                      <dd>~120 BALN</dd>
                    </StyledDL>
                  </Box>
                  <Box width={1 / 2}>
                    <StyledDL>
                      <dt>Total supply</dt>
                      <dd>500,000 ICX / 400,000 bnUSD</dd>
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

        <LiquidityDetails />
      </Box>

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

      <Modal isOpen={showSupplyConfirm} onDismiss={handleSupplyConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Supply liquidity?
          </Typography>

          <Typography variant="p" textAlign="center" mb={4}>
            Send each asset to the pool, <br />
            then click Supply
          </Typography>

          <Flex alignItems="center" mb={4}>
            <Box width={1 / 2}>
              <Typography variant="p" fontWeight="bold" textAlign="right">
                {supplyInputAmount + ' BALN'}
              </Typography>
            </Box>
            <Box width={1 / 2}>
              <SupplyButton ml={3} onClick={handleSupplyInputDepositConfirm}>
                Send
              </SupplyButton>
            </Box>
          </Flex>
          <Flex alignItems="center" mb={4}>
            <Box width={1 / 2}>
              <Typography variant="p" fontWeight="bold" textAlign="right">
                {supplyOutputAmount + ' bnUSD'}
              </Typography>
            </Box>
            <Box width={1 / 2}>
              {' '}
              <SupplyButton ml={3} onClick={handleSupplyOutputDepositConfirm}>
                Send
              </SupplyButton>
            </Box>
          </Flex>

          <Typography textAlign="center">
            Your ICX will be staked, and your
            <br />
            assets will be locked for 24 hours.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleSupplyConfirmDismiss}>Cancel</TextButton>
            <Button onClick={handleSupplyConfirm}>Supply</Button>
          </Flex>
        </Flex>
      </Modal>
    </DefaultLayout>
  );
}
