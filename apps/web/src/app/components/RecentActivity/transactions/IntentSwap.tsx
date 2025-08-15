import { SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import { UnifiedTransaction, UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
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
  hubAssetToOriginalAssetMap,
} from '@sodax/sdk';
import { xChainMap } from '@sodax/wallet-sdk';
import React, { useState } from 'react';
import { Flex } from 'rebass';
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

function toBigIntSafe(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') {
    const normalized = value.startsWith('BIGINT::') ? value.substring(8) : value;
    if (/^\d+$/.test(normalized)) return BigInt(normalized);
  }
  throw new Error('Invalid bigint-like value');
}

export const getTokenDataFromIntent = (
  intentData: Intent,
):
  | { srcToken: Token | undefined; dstToken: Token | undefined; srcChainId: XChainId; dstChainId: XChainId }
  | undefined => {
  try {
    // Convert intent relay chain ID to spoke chain ID
    const srcChainId = getSpokeChainIdFromIntentRelayChainId(
      toBigIntSafe((intentData as any).srcChain) as IntentRelayChainId,
    );
    const dstChainId = getSpokeChainIdFromIntentRelayChainId(
      toBigIntSafe((intentData as any).dstChain) as IntentRelayChainId,
    );

    const srcHubAssetMap = Array.from(hubAssetToOriginalAssetMap.entries()).find(
      ([key, value]) => key === srcChainId,
    )?.[1];
    const dstHubAssetMap = Array.from(hubAssetToOriginalAssetMap.entries()).find(
      ([key, value]) => key === dstChainId,
    )?.[1];

    if (!srcHubAssetMap || !dstHubAssetMap) {
      return undefined;
    }

    // Get all supported tokens for this chain
    const srcSupportedTokens = getSupportedSolverTokens(srcChainId);
    const dstSupportedTokens = getSupportedSolverTokens(dstChainId);

    const mappedSrcToken = Array.from(srcHubAssetMap.entries()).find(
      ([key]) => key.toLowerCase() === intentData.inputToken.toLowerCase(),
    )?.[1];
    const mappedDstToken = Array.from(dstHubAssetMap.entries()).find(
      ([key]) => key.toLowerCase() === intentData.outputToken.toLowerCase(),
    )?.[1];

    const srcToken = srcSupportedTokens.find(token => token.address.toLowerCase() === mappedSrcToken?.toLowerCase());
    const dstToken = dstSupportedTokens.find(token => token.address.toLowerCase() === mappedDstToken?.toLowerCase());

    return { srcToken, dstToken, srcChainId: srcChainId as XChainId, dstChainId: dstChainId as XChainId };
  } catch (error) {
    console.error('Error getting token data:', error);
    return undefined;
  }
};

const SwapIntent: React.FC<SwapIntentProps> = ({ tx }) => {
  const theme = useTheme();
  const { inputAmount } = tx.data.intent;
  const intentData = tx.data.intent;
  const tokensData = getTokenDataFromIntent(intentData);
  const prices = useOraclePrices();
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.None);

  const isBridgeAction = tokensData?.srcToken?.symbol === tokensData?.dstToken?.symbol;

  const currencies = {
    srcToken: SUPPORTED_TOKENS_LIST.find(
      token => token.symbol.toLowerCase() === tokensData?.srcToken?.symbol.toLowerCase(),
    ),
    dstToken: SUPPORTED_TOKENS_LIST.find(
      token => token.symbol.toLowerCase() === tokensData?.dstToken?.symbol.toLowerCase(),
    ),
  };

  const elapsedTime = useElapsedTime(tx.timestamp);

  const handleCancel = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (!tokensData?.srcChainId) {
    return <Container>Order tx - Unknown source chain</Container>;
  }

  if (!tokensData?.dstChainId) {
    return <Container>Order tx - Unknown destination chain</Container>;
  }

  if (!currencies.srcToken) {
    return <Container>Order tx - Unknown source token</Container>;
  }

  if (!currencies.dstToken) {
    return <Container>Order tx - Unknown destination token</Container>;
  }

  const amount = CurrencyAmount.fromRawAmount(currencies.srcToken, toBigIntSafe(inputAmount as unknown));

  return (
    <>
      <Container>
        <CurrencyLogoWithNetwork
          currency={currencies.srcToken}
          chainId={tokensData?.srcChainId}
          bgColor={theme.colors.bg2}
          size="26px"
        />
        <Details>
          {isBridgeAction ? (
            <Title>
              Bridge {formatSymbol(currencies.srcToken.symbol)} to {xChainMap[tokensData.dstChainId].name}
            </Title>
          ) : (
            <Title>
              Swap {formatSymbol(currencies.srcToken.symbol)} for {formatSymbol(currencies.dstToken.symbol)}
            </Title>
          )}
          <Amount>
            {isBridgeAction ? (
              <span>
                {formatBalance(amount.toFixed(), prices?.[amount.currency.symbol]?.toFixed() || 1)}{' '}
                {formatSymbol(amount.currency.symbol)}
              </span>
            ) : (
              <span>
                {formatBalance(amount.toFixed(), prices?.[amount.currency.symbol]?.toFixed() || 1)}{' '}
                {formatSymbol(amount.currency.symbol)} for {formatSymbol(currencies.dstToken.symbol)}
              </span>
            )}
          </Amount>
        </Details>
        <Meta>
          <TransactionStatusDisplay status={tx.status} />
          <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
        </Meta>
      </Container>
      {tx.status === UnifiedTransactionStatus.pending ? (
        <Flex paddingLeft="38px" marginBottom="-10px" width="100%" justifyContent="flex-end" alignItems="center">
          {cancelStatus === CancelStatus.None && <CancelButton onClick={handleCancel}>Cancel</CancelButton>}
          {cancelStatus === CancelStatus.Signing && <ElapsedTime>Signing...</ElapsedTime>}
          {cancelStatus === CancelStatus.AwaitingConfirmation && <ElapsedTime>Canceling...</ElapsedTime>}
          {cancelStatus === CancelStatus.Success && <ElapsedTime>Done</ElapsedTime>}
        </Flex>
      ) : null}
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
