import React, { useCallback } from 'react';

import { Percent } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';

import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { Typography } from 'app/theme';
import FlipIcon from 'assets/icons/horizontal-flip.svg';
import { useBridgeActionHandlers, useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useCrossChainWalletBalances } from 'store/wallet/hooks';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button } from 'app/components/Button';
import { CurrencySelectionType } from 'app/components/SearchModal/CurrencySearch';
import { AutoColumn } from 'app/pages/trade/xswap/_components/SwapPanel';
import { BrightPanel } from 'app/pages/trade/supply/_components/utils';

import ChainSelector from './ChainSelector';
import { useWalletModalToggle } from 'store/application/hooks';
import { Field } from 'store/bridge/reducer';
import useXCallFee from '../_hooks/useXCallFee';
import { xChainMap } from '../_config/xChains';
import { maxAmountSpend, validateAddress } from 'utils';
import { useAvailableWallets } from '../_hooks/useWallets';
import { UnderlineText } from 'app/components/DropdownText';

export default function BridgeTransferForm({ openModal }) {
  const crossChainWallet = useCrossChainWalletBalances();
  const [isValid, setValid] = React.useState(true);
  const bridgeState = useBridgeState();
  const { currency: currencyToBridge, recipient, typedValue } = bridgeState;
  const { onChangeRecipient, onCurrencySelection, onUserInput, onChainSelection, onSwitchChain, onPercentSelection } =
    useBridgeActionHandlers();
  const bridgeDirection = useBridgeDirection();
  const percentAmount = bridgeState[Field.FROM].percent;

  const signedInWallets = useAvailableWallets();
  const toggleWalletModal = useWalletModalToggle();

  const maxInputAmount = React.useMemo(
    () =>
      maxAmountSpend(
        currencyToBridge ? crossChainWallet[bridgeDirection.from]?.[currencyToBridge.wrapped.address] : undefined,
        bridgeDirection.from,
      ),
    [currencyToBridge, bridgeDirection.from, crossChainWallet],
  );

  const handleInputPercentSelect = useCallback(
    (percent: number) => {
      maxInputAmount &&
        onPercentSelection(Field.FROM, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  React.useEffect(() => {
    const destinationWallet = signedInWallets.find(
      wallet => xChainMap[wallet.xChainId].xWalletType === xChainMap[bridgeDirection.to].xWalletType,
    );
    if (destinationWallet) {
      onChangeRecipient(destinationWallet.address);
    } else {
      onChangeRecipient(null);
    }
  }, [bridgeDirection.to, onChangeRecipient, signedInWallets]);

  const { errorMessage, selectedTokenWalletBalance, account, canBridge, maximumBridgeAmount } = useDerivedBridgeInfo();

  const handleSubmit = async () => {
    if (account) {
      openModal();
    } else {
      toggleWalletModal();
    }
  };

  const { formattedXCallFee } = useXCallFee(bridgeDirection.from, bridgeDirection.to);

  React.useEffect(() => {
    setValid(validateAddress(recipient || '', bridgeDirection.to));
  }, [recipient, bridgeDirection.to]);

  const handleMaximumBridgeAmountClick = () => {
    if (maximumBridgeAmount) {
      onUserInput(maximumBridgeAmount?.toFixed(0));
    }
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Typography variant="h2">
            <Trans>Transfer</Trans>
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

          <Typography as="div" mb={-1} textAlign="right" hidden={!account}>
            <Trans>Wallet:</Trans>{' '}
            {`${selectedTokenWalletBalance?.toFixed(4, { groupSeparator: ',' }) ?? 0} ${currencyToBridge?.symbol}`}
          </Typography>

          <Flex>
            <CurrencyInputPanel
              value={typedValue}
              currency={currencyToBridge}
              onUserInput={onUserInput}
              onCurrencySelect={onCurrencySelection}
              onPercentSelect={!!account ? handleInputPercentSelect : undefined}
              percent={percentAmount}
              currencySelectionType={CurrencySelectionType.BRIDGE}
              showCommunityListControl={false}
              xChainId={bridgeDirection.from}
            />
          </Flex>

          <Flex style={{ position: 'relative' }}>
            <AddressInputPanel
              value={recipient || ''}
              onUserInput={onChangeRecipient}
              placeholder={`${xChainMap[bridgeDirection.to].name} address`}
              isValid={isValid}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
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

            <Typography color="text">~ 30s</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={4}>
            {account ? (
              <Button onClick={handleSubmit} disabled={!!errorMessage || !isValid || !canBridge}>
                {errorMessage ? errorMessage : <Trans>Transfer</Trans>}
              </Button>
            ) : (
              <Button onClick={handleSubmit}>{<Trans>Transfer</Trans>}</Button>
            )}
          </Flex>

          {!canBridge && (
            <Flex alignItems="center" justifyContent="center" mt={2}>
              <Typography textAlign="center">
                {maximumBridgeAmount?.greaterThan(0) && (
                  <>
                    <Trans>Only</Trans>{' '}
                    <UnderlineText onClick={handleMaximumBridgeAmountClick}>
                      <Typography color="primaryBright" as="a">
                        {maximumBridgeAmount?.toFixed(0)} {maximumBridgeAmount?.currency?.symbol}
                      </Typography>
                    </UnderlineText>{' '}
                  </>
                )}
                {maximumBridgeAmount?.equalTo(0) && (
                  <>
                    <Trans>0 {maximumBridgeAmount?.currency?.symbol}</Trans>{' '}
                  </>
                )}
                <Trans>is available on {xChainMap[bridgeDirection?.to].name}.</Trans>
              </Typography>
            </Flex>
          )}
        </AutoColumn>
      </BrightPanel>
    </>
  );
}
