import { Button } from '@/app/components/Button';
import { ChainLogo } from '@/app/components/ChainLogo';
import { UnderlineTextWithArrow } from '@/app/components/DropdownText';
import { BoxPanel } from '@/app/components/Panel';
import { DropdownPopper } from '@/app/components/Popover';
import CancelSearchButton from '@/app/components/SearchModal/CancelSearchButton';
import { SearchWrap } from '@/app/components/SearchModal/CurrencySearch';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { MouseoverTooltip } from '@/app/components/Tooltip';
import { Typography } from '@/app/theme';
import useIntentProvider from '@/hooks/useIntentProvider';
import { ALLOWED_XCHAIN_IDS } from '@/lib/intent';
import { intentService } from '@/lib/intent';
import { XChainId } from '@balancednetwork/sdk-core';
import { xChainMap, xTokenMap } from '@balancednetwork/xwagmi';
import { Result } from 'icon-intents-sdk';
import { SwapOrder } from 'icon-intents-sdk';
import React, { useState, useEffect } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

enum TransactionStatus {
  None = 'none',
  Signing = 'signing',
  Success = 'success',
}

const CopyIcon =
  'data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z" stroke="%232fccdc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z" stroke="%232fccdc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const ChainItemWrap = styled(Flex)`
  transition: color 0.3s ease;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.bg2};
  }
`;

const ChainSelectorWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  position: relative;
  transform: translateY(1px);
`;

const ChainIcon = styled(ChainLogo)`
  vertical-align: middle;
`;

const InlineChainSelector = styled(Flex)`
  display: inline-flex;
  align-items: center;
  height: 20px;
`;

const ResultBox = styled(Box)`
  background-color: ${({ theme }) => theme.colors.bg2};
  border-radius: 8px;
  padding: 24px;
  
  pre {
    font-size: 12px;
    color: white;
    overflow: auto;
    max-height: 300px;
  }
`;

const CopyButton = styled.div`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  
  &:hover {
    opacity: 0.8;
    filter: brightness(0.9);
  }
  
  img {
    transition: filter 0.2s ease;
  }
  
  &:hover img {
    filter: hue-rotate(-5deg) saturate(1.2);
  }
`;

const DetailHeader = styled(Flex)`
  position: relative;
  margin-bottom: 16px;
  justify-content: space-between;
  align-items: center;
`;

export function IntentCheckPage() {
  const [selectedChain, setSelectedChain] = useState<XChainId>(ALLOWED_XCHAIN_IDS[0]);
  const [isOpen, setOpen] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [intentOrder, setIntentOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const arrowRef = React.useRef(null);
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.None);
  const [isChecking, setIsChecking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { data: intentProvider } = useIntentProvider(xTokenMap[selectedChain]?.[0]);

  const handleTxHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTxHash = e.target.value;
    setTxHash(newTxHash);
  };

  useEffect(() => {
    // Reset states when txHash is cleared
    if (!txHash) {
      setIntentOrder(null);
      setError(null);
      setStatus(TransactionStatus.None);
    }
  }, [txHash]);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(!isOpen);
    if (!anchor) {
      setAnchor(arrowRef.current);
    }
  };

  const handleChainSelect = (chainId: XChainId) => {
    setSelectedChain(chainId);
    setOpen(false);
    setIntentOrder(null);
    setError(null);
  };

  const handleCheck = async () => {
    if (!txHash || !intentProvider) {
      setError('Please enter a transaction hash and ensure your wallet is connected');
      return;
    }

    try {
      setIsChecking(true);
      setError(null);
      setIntentOrder(null);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000);
      });

      const checkPromise = intentService.getOrder(txHash, xChainMap[selectedChain].intentChainId!, intentProvider);

      const intentResult = (await Promise.race([checkPromise, timeoutPromise])) as Result<SwapOrder>;

      if (!intentResult.ok) {
        setError((intentResult.error as any)?.message || 'Failed to fetch intent order');
        return;
      }

      setIntentOrder(intentResult.value);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch intent order';
      setError(errorMessage);
      console.error('Error fetching intent order:', e);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCancel = async () => {
    if (!intentOrder.id || !intentProvider) {
      setError('No order found to cancel or wallet not connected');
      return;
    }

    setStatus(TransactionStatus.Signing);
    try {
      const result = await intentService.cancelIntentOrder(
        intentOrder.id,
        xChainMap[selectedChain].intentChainId!,
        intentProvider,
      );

      if (result.ok) {
        setStatus(TransactionStatus.Success);
        setIntentOrder(null);
      } else {
        setError((result.error as any)?.message || 'Failed to cancel order');
        setStatus(TransactionStatus.None);
      }
    } catch (e) {
      console.error('Error canceling order:', e);
      setError('Failed to cancel order');
      setStatus(TransactionStatus.None);
    }
  };

  const isCancelDisabled = !intentOrder || status === TransactionStatus.Signing || status === TransactionStatus.Success;

  const handleCopyDetails = async () => {
    if (intentOrder) {
      await navigator.clipboard.writeText(JSON.stringify(intentOrder, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Flex flexDirection="column" width="100%" alignItems="center" mt={4}>
      <BoxPanel bg="bg3" width="100%" maxWidth="600px" p={4}>
        <Typography variant="h2" mb={3}>
          Intent check
        </Typography>

        <Box mb={4}>
          <Flex alignItems="center">
            <Typography>Check an intent order on</Typography>
            <ChainSelectorWrapper>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <div>
                  <UnderlineTextWithArrow
                    text={
                      <InlineChainSelector>
                        <ChainIcon chain={xChainMap[selectedChain]} size={'16'} />
                        <Typography ml={1}>{xChainMap[selectedChain].name}</Typography>
                      </InlineChainSelector>
                    }
                    onClick={handleToggle}
                    arrowRef={arrowRef}
                  />

                  <DropdownPopper
                    show={isOpen}
                    anchorEl={anchor}
                    arrowEl={arrowRef.current}
                    placement="bottom"
                    offset={[0, 9]}
                  >
                    <Box p={2} minWidth="200px">
                      {ALLOWED_XCHAIN_IDS.map(chainId => (
                        <ChainItemWrap key={chainId} onClick={() => handleChainSelect(chainId)}>
                          <ChainLogo chain={xChainMap[chainId]} size={'16'} />
                          <Typography ml={2}>{xChainMap[chainId].name}</Typography>
                        </ChainItemWrap>
                      ))}
                    </Box>
                  </DropdownPopper>
                </div>
              </ClickAwayListener>
            </ChainSelectorWrapper>
          </Flex>
        </Box>

        <Box mb={5}>
          <SearchWrap>
            <SearchInput
              value={txHash}
              onChange={handleTxHashChange}
              placeholder="Enter transaction hash..."
              style={{ paddingRight: '35px' }}
            />
            <CancelSearchButton isActive={txHash.length > 0} onClick={() => setTxHash('')} />
          </SearchWrap>
        </Box>

        <Flex justifyContent="space-between">
          <Button onClick={handleCheck} disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Check order'}
          </Button>
          <Button variant="alert" onClick={handleCancel} disabled={isCancelDisabled} warning={true}>
            {status === TransactionStatus.Signing ? 'Canceling...' : 'Cancel order'}
          </Button>
        </Flex>

        {error && (
          <Typography color="alert" mt={5}>
            {error}
          </Typography>
        )}

        {status === TransactionStatus.Success && (
          <Typography color="primary" mt={5} textAlign="center">
            Order successfully canceled
          </Typography>
        )}

        {intentOrder && (
          <ResultBox mt={4}>
            <DetailHeader>
              <Typography variant="h3">Intent order details</Typography>
              <MouseoverTooltip text={isCopied ? 'Copied!' : 'Copy details'} placement="top" noArrowAndBorder>
                <CopyButton onClick={handleCopyDetails}>
                  <img src={CopyIcon} alt="Copy" width="20" height="20" />
                </CopyButton>
              </MouseoverTooltip>
            </DetailHeader>
            <pre>{JSON.stringify(intentOrder, null, 2)}</pre>
          </ResultBox>
        )}
      </BoxPanel>
    </Flex>
  );
}
