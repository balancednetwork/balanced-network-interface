import React from 'react';

import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { useIconXcallFee } from 'app/_xcall/_icon/eventHandlers';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useArchwayXcallFee } from 'app/_xcall/archway/eventHandler';
import { useARCH } from 'app/_xcall/archway/tokens';
import { SupportedXCallChains } from 'app/_xcall/types';
import { getCrossChainTokenBySymbol } from 'app/_xcall/utils';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import QuestionHelper, { QuestionWrapper } from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import FlipIcon from 'assets/icons/horizontal-flip.svg';
import { useBridgeDirection, useSetBridgeDestination, useSetBridgeOrigin } from 'store/bridge/hooks';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { useSetNotPristine } from 'store/xCall/hooks';

import AddressInputPanel from '../AddressInputPanel';
import { Button } from '../Button';
import CrossChainConnectWallet from '../CrossChainWalletConnect';
import { CurrencySelectionType } from '../SearchModal/CurrencySearch';
import { AutoColumn } from '../trade/SwapPanel';
import { BrightPanel } from '../trade/utils';
import { IBCDescription } from '../XCallDescription';
import ChainSelector from './ChainSelector';
import { isDenomAsset } from 'app/_xcall/archway/utils';
import { useWalletModalToggle } from 'store/application/hooks';

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

export default function BridgeTransferForm({ onSubmit }) {
  const { account } = useIconReact();
  const { address: accountArch, signingClient } = useArchwayContext();
  const crossChainWallet = useCrossChainWalletBalances();

  // create useBridgeState hook
  const bridgeDirection = useBridgeDirection();
  const setBridgeOrigin = useSetBridgeOrigin();
  const setBridgeDestination = useSetBridgeDestination();
  const [currencyToBridge, setCurrencyToBridge] = React.useState<Currency | undefined>();
  const [amountToBridge, setAmountToBridge] = React.useState<string>('');
  const [destinationAddress, setDestinationAddress] = React.useState<string>('');
  const [withdrawNative, setWithdrawNative] = React.useState<boolean | undefined>();
  const [percentAmount, setPercentAmount] = React.useState<number | undefined>();
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  const ARCH = useARCH();
  const signedInWallets = useSignedInWallets();
  const { data: archwayXcallFees } = useArchwayXcallFee();
  const { data: iconXcallFees } = useIconXcallFee();
  const setNotPristine = useSetNotPristine();
  const toggleWalletModal = useWalletModalToggle();

  const handleSetOriginChain = React.useCallback(
    (chain: SupportedXCallChains) => {
      if (chain === bridgeDirection.to) {
        setBridgeDestination(bridgeDirection.from);
      }
      setBridgeOrigin(chain);
      setCurrencyToBridge(undefined);
    },
    [bridgeDirection.from, bridgeDirection.to, setBridgeDestination, setBridgeOrigin],
  );

  const handleSetDestinationChain = React.useCallback(
    (chain: SupportedXCallChains) => {
      if (chain === bridgeDirection.from) {
        setBridgeOrigin(bridgeDirection.to);
      }
      setBridgeDestination(chain);
      setCurrencyToBridge(undefined);
    },
    [bridgeDirection.from, bridgeDirection.to, setBridgeDestination, setBridgeOrigin],
  );

  const handleTypeInput = (value: string) => {
    setAmountToBridge(value);
    setPercentAmount(undefined);
  };

  const handleInputSelect = (currency: Currency) => {
    setWithdrawNative(undefined);
    setCurrencyToBridge(currency);
  };

  const handleInputPercentSelect = (percent: number) => {
    setPercentAmount(percent);
  };

  function getPercentAmount(percent: number, balance: CurrencyAmount<Currency>) {
    return balance.multiply(new Fraction(percent, 100)).toFixed();
  }

  React.useEffect(() => {
    const currencyAmount = currencyToBridge && crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    if (percentAmount && currencyAmount) {
      setAmountToBridge(getPercentAmount(percentAmount, currencyAmount));
    }
  }, [bridgeDirection.from, crossChainWallet, currencyToBridge, percentAmount]);

  const currencyAmountToBridge = React.useMemo(() => {
    if (currencyToBridge && amountToBridge && !Number.isNaN(parseFloat(amountToBridge))) {
      return CurrencyAmount.fromRawAmount(
        currencyToBridge.wrapped,
        new BigNumber(amountToBridge).times(10 ** currencyToBridge.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [amountToBridge, currencyToBridge]);

  const parsedAmount = React.useMemo(() => {
    const currencyAmount = currencyToBridge && crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    if (currencyAmount && percentAmount) {
      return getPercentAmount(percentAmount, currencyAmount);
    } else {
      return amountToBridge || '';
    }
  }, [amountToBridge, bridgeDirection.from, crossChainWallet, currencyToBridge, percentAmount]);

  const handleDestinationAddressInput = (value: string) => {
    setDestinationAddress(value);
  };

  React.useEffect(() => {
    const destinationWallet = signedInWallets.find(wallet => wallet.chain === bridgeDirection.to);
    if (destinationWallet) {
      setDestinationAddress(destinationWallet.address);
    } else {
      setDestinationAddress('');
    }
  }, [bridgeDirection.to, setDestinationAddress, signedInWallets]);

  // TODO: understand the purpose of this useEffect
  React.useEffect(() => {
    return () => setNotPristine();
  }, [setNotPristine]);

  const isBridgeButtonAvailable = React.useMemo(() => {
    if (!signedInWallets.some(wallet => wallet.chain === bridgeDirection.to)) return false;
    if (destinationAddress === '') return false;

    return true;
  }, [bridgeDirection.to, destinationAddress, signedInWallets]);

  React.useEffect(() => {
    if (currencyAmountToBridge) {
      if (currencyAmountToBridge.equalTo(0)) {
        setErrorMessage(t`Enter amount`);
      } else {
        if (
          signedInWallets.some(
            wallet =>
              wallet.chain === bridgeDirection.from &&
              (!crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address] ||
                crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address]?.lessThan(
                  currencyAmountToBridge,
                )),
          )
        ) {
          setErrorMessage(t`Insufficient ${currencyAmountToBridge.currency.symbol}`);
        } else {
          setErrorMessage(undefined);
        }
      }
    } else {
      setErrorMessage(t`Enter amount`);
    }
  }, [bridgeDirection.from, crossChainWallet, currencyAmountToBridge, setErrorMessage, signedInWallets]);

  const selectedTokenWalletBalance = React.useMemo(() => {
    if (currencyToBridge) {
      return crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    }
  }, [bridgeDirection.from, crossChainWallet, currencyToBridge]);

  const handleSwitch = () => {
    const from = bridgeDirection.from;
    const to = bridgeDirection.to;
    const crossChainCurrency = getCrossChainTokenBySymbol(to, currencyToBridge?.symbol);
    handleSetOriginChain(to);
    handleSetDestinationChain(from);
    crossChainCurrency && handleInputSelect(crossChainCurrency);
  };

  const handleSubmit = async () => {
    if (signedInWallets.some(wallet => wallet.chain === bridgeDirection.from)) {
      const isDenom = currencyAmountToBridge && isDenomAsset(currencyAmountToBridge.currency);
      onSubmit({
        bridgeDirection,
        currencyToBridge,
        amountToBridge,
        destinationAddress,
        withdrawNative,
        percentAmount,
        currencyAmountToBridge,
        isDenom,
      });
    } else {
      toggleWalletModal();
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
            <ChainSelector label="from" chain={bridgeDirection.from} setChain={handleSetOriginChain} />
            <Box sx={{ cursor: 'pointer', marginLeft: '-25px' }} onClick={handleSwitch}>
              <FlipIcon width={25} height={17} />
            </Box>
            <ChainSelector label="to" chain={bridgeDirection.to} setChain={handleSetDestinationChain} />
          </Flex>

          <Typography
            as="div"
            mb={-1}
            textAlign="right"
            hidden={
              (bridgeDirection.from === 'icon' && !account) || (bridgeDirection.from === 'archway' && !accountArch)
            }
          >
            <Trans>Wallet:</Trans>{' '}
            {`${
              selectedTokenWalletBalance?.toFixed(4, {
                groupSeparator: ',',
              }) ?? 0
            } 
                ${currencyToBridge?.symbol}`}
          </Typography>

          <Flex>
            <CurrencyInputPanel
              account={account}
              value={parsedAmount}
              // currency={currencyToBridge || bnUSD[NETWORK_ID]}
              currency={currencyToBridge}
              selectedCurrency={currencyToBridge}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={!!account ? handleInputPercentSelect : undefined}
              percent={percentAmount}
              currencySelectionType={CurrencySelectionType.BRIDGE}
              showCommunityListControl={false}
            />
          </Flex>

          <Flex style={{ position: 'relative' }}>
            <AddressInputPanel
              value={destinationAddress}
              onUserInput={handleDestinationAddressInput}
              drivenOnly={true}
            />
            {!destinationAddress && !signedInWallets.find(wallet => wallet.chain === bridgeDirection.to)?.address && (
              <ConnectWrap>
                <CrossChainConnectWallet chain={bridgeDirection.to} />
              </ConnectWrap>
            )}
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Bridge</Trans>
            </Typography>

            <Typography color="text">
              IBC + xCall
              <QuestionWrapper style={{ marginLeft: '3px', transform: 'translateY(1px)' }}>
                <QuestionHelper width={300} text={<IBCDescription />}></QuestionHelper>
              </QuestionWrapper>
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Fee</Trans>
            </Typography>

            <Typography color="text">
              {bridgeDirection.from === 'icon' && iconXcallFees && (
                <>{(parseInt(iconXcallFees.rollback, 16) / 10 ** 18).toPrecision(3)} ICX</>
              )}
              {bridgeDirection.from === 'archway' && archwayXcallFees && (
                <>{(Number(archwayXcallFees.rollback) / 10 ** ARCH.decimals).toPrecision(3)} ARCH</>
              )}
            </Typography>
          </Flex>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Transfer time</Trans>
            </Typography>

            <Typography color="text">~ 15s</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={4}>
            <Button onClick={handleSubmit} disabled={!isBridgeButtonAvailable || !!errorMessage}>
              {errorMessage ? errorMessage : <Trans>Transfer</Trans>}
            </Button>
          </Flex>
        </AutoColumn>
      </BrightPanel>
    </>
  );
}
