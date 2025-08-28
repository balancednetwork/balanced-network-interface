import { TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import { UnifiedTransaction, UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { useOraclePrices } from '@/store/oracle/hooks';
import { useOrderStore } from '@/store/order/useOrderStore';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { xChainMap } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import { useCancelSwap } from '@sodax/dapp-kit';
import {
  Intent,
  IntentRelayChainId,
  Token,
  getSpokeChainIdFromIntentRelayChainId,
  getSupportedSolverTokens,
  hubAssetToOriginalAssetMap,
} from '@sodax/sdk';
import React, { useState } from 'react';
import { Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatusDisplay from '../TransactionStatusDisplay';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

import SwapArrow from '@/assets/icons/swap-arrow.svg';

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

const AssetFrom = styled.div`
  position: relative;
  transform: translateY(-10px);
`;

const AssetTo = styled.div`
  position: relative;
  transform: translateX(3px);
`;

const StyledSwapArrow = styled(SwapArrow)`
    position: absolute;
    left: 10px;
    top: 13px;
    transform: rotateY(180deg) rotateZ(-30deg);
`;

const CurrencyLogos = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
  margin-right: 3px;
`;

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
  const spokeProvider = useSpokeProvider(tx.data.packet.srcChainId);
  const { mutateAsync: cancelIntent } = useCancelSwap(spokeProvider);
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.None);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const { updateOrderStatus } = useOrderStore();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(tx.data.packet.srcChainId as any);

  const minOutputAmount = toBigIntSafe(tx.data.intent.minOutputAmount);

  const isBridgeAction = tokensData?.srcToken?.symbol === tokensData?.dstToken?.symbol;

  const currencies = {
    srcToken: SUPPORTED_TOKENS_LIST.find(
      token =>
        token.symbol.toLowerCase() ===
        (tokensData?.srcToken?.symbol.toLowerCase() === 'ws' ? 's' : tokensData?.srcToken?.symbol.toLowerCase()),
    ),
    dstToken: SUPPORTED_TOKENS_LIST.find(
      token => token.symbol.toLowerCase() === tokensData?.dstToken?.symbol.toLowerCase(),
    ),
  };

  const elapsedTime = useElapsedTime(tx.timestamp);

  const openCancelModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (cancelStatus === CancelStatus.Signing) return;
    setIsCancelModalOpen(false);
  };

  const handleConfirmCancel = async () => {
    setCancelStatus(CancelStatus.Signing);

    try {
      const response = await cancelIntent({
        intent: {
          ...tx.data.intent,
          minOutputAmount: minOutputAmount,
          inputAmount: toBigIntSafe(tx.data.intent.inputAmount),
          deadline: toBigIntSafe(tx.data.intent.deadline),
          intentId: toBigIntSafe(tx.data.intent.intentId),
          srcChain: toBigIntSafe(tx.data.intent.srcChain) as IntentRelayChainId,
          dstChain: toBigIntSafe(tx.data.intent.dstChain) as IntentRelayChainId,
        },
      });

      if (response.ok || (response as any)?.error?.message === 'Simulation failed') {
        setCancelStatus(CancelStatus.Success);
        updateOrderStatus(tx.data.intentHash, UnifiedTransactionStatus.cancelled);
        setIsCancelModalOpen(false);
      } else {
        setCancelStatus(CancelStatus.None);
      }
    } catch (e: any) {
      console.error(e);
      setCancelStatus(CancelStatus.None);
    }
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
  const receivedAmount = CurrencyAmount.fromRawAmount(currencies.dstToken, minOutputAmount);
  const receivedAmountFormatted = formatBalance(
    receivedAmount.toFixed(),
    prices?.[receivedAmount.currency.symbol]?.toFixed() || 1,
  );

  return (
    <>
      <Container>
        <CurrencyLogos>
          <AssetFrom>
            <CurrencyLogoWithNetwork
              currency={currencies.srcToken}
              chainId={tokensData?.srcChainId}
              bgColor={theme.colors.bg2}
              size="26px"
            />
          </AssetFrom>

          <AssetTo>
            <CurrencyLogoWithNetwork
              currency={currencies.dstToken}
              chainId={tokensData?.dstChainId}
              bgColor={theme.colors.bg2}
              size="26px"
            />
          </AssetTo>
          <StyledSwapArrow width="29px" height="29px" />
        </CurrencyLogos>

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
                {formatSymbol(amount.currency.symbol)} for {receivedAmountFormatted}{' '}
                {formatSymbol(currencies.dstToken.symbol)}
              </span>
            )}
          </Amount>
        </Details>
        <Meta>
          <TransactionStatusDisplay status={tx.status} />
          <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
        </Meta>
      </Container>
      {tx.status === UnifiedTransactionStatus.pending || tx.status === UnifiedTransactionStatus.failed ? (
        <Flex paddingLeft="38px" marginBottom="-10px" width="100%" justifyContent="flex-end" alignItems="center">
          {cancelStatus === CancelStatus.None && <CancelButton onClick={openCancelModal}>Cancel</CancelButton>}
          {cancelStatus === CancelStatus.AwaitingConfirmation && <ElapsedTime>Canceling...</ElapsedTime>}
          {cancelStatus === CancelStatus.Success && <ElapsedTime>Canceled</ElapsedTime>}
        </Flex>
      ) : null}

      <Modal isOpen={isCancelModalOpen} onDismiss={closeCancelModal}>
        <ModalContent noMessages>
          <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
            <Trans>Cancel {isBridgeAction ? 'bridge' : 'swap'}?</Trans>
          </Typography>

          <Typography textAlign="center" mt={2} as="h3" fontWeight="normal">
            <Trans>
              This action will cancel the {isBridgeAction ? 'bridge' : 'swap'} and refund your{' '}
              <strong style={{ whiteSpace: 'nowrap' }}>
                {formatBalance(amount.toFixed(), prices?.[amount.currency.symbol]?.toFixed() || 1)}{' '}
                {formatSymbol(currencies.srcToken.symbol)}
              </strong>
            </Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={closeCancelModal}>
              <Trans>Close</Trans>
            </TextButton>

            {isWrongChain ? (
              <StyledButton onClick={handleSwitchChain}>
                <Trans>Switch to {xChainMap[tx.data.packet.srcChainId].name}</Trans>
              </StyledButton>
            ) : (
              <StyledButton
                disabled={cancelStatus === CancelStatus.Signing}
                warning={true}
                onClick={handleConfirmCancel}
                $loading={cancelStatus === CancelStatus.Signing}
              >
                <Trans>Cancel</Trans>
              </StyledButton>
            )}
          </Flex>
        </ModalContent>
      </Modal>
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
