import React from 'react';

import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SUPPORTED_PAIRS } from 'constants/currency';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { usePoolPair, useSelectedPoolRate } from 'store/pool/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { formatBigNumber } from 'utils';

import { depositMessage, supplyMessage } from './utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  minHeight?: number | false;
  maxHeight?: number;
  initialFocusRef?: React.RefObject<any>;
  children?: React.ReactNode;
  className?: string;
}

export default function SupplyLiquidityModal({ isOpen, onClose }: ModalProps) {
  const { account } = useIconReact();

  // modal

  const selectedPair = usePoolPair();

  const selectedPairRatio = useSelectedPoolRate();

  const addTransaction = useTransactionAdder();

  const sendBnUSDToDex = () => {
    return bnJs
      .eject({ account: account })
      .bnUSD.dexDeposit(parsedAmounts[Field.CURRENCY_B])
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: depositMessage(selectedPair.quoteCurrencyKey, selectedPair.pair).pendingMessage,
            summary: depositMessage(selectedPair.quoteCurrencyKey, selectedPair.pair).successMessage,
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const sendSICXToDex = () => {
    return bnJs
      .eject({ account: account })
      .sICX.dexDeposit(parsedAmounts[Field.CURRENCY_B].multipliedBy(new BigNumber(1).dividedBy(selectedPairRatio)))
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: depositMessage(selectedPair.baseCurrencyKey, selectedPair.pair).pendingMessage,
            summary: depositMessage(selectedPair.baseCurrencyKey, selectedPair.pair).successMessage,
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const sendBALNToDex = () => {
    return bnJs
      .eject({ account: account })
      .Baln.dexDeposit(parsedAmounts[Field.CURRENCY_B].multipliedBy(new BigNumber(1).dividedBy(selectedPairRatio)))
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: depositMessage(selectedPair.baseCurrencyKey, selectedPair.pair).pendingMessage,
            summary: depositMessage(selectedPair.baseCurrencyKey, selectedPair.pair).successMessage,
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const sendICXToDex = () => {
    return bnJs
      .eject({ account: account })
      .Dex.transferICX(parsedAmounts[Field.CURRENCY_A])
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: supplyMessage(
              formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ).pendingMessage,
            summary: supplyMessage(
              formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ).successMessage,
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleSupplyInputDepositConfirm = () => {
    if (!account) return;
    switch (selectedPair.pair) {
      case SUPPORTED_PAIRS[0].pair: {
        sendSICXToDex().then(() => {});
        break;
      }
      case SUPPORTED_PAIRS[1].pair: {
        sendBALNToDex().then(() => {});
        break;
      }
      case SUPPORTED_PAIRS[2].pair: {
        sendICXToDex().then(() => {});
        break;
      }
      default: {
      }
    }
  };

  const handleSupplyOutputDepositConfirm = () => {
    if (!account) return;
    switch (selectedPair.pair) {
      case SUPPORTED_PAIRS[0].pair: {
        sendBnUSDToDex().then(() => {});
        break;
      }
      case SUPPORTED_PAIRS[1].pair: {
        sendBnUSDToDex().then(() => {});
        break;
      }
      default: {
      }
    }
  };

  const supply_sICXbnUSD = () => {
    bnJs
      .eject({ account: account })
      .Dex.add(
        parsedAmounts[Field.CURRENCY_A],
        parsedAmounts[Field.CURRENCY_B],
        selectedPairRatio,
        bnJs.sICX.address,
        bnJs.bnUSD.address,
      )
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: supplyMessage(
              formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ).pendingMessage,
            summary: supplyMessage(
              formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ).successMessage,
          },
        );
        onClose();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const supplyBALNbnUSD = () => {
    bnJs
      .eject({ account: account })
      .Dex.add(
        parsedAmounts[Field.CURRENCY_A],
        parsedAmounts[Field.CURRENCY_B],
        selectedPairRatio,
        bnJs.Baln.address,
        bnJs.bnUSD.address,
      )
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: supplyMessage(
              formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ).pendingMessage,
            summary: supplyMessage(
              formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ).successMessage,
          },
        );
        onClose();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleSupplyConfirm = () => {
    if (!account) return;
    switch (selectedPair.pair) {
      case SUPPORTED_PAIRS[0].pair: {
        supply_sICXbnUSD();
        break;
      }
      case SUPPORTED_PAIRS[1].pair: {
        supplyBALNbnUSD();
        break;
      }
      case SUPPORTED_PAIRS[2].pair: {
        sendICXToDex().then(() => {});
        break;
      }
      default: {
      }
    }
  };

  const {
    // currencies,
    // pair,
    // pairState,
    // currencyBalances,
    parsedAmounts,
    // price,
    // liquidityMinted,
    // poolTokenPercentage,
    // error
  } = useDerivedMintInfo();

  return (
    <Modal isOpen={isOpen} onDismiss={() => undefined}>
      <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
        <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
          Supply liquidity?
        </Typography>

        <Typography
          variant="p"
          textAlign="center"
          mb={4}
          style={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? { display: 'none' } : {}}
        >
          Send each asset to the pool, <br />
          then click Supply
        </Typography>

        <Flex alignItems="center" mb={4}>
          <Box width={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? 1 : 1 / 2}>
            <Typography
              variant="p"
              fontWeight="bold"
              textAlign={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? 'center' : 'right'}
            >
              {formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'ratio')} {selectedPair.baseCurrencyKey}
            </Typography>
          </Box>
          <Box width={1 / 2} style={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? { display: 'none' } : {}}>
            <SupplyButton ml={3} onClick={handleSupplyInputDepositConfirm}>
              Send
            </SupplyButton>
          </Box>
        </Flex>

        <Flex
          alignItems="center"
          mb={4}
          style={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? { display: 'none' } : {}}
        >
          <Box width={1 / 2}>
            <Typography variant="p" fontWeight="bold" textAlign="right">
              {formatBigNumber(parsedAmounts[Field.CURRENCY_B], 'ratio')} {selectedPair.quoteCurrencyKey}
            </Typography>
          </Box>
          <Box width={1 / 2}>
            <SupplyButton ml={3} onClick={handleSupplyOutputDepositConfirm}>
              Send
            </SupplyButton>
          </Box>
        </Flex>

        <Typography textAlign="center">
          {selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? (
            <>Your ICX will be locked in the pool for the first 24 hours.</>
          ) : (
            <>
              Your ICX will be staked, and your
              <br /> assets will be locked for 24 hours.
            </>
          )}
        </Typography>

        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          <TextButton onClick={onClose}>Cancel</TextButton>
          <Button onClick={handleSupplyConfirm}>Supply</Button>
        </Flex>
      </Flex>
    </Modal>
  );
}

const SupplyButton = styled(Button)`
  padding: 5px 10px;
  font-size: 12px;
`;
