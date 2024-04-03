import React from 'react';

import { CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';

import { getNetworkDisplayName } from 'app/_xcall/utils';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import QuestionHelper, { QuestionWrapper } from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import FlipIcon from 'assets/icons/horizontal-flip.svg';
import { useBridgeActionHandlers, useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from 'store/bridge/hooks';
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
import { useWalletModalToggle } from 'store/application/hooks';
import { useXCallFee } from 'app/_xcall/hooks';
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

export const ChainWrap = styled(Flex)`
  align-items: center;
  padding: 3px 12px 4px;
  transform: translateY(-15px);
  // border-radius: 0 0 10px 10px;
  justify-content: space-between;
`;

export default function BridgeTransferForm({ openModal }) {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();
  const crossChainWallet = useCrossChainWalletBalances();

  const bridgeState = useBridgeState();
  const { currency: currencyToBridge, recipient, typedValue } = bridgeState;
  const { onChangeRecipient, onCurrencySelection, onUserInput, onChainSelection, onSwitchChain, onPercentSelection } =
    useBridgeActionHandlers();
  const bridgeDirection = useBridgeDirection();
  const percentAmount = bridgeState[Field.FROM].percent;

  const signedInWallets = useSignedInWallets();
  const { formattedXCallFee } = useXCallFee(bridgeDirection.from);
  const setNotPristine = useSetNotPristine();
  const toggleWalletModal = useWalletModalToggle();

  const handleInputPercentSelect = (percent: number) => {
    const currencyAmount = currencyToBridge && crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    if (currencyAmount) {
      onPercentSelection(Field.FROM, percent, currencyAmount.multiply(new Fraction(percent, 100)).toFixed());
    }
  };

  React.useEffect(() => {
    const destinationWallet = signedInWallets.find(wallet => wallet.chain === bridgeDirection.to);
    if (destinationWallet) {
      onChangeRecipient(destinationWallet.address);
    } else {
      onChangeRecipient(null);
    }
  }, [bridgeDirection.to, onChangeRecipient, signedInWallets]);

  // TODO: understand the purpose of this useEffect
  React.useEffect(() => {
    return () => setNotPristine();
  }, [setNotPristine]);

  const { errorMessage, isAvailable, selectedTokenWalletBalance } = useDerivedBridgeInfo();

  const handleSubmit = async () => {
    if (signedInWallets.some(wallet => wallet.chain === bridgeDirection.from)) {
      openModal();
    } else {
      toggleWalletModal();
    }
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Typography variant="h2">
            <Trans>Bridge</Trans>
          </Typography>
          <Flex width="100%" alignItems="center" justifyContent="space-between">
            <ChainSelector label="from" chain={bridgeDirection.from} setChain={c => onChainSelection(Field.FROM, c)} />
            <Box sx={{ cursor: 'pointer', marginLeft: '-25px' }} onClick={onSwitchChain}>
              <FlipIcon width={25} height={17} />
            </Box>
            <ChainSelector label="to" chain={bridgeDirection.to} setChain={c => onChainSelection(Field.TO, c)} />
          </Flex>

          <Flex width="100%" alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>Send</Trans>
            </Typography>
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
          </Flex>
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
          <ChainWrap>
            <Typography mr={1} lineHeight="1.7">
              On {getNetworkDisplayName(bridgeDirection.from)}
            </Typography>
          </ChainWrap>

          <Flex style={{ position: 'relative' }}>
            <AddressInputPanel label="To" value={recipient || ''} onUserInput={onChangeRecipient} drivenOnly={true} />
            {!recipient && !signedInWallets.find(wallet => wallet.chain === bridgeDirection.to)?.address && (
              <ConnectWrap>
                <CrossChainConnectWallet chain={bridgeDirection.to} />
              </ConnectWrap>
            )}
          </Flex>
          <ChainWrap>
            <Typography mr={1} lineHeight="1.7">
              On {getNetworkDisplayName(bridgeDirection.to)}
            </Typography>
          </ChainWrap>
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

            <Typography color="text">{formattedXCallFee && formattedXCallFee}</Typography>
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
