import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Modal from 'app/components/Modal';
import LiquiditySelect from 'app/components/trade/LiquiditySelect';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST, SUPPORTED_PAIRS } from 'constants/currency';
import { Field } from 'store/mint/actions';
import { useMintState, useDerivedMintInfo, useMintActionHandlers } from 'store/mint/hooks';
import { usePool, usePoolPair, useSelectedPoolRate } from 'store/pool/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import LPDescription from './LPDescription';
import { SectionPanel, BrightPanel, depositMessage, supplyMessage } from './utils';

const useSelectedPairBalances = () => {
  const selectedPair = usePoolPair();
  const balances = useWalletBalances();

  return {
    base: balances[selectedPair.baseCurrencyKey],
    quote: balances[selectedPair.quoteCurrencyKey],
  };
};

const ZERO = new BigNumber(0);

const useSelectedPairSuppliedMaxAmount = () => {
  const selectedPair = usePoolPair();
  const balances = useWalletBalances();
  const pool = usePool(selectedPair.poolId);

  if (pool) {
    return BigNumber.min(balances[pool?.baseCurrencyKey].times(pool?.rate), balances[pool?.quoteCurrencyKey]);
  } else {
    return ZERO;
  }
};

export default function LPPanel() {
  const { account } = useIconReact();

  // modal
  const [showSupplyConfirm, setShowSupplyConfirm] = React.useState(false);

  const handleSupplyConfirmDismiss = () => {
    setShowSupplyConfirm(false);
  };

  const handleSupply = () => {
    setShowSupplyConfirm(true);
  };

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
        setShowSupplyConfirm(false);
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
        setShowSupplyConfirm(false);
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

  const walletBalanceSelected = useSelectedPairBalances();

  const maxAmountSupply = useSelectedPairSuppliedMaxAmount();

  const handleSlider = (values: string[], handle: number) => {
    onFieldAInput(values[handle]);
  };

  const { independentField, typedValue, otherTypedValue } = useMintState();
  const {
    dependentField,
    // currencies,
    // pair,
    // pairState,
    // currencyBalances,
    parsedAmounts,
    // price,
    noLiquidity,
    // liquidityMinted,
    // poolTokenPercentage,
    // error
  } = useDerivedMintInfo();

  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity);

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity
      ? otherTypedValue
      : parsedAmounts[dependentField].isZero()
      ? ''
      : parsedAmounts[dependentField].toFixed(6),
  };

  return (
    <>
      <SectionPanel bg="bg2">
        <BrightPanel bg="bg3" p={7} flexDirection="column" alignItems="stretch" flex={1}>
          <Flex alignItems="flex-end">
            <Typography variant="h2">Supply:&nbsp;</Typography>
            <LiquiditySelect />
          </Flex>

          <Flex mt={3}>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              showMaxButton={false}
              currency={CURRENCY_LIST[selectedPair.baseCurrencyKey.toLowerCase()]}
              onUserInput={onFieldAInput}
              id="supply-liquidity-input-token-a"
            />
          </Flex>

          <Flex mt={3} style={selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx' ? { display: 'none' } : {}}>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_B]}
              showMaxButton={false}
              currency={CURRENCY_LIST[selectedPair.quoteCurrencyKey.toLowerCase()]}
              onUserInput={onFieldBInput}
              id="supply-liquidity-input-token-b"
            />
          </Flex>

          <Typography mt={3} textAlign="right">
            Wallet: {formatBigNumber(walletBalanceSelected.base, 'currency')} {selectedPair.baseCurrencyKey}
            {selectedPair === SUPPORTED_PAIRS[2]
              ? ''
              : ' / ' + formatBigNumber(walletBalanceSelected.quote, 'currency') + ' ' + selectedPair.quoteCurrencyKey}
          </Typography>

          <Box mt={5}>
            <Nouislider
              id="slider-supply"
              start={[0]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [maxAmountSupply.dp(2).toNumber()],
              }}
              onSlide={handleSlider}
            />
          </Box>

          <Flex justifyContent="center">
            <Button color="primary" marginTop={5} onClick={handleSupply}>
              Supply
            </Button>
          </Flex>
        </BrightPanel>

        <LPDescription />
      </SectionPanel>

      <Modal isOpen={showSupplyConfirm} onDismiss={handleSupplyConfirmDismiss}>
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
            <TextButton onClick={handleSupplyConfirmDismiss}>Cancel</TextButton>
            <Button onClick={handleSupplyConfirm}>Supply</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}

const SupplyButton = styled(Button)`
  padding: 5px 10px;
  font-size: 12px;
`;
