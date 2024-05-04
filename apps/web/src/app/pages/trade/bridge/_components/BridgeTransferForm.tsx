import React from 'react';

import { Fraction } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import QuestionHelper, { QuestionWrapper } from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import FlipIcon from 'assets/icons/horizontal-flip.svg';
import { useBridgeActionHandlers, useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button } from 'app/components/Button';
import CrossChainConnectWallet from 'app/components/CrossChainWalletConnect';
import { CurrencySelectionType } from 'app/components/SearchModal/CurrencySearch';
import { AutoColumn } from 'app/components/trade/SwapPanel';
import { BrightPanel } from 'app/components/trade/utils';
import { XCallDescription } from 'app/components/XCallDescription';

import ChainSelector from './ChainSelector';
import { useWalletModalToggle } from 'store/application/hooks';
import { useXCallFee, useXCallProtocol, useXWallet } from 'app/pages/trade/bridge-v2/_hooks/hooks';
import { Field } from 'store/bridge/reducer';

const ConnectWrap = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  top: 0;
  right: 0;
  padding-right: 15px;
`;

export default function BridgeTransferForm({ openModal }) {
  const { account } = useIconReact();
  const crossChainWallet = useCrossChainWalletBalances();

  const bridgeState = useBridgeState();
  const { currency: currencyToBridge, recipient, typedValue } = bridgeState;
  const { onChangeRecipient, onCurrencySelection, onUserInput, onChainSelection, onSwitchChain, onPercentSelection } =
    useBridgeActionHandlers();
  const bridgeDirection = useBridgeDirection();
  const percentAmount = bridgeState[Field.FROM].percent;

  const signedInWallets = useSignedInWallets();
  const toggleWalletModal = useWalletModalToggle();

  const handleInputPercentSelect = (percent: number) => {
    const currencyAmount =
      currencyToBridge && crossChainWallet[bridgeDirection.from]?.[currencyToBridge.wrapped.address];
    if (currencyAmount) {
      onPercentSelection(Field.FROM, percent, currencyAmount.multiply(new Fraction(percent, 100)).toFixed());
    }
  };

  React.useEffect(() => {
    const destinationWallet = signedInWallets.find(wallet => wallet.chainId === bridgeDirection.to);
    if (destinationWallet) {
      onChangeRecipient(destinationWallet.address);
    } else {
      onChangeRecipient(null);
    }
  }, [bridgeDirection.to, onChangeRecipient, signedInWallets]);

  const { errorMessage, isAvailable, selectedTokenWalletBalance } = useDerivedBridgeInfo();

  const handleSubmit = async () => {
    if (signedInWallets.some(wallet => wallet.chainId === bridgeDirection.from)) {
      openModal();
    } else {
      toggleWalletModal();
    }
  };

  const protocol = useXCallProtocol(bridgeDirection.from, bridgeDirection.to);
  const { formattedXCallFee } = useXCallFee(bridgeDirection.from, bridgeDirection.to);
  const xWallet = useXWallet(bridgeDirection.from);

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Typography variant="h2">
            <Trans>Bridge</Trans>
          </Typography>
          <Flex width="100%" alignItems="center" justifyContent="space-between">
            <ChainSelector
              label="from"
              chainId={bridgeDirection.from}
              setChainId={c => onChainSelection(Field.FROM, c)}
            />
            <Box sx={{ cursor: 'pointer', marginLeft: '-25px' }} onClick={onSwitchChain}>
              <FlipIcon width={25} height={17} />
            </Box>
            <ChainSelector label="to" chainId={bridgeDirection.to} setChainId={c => onChainSelection(Field.TO, c)} />
          </Flex>

          <Typography as="div" mb={-1} textAlign="right" hidden={!xWallet.account}>
            <Trans>Wallet:</Trans>{' '}
            {`${selectedTokenWalletBalance?.toFixed(4, { groupSeparator: ',' }) ?? 0} ${currencyToBridge?.symbol}`}
          </Typography>

          <Flex>
            <CurrencyInputPanel
              account={account}
              value={typedValue}
              currency={currencyToBridge}
              selectedCurrency={currencyToBridge}
              onUserInput={onUserInput}
              onCurrencySelect={onCurrencySelection}
              onPercentSelect={!!account ? handleInputPercentSelect : undefined}
              percent={percentAmount}
              currencySelectionType={CurrencySelectionType.BRIDGE}
              showCommunityListControl={false}
            />
          </Flex>

          <Flex style={{ position: 'relative' }}>
            <AddressInputPanel value={recipient || ''} onUserInput={onChangeRecipient} drivenOnly={true} />
            {!recipient && !signedInWallets.find(wallet => wallet.chainId === bridgeDirection.to)?.address && (
              <ConnectWrap>
                <CrossChainConnectWallet chainId={bridgeDirection.to} />
              </ConnectWrap>
            )}
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Bridge</Trans>
            </Typography>

            {protocol && (
              <Typography color="text">
                {protocol?.name} + xCall
                <QuestionWrapper style={{ marginLeft: '3px', transform: 'translateY(1px)' }}>
                  <QuestionHelper width={300} text={<XCallDescription protocol={protocol} />} />
                </QuestionWrapper>
              </Typography>
            )}
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Fee</Trans>
            </Typography>

            <Typography color="text">{formattedXCallFee ?? ''}</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Transfer time</Trans>
            </Typography>

            <Typography color="text">~ 15s</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={4}>
            <Button onClick={handleSubmit} disabled={!isAvailable || !!errorMessage}>
              {errorMessage ? errorMessage : <Trans>Transfer</Trans>}
            </Button>
          </Flex>
        </AutoColumn>
      </BrightPanel>
    </>
  );
}
