import { SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import { UnifiedTransaction } from '@/hooks/useCombinedTransactions';
import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import {
  Intent,
  IntentRelayChainId,
  Token,
  getSpokeChainIdFromIntentRelayChainId,
  getSupportedSolverTokens,
  intentRelayChainIdToSpokeChainIdMap,
  isValidIntentRelayChainId,
  spokeChainConfig,
  supportedTokensPerChain,
} from '@sodax/sdk';
import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatusDisplay from '../TransactionStatusDisplay';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

enum CancelStatus {
  None,
  Signing,
  AwaitingConfirmation,
  Success,
  Failed,
}

interface SwapIntentProps {
  tx: UnifiedTransaction;
}

function parseBigIntString(bigIntString: string): bigint {
  if (bigIntString.startsWith('BIGINT::')) {
    return BigInt(bigIntString.substring(8));
  }
  throw new Error('Invalid BIGINT string format');
}

const getTokenDataFromIntent = (
  intentData: Intent,
): { srcToken: Token | undefined; dstToken: Token | undefined } | undefined => {
  try {
    console.log('WTFFF', intentData);
    // Convert intent relay chain ID to spoke chain ID
    const srcChainId = getSpokeChainIdFromIntentRelayChainId(
      parseBigIntString(intentData.srcChain.toString()) as IntentRelayChainId,
    );
    const dstChainId = getSpokeChainIdFromIntentRelayChainId(
      parseBigIntString(intentData.dstChain.toString()) as IntentRelayChainId,
    );

    // Get all supported tokens for this chain
    const srcSupportedTokens = getSupportedSolverTokens(srcChainId);
    const dstSupportedTokens = getSupportedSolverTokens(dstChainId);

    // Find the specific token by address
    const srcToken = srcSupportedTokens.find(
      token => token.address.toLowerCase() === intentData.inputToken.toLowerCase(),
    );
    const dstToken = dstSupportedTokens.find(
      token => token.address.toLowerCase() === intentData.outputToken.toLowerCase(),
    );

    return { srcToken, dstToken };
  } catch (error) {
    console.error('Error getting token data:', error);
    return undefined;
  }
};

const SwapIntent: React.FC<SwapIntentProps> = ({ tx }) => {
  const theme = useTheme();
  const { inputAmount } = tx.data.intent;
  const intentData = tx.data.intent;
  const tokens = getTokenDataFromIntent(intentData);
  const prices = useOraclePrices();
  const [status, setStatus] = useState<CancelStatus>(CancelStatus.None);

  const currencies = {
    srcToken: SUPPORTED_TOKENS_LIST.find(
      token => token.symbol.toLowerCase() === tokens?.srcToken?.symbol.toLowerCase(),
    ),
    dstToken: SUPPORTED_TOKENS_LIST.find(
      token => token.symbol.toLowerCase() === tokens?.dstToken?.symbol.toLowerCase(),
    ),
  };

  const srcChainId = isValidIntentRelayChainId(intentData.srcChain)
    ? (intentRelayChainIdToSpokeChainIdMap[intentData.srcChain as unknown as string] as XChainId)
    : undefined;
  const dstChainId = isValidIntentRelayChainId(intentData.dstChain)
    ? (intentRelayChainIdToSpokeChainIdMap[intentData.dstChain as unknown as string] as XChainId)
    : undefined;

  const elapsedTime = useElapsedTime(tx.timestamp);

  const handleCancel = async () => {
    alert('cancel');
    // setStatus(CancelStatus.Signing);
    // try {
    //   if (intentProvider) {
    //     const result = await intentService.cancelIntentOrder(
    //       transaction.orderId,
    //       xChainMap[transaction.fromAmount.currency.xChainId].intentChainId,
    //       intentProvider,
    //     );

    //     if (result.ok) {
    //       MMTransactionActions.cancel(transaction.id);
    //       setStatus(CancelStatus.Success);
    //     } else {
    //       setStatus(CancelStatus.None);
    //     }
    //   }
    // } catch (e) {
    //   console.error(e);
    //   setStatus(CancelStatus.None);
    // }
  };

  if (!srcChainId) {
    return <Container>Order tx - Unknown source chain</Container>;
  }

  if (!dstChainId) {
    return <Container>Order tx - Unknown destination chain</Container>;
  }

  if (!currencies.srcToken) {
    return <Container>Order tx - Unknown source token</Container>;
  }

  if (!currencies.dstToken) {
    return <Container>Order tx - Unknown destination token</Container>;
  }

  const amount = CurrencyAmount.fromRawAmount(currencies.srcToken, inputAmount);

  return (
    <>
      <Container>
        <CurrencyLogoWithNetwork
          currency={currencies.srcToken}
          chainId={srcChainId as XChainId}
          bgColor={theme.colors.bg2}
          size="26px"
        />
        <Details>
          <Title>
            Swap {formatSymbol(currencies.srcToken.symbol)} for {formatSymbol(currencies.dstToken.symbol)}
          </Title>
          <Amount>
            {formatBalance(amount.toFixed(), prices?.[amount.currency.symbol]?.toFixed() || 1)}{' '}
            {formatSymbol(amount.currency.symbol)} for{' '}
            {/* {formatBalance(toAmount.toFixed(), prices[toAmount.currency.address]?.toFixed() || 1)}{' '} */}
            {formatSymbol(currencies.dstToken.symbol)}
          </Amount>
        </Details>
        <Meta>
          <TransactionStatusDisplay status={tx.status} />
          <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
        </Meta>
      </Container>
      {/* {transaction.status === MMTransactionStatus.pending ? (
        <Flex paddingLeft="38px" marginBottom="-10px" width="100%" justifyContent="flex-end" alignItems="center">
          {status === CancelStatus.None && <CancelButton onClick={handleCancel}>Cancel</CancelButton>}
          {status === CancelStatus.Signing && <ElapsedTime>Signing...</ElapsedTime>}
          {status === CancelStatus.AwaitingConfirmation && <ElapsedTime>Canceling...</ElapsedTime>}
          {status === CancelStatus.Success && <ElapsedTime>Done</ElapsedTime>}
        </Flex>
      ) : null} */}
    </>
  );
};

const CancelButton = styled.button`
  background: none;
  border: none;
  color: #fb6a6a;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
`;

export default SwapIntent;
