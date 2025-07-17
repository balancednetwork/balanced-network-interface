import React, { useCallback, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, Percent } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Box, Button, Flex } from 'rebass/styled-components';
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
import {
  useDerivedSwapInfo,
  useDerivedTradeInfo,
  useInitialSwapLoad,
  useSwapActionHandlers,
  useSwapState,
} from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { getXChainType, useXAccount, type XToken } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/sdk-core';
import { useCreateIntentOrder, useQuote } from '@sodax/dapp-kit';
import {
  CreateIntentParams,
  encodeAddress,
  Hex,
  Intent,
  IntentQuoteRequest,
  PacketData,
  SpokeChainId,
} from '@sodax/sdk';
import { BigNumber } from 'bignumber.js';
import MMPendingIntents from './MMPendingIntents';
import PriceImpact from './PriceImpact';
import SwapCommitButton from './SwapCommitButton';
import SwapInfo from './SwapInfo';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';

export default function SwapPanel() {
  useInitialSwapLoad();

  const {
    currencyBalances,
    currencies,
    inputError,
    percents,
    sourceAddress,
    direction,
    formattedAmounts,
    stellarValidation,
    stellarTrustlineValidation,
    parsedAmounts,
    quote,
    exchangeRate,
    minOutputAmount,
  } = useDerivedTradeInfo();

  // !! SODAX start
  const [slippage, setSlippage] = useState<string>('0.5');
  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const sourceToken = currencies[Field.INPUT];
  const destToken = currencies[Field.OUTPUT];
  const sourceChain = direction.from as SpokeChainId;
  const destChain = direction.to as SpokeChainId;
  const sourceAmount = formattedAmounts[Field.INPUT];

  const spokeProvider = useSpokeProvider(sourceChain);
  // console.log('spokeProvider debug kk', spokeProvider);

  const { mutateAsync: createIntentOrder } = useCreateIntentOrder(spokeProvider);
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

  const rates = useRatesWithOracle();

  const swapInputValue = useMemo(() => {
    return formattedAmounts[Field.INPUT];
  }, [formattedAmounts]);

  const swapOutputValue = useMemo(() => {
    return formattedAmounts[Field.OUTPUT];
  }, [formattedAmounts]);

  // !! SODAX start

  console.log('quote ololol', quote);

  //!! SODAX Execute
  const createIntentOrderPayload = async () => {
    if (!quote) {
      console.error('Quote undefined');
      return;
    }

    if (!sourceToken || !destToken) {
      console.error('sourceToken or destToken undefined');
      return;
    }

    if (!minOutputAmount) {
      console.error('minOutputAmount undefined');
      return;
    }

    if (!sourceAddress) {
      console.error('sourceAccount.address undefined');
      return;
    }

    if (!recipient) {
      console.error('destAccount.address undefined');
      return;
    }

    if (!spokeProvider) {
      console.error('sourceProvider or destProvider undefined');
      return;
    }

    const createIntentParams = {
      inputToken: sourceToken.address, // The address of the input token on hub chain
      outputToken: destToken.address, // The address of the output token on hub chain
      inputAmount: scaleTokenAmount(sourceAmount, sourceToken.decimals), // The amount of input tokens
      minOutputAmount: BigInt(minOutputAmount.toFixed(0)), // The minimum amount of output tokens to accept
      deadline: BigInt(0), // Optional timestamp after which intent expires (0 = no deadline)
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChain: sourceChain, // Chain ID where input tokens originate
      dstChain: destChain, // Chain ID where output tokens should be delivered
      srcAddress: encodeAddress(sourceChain, sourceAddress), // Source address in bytes (original address on spoke chain)
      dstAddress: encodeAddress(destChain, recipient), // Destination address in bytes (original address on spoke chain)
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateIntentParams;

    setIntentOrderPayload(createIntentParams);
  };

  const handleSwap = async (intentOrderPayload: CreateIntentParams) => {
    // setOpen(false);
    const result = await createIntentOrder(intentOrderPayload);

    if (result.ok) {
      const [response, intent, packet] = result.value;

      setOrders(prev => [...prev, { intentHash: response.intent_hash, intent, packet }]);
    } else {
      console.error('Error creating and submitting intent:', result.error);
    }
  };

  const handleIntent = async () => {
    await createIntentOrderPayload();
    intentOrderPayload && (await handleSwap(intentOrderPayload));
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>Swap</Trans>
            </Typography>
            {sourceAddress && currencyBalances[Field.INPUT] && (
              <Typography as="div" hidden={!sourceAddress}>
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
          {/* <SwapInfo trade={trade} /> TODO: refactor for intent trade */}
          <Flex justifyContent="center" mt={4}>
            <Button onClick={() => handleIntent()}>Create Intent Order</Button>
            {/* <SwapCommitButton
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
            /> */}
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
