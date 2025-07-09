import React, { useCallback, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, Percent } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { BrightPanel } from '@/app/components/Panel';
import { CurrencySelectionType } from '@/app/components/SearchModal/CurrencySearch';
import SolanaAccountExistenceWarning from '@/app/components/SolanaAccountExistenceWarning';
import StellarSponsorshipModal from '@/app/components/StellarSponsorshipModal';
import StellarTrustlineModal from '@/app/components/StellarTrustlineModal';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import useManualAddresses from '@/hooks/useManualAddresses';
import { useSignedInWallets } from '@/hooks/useWallets';
import { calculateExchangeRate, normaliseTokenAmount, scaleTokenAmount } from '@/lib/sodax/utils';
import { useRatesWithOracle } from '@/queries/reward';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { getXChainType, useXAccount, type XToken } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/sdk-core';
import { useCreateIntentOrder, useQuote, useSpokeProvider } from '@sodax/dapp-kit';
import { CreateIntentParams, Hex, Intent, IntentQuoteRequest, PacketData, SpokeChainId } from '@sodax/sdk';
import { BigNumber } from 'bignumber.js';
import MMPendingIntents from './MMPendingIntents';
import PriceImpact from './PriceImpact';
import SwapCommitButton from './SwapCommitButton';
import SwapInfo from './SwapInfo';
import { useWalletProvider } from '@/hooks/useWalletProvider';

export default function SwapPanel() {
  useInitialSwapLoad();

  const {
    trade,
    currencyBalances,
    currencies,
    inputError,
    percents,
    account,
    direction,
    formattedAmounts,
    maximumBridgeAmount,
    stellarValidation,
    stellarTrustlineValidation,
    parsedAmounts,
  } = useDerivedSwapInfo();

  // !! SODAX start
  const [slippage, setSlippage] = useState<string>('0.5');
  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const sourceToken = currencies[Field.INPUT];
  const destToken = currencies[Field.OUTPUT];
  const sourceChain = direction.from as SpokeChainId;
  const destChain = direction.to as SpokeChainId;
  const sourceAmount = formattedAmounts[Field.INPUT];

  const walletProvider = useWalletProvider(sourceChain);
  console.log('walletProvider debug kk', walletProvider);
  const spokeProvider = useSpokeProvider(sourceChain, walletProvider);
  console.log('spokeProvider debug kk', spokeProvider);

  // const { mutateAsync: createIntentOrder } = useCreateIntentOrder(spokeProvider);
  const [orders, setOrders] = useState<{ intentHash: Hex; intent: Intent; packet: PacketData }[]>([]);
  // !! SODAX end

  const signedInWallets = useSignedInWallets();
  const { recipient, independentField } = useSwapState();
  const isRecipientCustom = recipient !== null && !signedInWallets.some(wallet => wallet.address === recipient);

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection, onChangeRecipient, onChainSelection } =
    useSwapActionHandlers();

  const handleInputChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.INPUT, xChainId);
    },
    [onChainSelection],
  );

  const handleOutputChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.OUTPUT, xChainId);
    },
    [onChainSelection],
  );

  const outputAccount = useXAccount(getXChainType(direction.to));

  const { manualAddresses, setManualAddress } = useManualAddresses();

  React.useEffect(() => {
    if (manualAddresses[direction.to]) {
      onChangeRecipient(manualAddresses[direction.to] ?? null);
    } else if (outputAccount.address) {
      onChangeRecipient(outputAccount.address);
    } else {
      onChangeRecipient(null);
    }
  }, [onChangeRecipient, outputAccount.address, manualAddresses[direction.to], direction.to]);

  const handleInputType = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput],
  );

  const handleOutputType = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput],
  );

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency);
    },
    [onCurrencySelection],
  );

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency);
    },
    [onCurrencySelection],
  );

  const maxInputAmount = useMemo(() => maxAmountSpend(currencyBalances[Field.INPUT]), [currencyBalances]);

  const handleInputPercentSelect = useCallback(
    (percent: number) => {
      maxInputAmount &&
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  const handleMaxBridgeAmountClick = (amount: CurrencyAmount<XToken>) => {
    onUserInput(Field.OUTPUT, amount?.toFixed(4));
  };

  const handleMaxWithdrawAmountClick = (amount: CurrencyAmount<Currency>) => {
    onUserInput(Field.OUTPUT, amount?.toFixed(4));
  };

  const rates = useRatesWithOracle();

  const swapInputValue = useMemo(() => {
    return formattedAmounts[Field.INPUT];
  }, [formattedAmounts]);

  const swapOutputValue = useMemo(() => {
    return formattedAmounts[Field.OUTPUT];
  }, [formattedAmounts]);

  // !! SODAX start
  const payload = useMemo(() => {
    if (!sourceToken || !destToken) {
      return undefined;
    }

    if (Number(sourceAmount) <= 0) {
      return undefined;
    }

    return {
      token_src: sourceToken.address,
      token_src_blockchain_id: sourceChain,
      token_dst: destToken.address,
      token_dst_blockchain_id: destChain,
      amount: scaleTokenAmount(sourceAmount, sourceToken.decimals),
      quote_type: 'exact_input',
    } satisfies IntentQuoteRequest;
  }, [sourceToken, destToken, sourceChain, destChain, sourceAmount]);

  const quoteQuery = useQuote(payload);

  const quote = useMemo(() => {
    if (quoteQuery.data?.ok) {
      return quoteQuery.data.value;
    }

    return undefined;
  }, [quoteQuery]);

  const exchangeRate = useMemo(() => {
    return calculateExchangeRate(
      new BigNumber(sourceAmount),
      new BigNumber(normaliseTokenAmount(quote?.quoted_amount ?? 0n, destToken?.decimals ?? 0)),
    );
  }, [quote, sourceAmount, destToken]);

  const minOutputAmount = useMemo(() => {
    return quote?.quoted_amount
      ? new BigNumber(quote.quoted_amount.toString())
          .multipliedBy(new BigNumber(100).minus(new BigNumber(slippage)))
          .div(100)
      : undefined;
  }, [quote, slippage]);

  console.log('quote olol', quote);

  //!! SODAX Execute
  const handleSwap = async (intentOrderPayload: CreateIntentParams) => {
    // setOpen(false);
    // const result = await createIntentOrder(intentOrderPayload);
    //
    // if (result.ok) {
    //   const [response, intent, packet] = result.value;
    //
    //   setOrders(prev => [...prev, { intentHash: response.intent_hash, intent, packet }]);
    // } else {
    //   console.error('Error creating and submitting intent:', result.error);
    // }
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>Swap</Trans>
            </Typography>
            {account && currencyBalances[Field.INPUT] && (
              <Typography as="div" hidden={!account}>
                <Trans>Wallet:</Trans>{' '}
                {`${formatBalance(
                  currencyBalances[Field.INPUT]?.toFixed(),
                  rates?.[currencyBalances[Field.INPUT]?.currency.symbol]?.toFixed(),
                )} ${currencies[Field.INPUT]?.symbol}`}
              </Typography>
            )}
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={swapInputValue ?? ''}
              currency={currencies[Field.INPUT]}
              onUserInput={handleInputType}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
              percent={percents[Field.INPUT]}
              xChainId={direction.from}
              onChainSelect={handleInputChainSelection}
              showCrossChainOptions={true}
              currencySelectionType={CurrencySelectionType.SODAX_TRADE_IN}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="center" my={-1}>
            <FlipButton onClick={onSwitchTokens}>
              <FlipIcon width={25} height={17} />
            </FlipButton>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>For</Trans>
            </Typography>
            <Typography as="div" hidden={!recipient}>
              {recipient && (
                <>
                  <Trans>Wallet:</Trans>{' '}
                  {isRecipientCustom ? (
                    <Trans>Custom</Trans>
                  ) : (
                    `${
                      currencyBalances[Field.OUTPUT]
                        ? formatBalance(
                            currencyBalances[Field.OUTPUT]?.toFixed(),
                            rates?.[currencyBalances[Field.OUTPUT]?.currency.symbol]?.toFixed(),
                          )
                        : '0'
                    } ${formatSymbol(currencies[Field.OUTPUT]?.symbol)}`
                  )}
                </>
              )}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={swapOutputValue ?? ''}
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleOutputType}
              onCurrencySelect={handleOutputSelect}
              xChainId={direction.to}
              onChainSelect={handleOutputChainSelection}
              showCrossChainOptions={true}
              addressEditable
              setManualAddress={setManualAddress}
              showWarning={false}
              currencySelectionType={CurrencySelectionType.SODAX_TRADE_OUT}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <PriceImpact trade={undefined} />

          <SwapInfo trade={trade} />

          <Flex justifyContent="center" mt={4}>
            <SwapCommitButton
              hidden={false}
              trade={trade}
              error={inputError}
              currencies={currencies}
              canBridge={true}
              account={account}
              recipient={recipient}
              direction={direction}
              stellarValidation={stellarValidation}
              stellarTrustlineValidation={stellarTrustlineValidation}
              canSwap={true}
            />
          </Flex>

          {stellarValidation?.ok === false && stellarValidation.error && recipient && (
            <Flex alignItems="center" justifyContent="center" mt={2} flexDirection="column">
              <StellarSponsorshipModal text={'Activate your Stellar wallet.'} address={recipient} />
            </Flex>
          )}

          {stellarTrustlineValidation?.ok === false && stellarTrustlineValidation.error && recipient && (
            <Flex alignItems="center" justifyContent="center" mt={2} flexDirection="column">
              <StellarTrustlineModal
                currency={currencies[Field.OUTPUT]}
                text={`Activate ${currencies[Field.OUTPUT]?.symbol} for your Stellar wallet.`}
                address={recipient}
              />
            </Flex>
          )}

          <SolanaAccountExistenceWarning
            destinationChainId={direction.to}
            currencyAmount={parsedAmounts[Field.OUTPUT]}
            recipient={recipient ?? ''}
            onActivate={() => {
              handleOutputType('0.002');
            }}
          />

          <MMPendingIntents />
        </AutoColumn>
      </BrightPanel>
    </>
  );
}

const FlipButton = styled(Box)`
  cursor: pointer;
`;
