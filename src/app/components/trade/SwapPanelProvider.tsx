import React from 'react';

import { CHART_TYPES, CHART_PERIODS } from 'app/components/TradingViewChart';
import { CURRENCY_LIST } from 'constants/currency';

interface ISwapPanelContext {
  swapInputAmount: string;
  setSwapInputAmount: (amount: string) => void;

  swapOutputAmount: string;
  setSwapOutputAmount: (amount: string) => void;

  inputCurrency: any;
  setInputCurrency: (currency: any) => void;

  outputCurrency: any;
  setOutputCurrency: (currency: any) => void;

  showSwapConfirm: boolean;
  setShowSwapConfirm: (show: boolean) => void;

  swapFee: string;
  setSwapFee: (fee: string) => void;

  rawSlippage: number;
  setRawSlippage: (raw: number) => void;

  chartOption: any;
  setChartOption: (opt: any) => void;
}

const SwapPanelContext = React.createContext<ISwapPanelContext>({
  swapInputAmount: '0',
  setSwapInputAmount: () => {},
  swapOutputAmount: '0',
  setSwapOutputAmount: () => {},
  inputCurrency: CURRENCY_LIST['sicx'],
  setInputCurrency: () => {},
  outputCurrency: CURRENCY_LIST['bnusd'],
  setOutputCurrency: () => {},
  showSwapConfirm: false,
  setShowSwapConfirm: () => {},
  swapFee: '0',
  setSwapFee: () => {},
  rawSlippage: 250,
  setRawSlippage: () => {},
  chartOption: {
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['5m'],
  },
  setChartOption: () => {},
});

export function SwapPanelProvider({ children }) {
  const [swapInputAmount, setSwapInputAmount] = React.useState('0');
  const [swapOutputAmount, setSwapOutputAmount] = React.useState('0');
  const [inputCurrency, setInputCurrency] = React.useState(CURRENCY_LIST['sicx']);
  const [outputCurrency, setOutputCurrency] = React.useState(CURRENCY_LIST['bnusd']);
  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);
  const [swapFee, setSwapFee] = React.useState('0');
  const [rawSlippage, setRawSlippage] = React.useState(250);
  const [chartOption, setChartOption] = React.useState({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['5m'],
  });

  const context: ISwapPanelContext = {
    swapInputAmount,
    setSwapInputAmount,
    swapOutputAmount,
    setSwapOutputAmount,
    inputCurrency,
    setInputCurrency: (c: any) => {
      setInputCurrency(c);
    },
    outputCurrency,
    setOutputCurrency: (c: any) => {
      setOutputCurrency(c);
    },
    showSwapConfirm,
    setShowSwapConfirm,
    swapFee,
    setSwapFee,
    rawSlippage,
    setRawSlippage,
    chartOption,
    setChartOption,
  };

  return <SwapPanelContext.Provider value={context}>{children}</SwapPanelContext.Provider>;
}

export function useSwapPanelContext() {
  const context = React.useContext(SwapPanelContext);

  return context;
}
