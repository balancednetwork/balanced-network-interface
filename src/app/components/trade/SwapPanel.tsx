import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import ShouldLedgerConfirmMessage from 'app/components/DepositStakeMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import SwapControls from 'app/components/SwapControls';
import { SwapPanelProvider, useSwapPanelContext } from 'app/components/trade/SwapPanelProvider';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useRatio, useChangeRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { formatBigNumber } from 'utils';

import { SectionPanel, swapMessage } from './utils';

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
  const ratio = useRatio();
  const shouldLedgerSign = useShouldLedgerSign();

  const addTransaction = useTransactionAdder();
  const changeRatioValue = useChangeRatio();

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

  const {
    swapInputAmount,
    setSwapInputAmount,
    swapOutputAmount,
    setSwapOutputAmount,
    inputCurrency,
    outputCurrency,
    showSwapConfirm,
    setShowSwapConfirm,
    swapFee,
    rawSlippage,
    chartOption,
    setChartOption,
  } = useSwapPanelContext();

  const tokenRatio = React.useCallback(
    (symbolInput: string, symbolOutput: string) => {
      const hasSICXICXRatio = !isEmpty(ratio.sICXICXratio?.toNumber());
      const hasSICXbnUSDRatio = !isEmpty(ratio.sICXbnUSDratio?.toNumber());
      const hasBALNbnUSDRatio = !isEmpty(ratio.BALNbnUSDratio?.toNumber());

      switch (true) {
        case symbolInput === 'ICX' && hasSICXICXRatio:
          return new BigNumber(1).dividedBy(ratio.sICXICXratio);

        case symbolInput === 'BALN':
          return ratio.BALNbnUSDratio;

        case symbolInput === 'sICX' && symbolOutput === 'bnUSD':
          return ratio.sICXbnUSDratio;

        case symbolInput === 'sICX' && symbolOutput === 'ICX':
          return ratio.sICXICXratio;

        case symbolInput === 'bnUSD' && symbolOutput === 'sICX' && hasSICXbnUSDRatio:
          return new BigNumber(1).dividedBy(ratio.sICXbnUSDratio);

        case symbolInput === 'bnUSD' && symbolOutput === 'BALN' && hasBALNbnUSDRatio:
          return new BigNumber(1).dividedBy(ratio.BALNbnUSDratio);

        default:
          return new BigNumber(0);
      }
    },
    [ratio.BALNbnUSDratio, ratio.sICXICXratio, ratio.sICXbnUSDratio],
  );

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

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
    changeShouldLedgerSign(false);
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

  return (
    <SwapPanelProvider>
      <SectionPanel bg="bg2">
        <SwapControls loadChartData={loadChartData} tokenRatio={tokenRatio} />
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
    </SwapPanelProvider>
  );
}
