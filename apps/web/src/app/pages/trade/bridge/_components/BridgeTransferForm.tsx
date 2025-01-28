import React, { useCallback } from 'react';

import { Percent } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';

import AddressInputPanel from '@/app/components/AddressInputPanel';
import BridgeLimitWarning from '@/app/components/BridgeLimitWarning';
import { Button } from '@/app/components/Button';
import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { BrightPanel } from '@/app/components/Panel';
import { CurrencySelectionType, SelectorType } from '@/app/components/SearchModal/CurrencySearch';
import SolanaAccountExistenceWarning from '@/app/components/SolanaAccountExistenceWarning';
import StellarSponsorshipModal from '@/app/components/StellarSponsorshipModal';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/horizontal-flip.svg';
import useManualAddresses from '@/hooks/useManualAddresses';
import useWidth from '@/hooks/useWidth';
import { useWalletModalToggle } from '@/store/application/hooks';
import {
  useBridgeActionHandlers,
  useBridgeDirection,
  useBridgeState,
  useDerivedBridgeInfo,
} from '@/store/bridge/hooks';
import { Field } from '@/store/bridge/reducer';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { maxAmountSpend } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { getXChainType } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { useXAccount, useXConnect, useXConnectors } from '@balancednetwork/xwagmi';
import { validateAddress } from '@balancednetwork/xwagmi';
import { useXCallFee } from '@balancednetwork/xwagmi';
import XChainSelector from './XChainSelector';

export default function BridgeTransferForm({ openModal }) {
  const crossChainWallet = useCrossChainWalletBalances();
  const [isValid, setValid] = React.useState(true);
  const bridgeState = useBridgeState();
  const { currency: currencyToBridge, recipient, typedValue } = bridgeState;
  const { onChangeRecipient, onCurrencySelection, onUserInput, onChainSelection, onSwitchChain, onPercentSelection } =
    useBridgeActionHandlers();
  const bridgeDirection = useBridgeDirection();
  const percentAmount = bridgeState[Field.FROM].percent;
  const [ref, width] = useWidth();
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

  const { manualAddresses, setManualAddress } = useManualAddresses();
  const onAddressInput = React.useCallback(
    (address: string) => {
      setManualAddress(bridgeDirection.to, address);
      onChangeRecipient(address);
    },
    [onChangeRecipient, bridgeDirection.to, setManualAddress],
  );

  const xAccount = useXAccount(getXChainType(bridgeDirection.to));
  React.useEffect(() => {
    if (manualAddresses[bridgeDirection.to]) {
      onChangeRecipient(manualAddresses[bridgeDirection.to] ?? null);
    } else if (xAccount.address) {
      onChangeRecipient(xAccount.address);
    } else {
      onChangeRecipient(null);
    }
  }, [onChangeRecipient, xAccount, manualAddresses[bridgeDirection.to], bridgeDirection.to]);

  const {
    errorMessage,
    selectedTokenWalletBalance,
    account,
    canBridge,
    maximumBridgeAmount,
    stellarValidation,
    currencyAmountToBridge,
  } = useDerivedBridgeInfo();
  const xChainType = getXChainType(bridgeDirection.from);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  const handleSubmit = async () => {
    if (recipient && !account) {
      handleConnectWallet(xChainType, xConnectors, xConnect);
    } else if (account) {
      openModal();
    } else {
      toggleWalletModal();
    }
  };

  const { formattedXCallFee } = useXCallFee(bridgeDirection.from, bridgeDirection.to);

  React.useEffect(() => {
    validateAddress(recipient || '', bridgeDirection.to).then(setValid);
  }, [recipient, bridgeDirection.to]);

  const handleMaximumBridgeAmountClick = () => {
    if (maximumBridgeAmount) {
      onUserInput(maximumBridgeAmount?.toFixed(4));
    }
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Typography variant="h2">
            <Trans>Transfer</Trans>
          </Typography>
          <Flex width="100%" alignItems="center" justifyContent="space-between" ref={ref}>
            <XChainSelector
              label="from"
              chainId={bridgeDirection.from}
              setChainId={c => onChainSelection(Field.FROM, c)}
              currency={currencyToBridge}
              width={width}
              containerRef={ref.current}
              showTotalXWalletValue={true}
            />
            <Box sx={{ cursor: 'pointer', marginLeft: '-25px' }} onClick={onSwitchChain}>
              <FlipIcon width={25} height={17} />
            </Box>
            <XChainSelector
              label="to"
              chainId={bridgeDirection.to}
              setChainId={c => onChainSelection(Field.TO, c)}
              currency={currencyToBridge}
              width={width}
              containerRef={ref.current}
            />
          </Flex>

          <Typography as="div" mb={-1} textAlign="right" hidden={!account}>
            <Trans>Wallet:</Trans>{' '}
            {`${selectedTokenWalletBalance?.toFixed(4, { groupSeparator: ',' }) ?? 0} ${formatSymbol(
              currencyToBridge?.symbol,
            )}`}
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
              showCrossChainBreakdown={false}
              selectorType={SelectorType.BRIDGE}
            />
          </Flex>

          <Flex style={{ position: 'relative' }}>
            <AddressInputPanel
              value={recipient || ''}
              onUserInput={onAddressInput}
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
              <Button
                onClick={handleSubmit}
                disabled={
                  !!errorMessage || !isValid || !canBridge || (stellarValidation ? !stellarValidation?.ok : false)
                }
              >
                {errorMessage ? errorMessage : <Trans>Transfer</Trans>}
              </Button>
            ) : (
              <Button onClick={handleSubmit}>{<Trans>Transfer</Trans>}</Button>
            )}
          </Flex>

          {stellarValidation?.ok === false && stellarValidation.error && recipient && (
            <Flex alignItems="center" justifyContent="center" mt={2} flexDirection="column">
              <StellarSponsorshipModal text={'Activate your Stellar wallet.'} address={recipient} />
            </Flex>
          )}

          {!canBridge && maximumBridgeAmount && (
            <BridgeLimitWarning limitAmount={maximumBridgeAmount} onLimitAmountClick={handleMaximumBridgeAmountClick} />
          )}

          <SolanaAccountExistenceWarning
            destinationChainId={bridgeDirection.to}
            currencyAmount={currencyAmountToBridge}
            recipient={recipient ?? ''}
            onActivate={() => {
              onUserInput('0.002');
            }}
          />
        </AutoColumn>
      </BrightPanel>
    </>
  );
}
