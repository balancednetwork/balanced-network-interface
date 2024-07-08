import React, { useCallback } from 'react';

import { Price, Currency, Token } from '@balancednetwork/sdk-core';
import { Route } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import { ChevronRight } from 'react-feather';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import { Typography } from 'app/theme';
import { useSwapSlippageTolerance, useSetSlippageTolerance } from 'store/application/hooks';
import { Field } from 'store/swap/reducer';
import { useDerivedSwapInfo } from 'store/swap/hooks';

import Divider from 'app/components/Divider';
import useXCallFee from 'app/pages/trade/bridge/_hooks/useXCallFee';
import { XChainId } from '../../bridge/types';
import { xChainMap } from '../../bridge/_config/xChains';

export default function AdvancedSwapDetails() {
  const { trade, currencies, direction } = useDerivedSwapInfo();

  const [showInverted, setShowInverted] = React.useState<boolean>(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const setSlippageTolerance = useSetSlippageTolerance();

  const isXSwap = !(direction.from === '0x1.icon' && direction.to === '0x1.icon');

  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);

  return (
    <Box padding={5} bg="bg4" width={328}>
      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Exchange rate</Trans>
        </Typography>

        {trade && (
          <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
        )}
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Route</Trans>
        </Typography>

        <Typography textAlign="right" maxWidth="200px">
          {trade ? <TradeRoute route={trade.route} /> : '-'}
        </Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" mb={2}>
        <Typography>
          <Trans>Fee</Trans>
        </Typography>

        <Typography textAlign="right">
          {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
        </Typography>
      </Flex>

      <Flex alignItems="baseline" justifyContent="space-between">
        <Typography as="span">
          <Trans>Slippage tolerance</Trans>
          <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} />
        </Typography>
        <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
      </Flex>

      {isXSwap && (
        <>
          <Divider my={2} />

          <Flex alignItems="center" justifyContent="space-between" mb={2}>
            <Typography>
              <Trans>Bridge fee</Trans>
            </Typography>

            <Typography color="text">{formattedXCallFee ?? ''}</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Transfer time</Trans>
            </Typography>

            <Typography textAlign="right">~ 30s</Typography>
          </Flex>
        </>
      )}
    </Box>
  );
}

interface TradePriceProps {
  price: Price<Currency, Currency>;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

const StyledPriceContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  padding: 0;
  border: none;
  cursor: pointer;
`;

function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  let formattedPrice: string;
  try {
    formattedPrice = showInverted ? price.toSignificant(4) : price.invert()?.toSignificant(4);
  } catch (error) {
    formattedPrice = '0';
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `;
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`;
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted]);

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`;

  return (
    <StyledPriceContainer onClick={flipPrice} title={text}>
      <div style={{ alignItems: 'center', display: 'flex', width: 'fit-content' }}>
        <Typography textAlign="right">{text}</Typography>
      </div>
    </StyledPriceContainer>
  );
}

function TradeRoute({ route }: { route: Route<Currency, Currency> }) {
  return (
    <>
      {route.path.map((token: Token, index: number) => (
        <span key={token.address}>
          {index > 0 && <ChevronRight size={14} />} {token.symbol}
        </span>
      ))}
    </>
  );
}

function BridgeRoute({ route }: { route: XChainId[] }) {
  return (
    <>
      {route.map((xChainId: XChainId, index: number) => (
        <span key={xChainId}>
          {index > 0 && <ChevronRight size={14} />} {xChainMap[xChainId].name}
        </span>
      ))}
    </>
  );
}
