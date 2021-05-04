import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import { useSwapPanelContext } from 'app/components/trade/SwapPanelProvider';
import { BrightPanel } from 'app/components/trade/utils';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SUPPORTED_PAIRS } from 'constants/currency';
import { ZERO } from 'constants/index';
import { useWalletModalToggle } from 'store/application/hooks';
import { usePools } from 'store/pool/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

interface ISwapControlProps {
  loadChartData: (data: any) => void;
  tokenRatio: (symbolInput: string, symbolOutput: string) => BigNumber;
}

export default function SwapControls({ loadChartData, tokenRatio }: ISwapControlProps) {
  const { account } = useIconReact();

  const toggleWalletModal = useWalletModalToggle();

  const balances = useWalletBalances();
  const pools = usePools();

  const [ttl, setTtl] = React.useState(0);

  const {
    swapInputAmount,
    setSwapInputAmount,
    swapOutputAmount,
    setSwapOutputAmount,
    inputCurrency,
    setInputCurrency,
    outputCurrency,
    setOutputCurrency,
    setShowSwapConfirm,
    setSwapFee,
    rawSlippage,
    setRawSlippage,
    chartOption,
  } = useSwapPanelContext();

  const getPoolData = React.useCallback(
    (symbolInput: string, symbolOutput: string) => {
      symbolInput = symbolInput.toLocaleLowerCase();
      symbolOutput = symbolOutput.toLocaleLowerCase();

      return {
        sicx: {
          icx: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXICX].base,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXICX].quote,
          },
          bnusd: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].base,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].quote,
          },
        },
        icx: {
          sicx: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXICX].quote,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXICX].base,
          },
        },
        bnusd: {
          sicx: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].quote,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.sICXbnUSD].base,
          },
          baln: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].quote,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].base,
          },
        },
        baln: {
          bnusd: {
            poolTotalInput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].base,
            poolTotalOutput: pools[BalancedJs.utils.POOL_IDS.BALNbnUSD].quote,
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

  const calculate_sICX_2_ICX_output_amount = React.useCallback(
    ({ inputAmount, ratio }) => {
      const fee = parseFloat(inputAmount) / 100;
      setSwapFee(new BigNumber(fee).toString());
      inputAmount = (parseFloat(inputAmount) - fee).toString();
      return formatBigNumber(new BigNumber(inputAmount).multipliedBy(ratio), 'input');
    },
    [setSwapFee],
  );

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
    [account, calculateOutputAmount, setSwapFee],
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

      setSwapOutputAmount(outputAmount);
    },
    [tokenRatio, calculate_sICX_2_ICX_output_amount, calculate_default_output_amount, setSwapOutputAmount],
  );

  const handleTypeInput = React.useCallback(
    (val: string) => {
      const poolTotalBase = getPoolData(inputCurrency.symbol, outputCurrency.symbol)?.poolTotalInput || ZERO;

      if (new BigNumber(val).isGreaterThanOrEqualTo(poolTotalBase)) {
        val = formatBigNumber(poolTotalBase, 'input');
      }

      setSwapInputAmount(val);

      handleConvertOutputRate(inputCurrency, outputCurrency, val);
    },
    [inputCurrency, outputCurrency, handleConvertOutputRate, getPoolData, setSwapInputAmount],
  );

  const calculate_sICX_2_ICX_intput_amount = outputTypedValue => {
    const inputAmount = new BigNumber(outputTypedValue).plus(new BigNumber(outputTypedValue).multipliedBy(0.01));
    return formatBigNumber(inputAmount, 'ratio');
  };

  const calculate_ICX_2_sICX_intput_amount = outputTypedValue => {
    return formatBigNumber(new BigNumber(outputTypedValue), 'ratio');
  };

  const calculate_default_intput_amount = async inputAmount => {
    if (!account) return '0';

    const res = await bnJs.inject({ account }).Dex.getFees();
    const bal_holder_fee = parseInt(res[`pool_baln_fee`], 16);
    const lp_fee = parseInt(res[`pool_lp_fee`], 16);
    const fee = inputAmount.multipliedBy(new BigNumber(bal_holder_fee + lp_fee)).dividedBy(new BigNumber(10000));
    setSwapFee(new BigNumber(fee).toString());
    inputAmount = inputAmount.plus(fee);

    return formatBigNumber(inputAmount, 'ratio');
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

    const maxOutputAmount = calculateOutputAmount(
      inputCurrencySymbol,
      outputCurrencySymbol,
      poolTotalBase.toString(),
      '',
    );

    if (new BigNumber(outputTypedValue).isGreaterThanOrEqualTo(maxOutputAmount)) {
      setSwapOutputAmount(formatBigNumber(maxOutputAmount, 'input'));
      inputAmount = calculateOutputAmount(inputCurrencySymbol, outputCurrencySymbol, '', maxOutputAmount.toString());
    } else {
      setSwapOutputAmount(outputTypedValue);
      inputAmount = calculateOutputAmount(inputCurrencySymbol, outputCurrencySymbol, '', outputTypedValue);
    }

    outputTypedValue = outputTypedValue || '0';

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

    setSwapInputAmount(amount);
  };

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
    [swapInputAmount, outputCurrency, chartOption, handleConvertOutputRate, loadChartData, setInputCurrency],
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
    [swapInputAmount, handleConvertOutputRate, inputCurrency, chartOption, loadChartData, setOutputCurrency],
  );

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

  return (
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
  );
}
