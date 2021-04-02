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
import { CURRENCYLIST, SupportedPairs } from 'constants/currency';
import { useLiquiditySupply, useChangeLiquiditySupply } from 'store/liquidity/hooks';
import { usePoolPair } from 'store/pool/hooks';
import { useRatioValue } from 'store/ratio/hooks';
import { useReward } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalanceValue, useChangeWalletBalance } from 'store/wallet/hooks';

import { SectionPanel, BrightPanel, depositMessage, supplyMessage } from './utils';

const StyledDL = styled.dl`
  margin: 15px 0 15px 0;
  text-align: center;

  > dd {
    margin-left: 0;
  }
`;

const SupplyButton = styled(Button)`
  padding: 5px 10px;
  font-size: 12px;
`;

export default function LPPanel() {
  const { account } = useIconReact();
  const walletBalance = useWalletBalanceValue();
  const liquiditySupply = useLiquiditySupply();
  const poolReward = useReward();
  const changeLiquiditySupply = useChangeLiquiditySupply();

  const ICXliquiditySupply = liquiditySupply.ICXBalance || new BigNumber(0);

  const changeWalletBalance = useChangeWalletBalance();

  const [showSupplyConfirm, setShowSupplyConfirm] = React.useState(false);

  const handleSupplyConfirmDismiss = () => {
    setShowSupplyConfirm(false);
  };

  const handleSupply = () => {
    setShowSupplyConfirm(true);
  };

  const selectedPair = usePoolPair();
  const ratio = useRatioValue();

  const [supplyInputAmount, setSupplyInputAmount] = React.useState('0');

  const [supplyOutputAmount, setSupplyOutputAmount] = React.useState('0');

  const handleTypeInput = (val: string) => {
    setSupplyInputAmount(val);
    let outputAmount = new BigNumber(val).multipliedBy(getRatioByPair());
    if (outputAmount.isNaN()) outputAmount = new BigNumber(0);
    setSupplyOutputAmount(outputAmount.toString());
  };

  const getRatioByPair = () => {
    switch (selectedPair.pair) {
      case SupportedPairs[0].pair: {
        return ratio.sICXbnUSDratio;
      }
      case SupportedPairs[1].pair: {
        return ratio.BALNbnUSDratio;
      }
      case SupportedPairs[2].pair: {
        return ratio.sICXICXratio;
      }
    }
    return 0;
  };

  const handleTypeOutput = (val: string) => {
    setSupplyOutputAmount(val);
    let inputAmount = new BigNumber(val).multipliedBy(new BigNumber(1).dividedBy(getRatioByPair()));
    if (inputAmount.isNaN()) inputAmount = new BigNumber(0);
    setSupplyInputAmount(inputAmount.toString());
  };

  const addTransaction = useTransactionAdder();

  const sendBnUSDToDex = () => {
    return bnJs
      .eject({ account: account })
      .bnUSD.dexDeposit(new BigNumber(supplyOutputAmount))
      .then(res => {
        console.log('res', res);
        addTransaction(
          { hash: res.result },
          { summary: depositMessage(selectedPair.quoteCurrencyKey, selectedPair.pair) },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const sendSICXToDex = () => {
    return bnJs
      .eject({ account: account })
      .sICX.dexDeposit(new BigNumber(supplyInputAmount))
      .then(res => {
        console.log('res', res);
        addTransaction(
          { hash: res.result },
          { summary: depositMessage(selectedPair.baseCurrencyKey, selectedPair.pair) },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const sendBALNToDex = () => {
    return bnJs
      .eject({ account: account })
      .Baln.dexDeposit(new BigNumber(supplyInputAmount))
      .then(res => {
        console.log('res', res);
        addTransaction(
          { hash: res.result },
          { summary: depositMessage(selectedPair.baseCurrencyKey, selectedPair.pair) },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const sendICXToDex = () => {
    return bnJs
      .eject({ account: account })
      .Dex.transferICX(new BigNumber(supplyInputAmount))
      .then(res => {
        console.log('res', res);
        addTransaction(
          { hash: res.result },
          {
            summary: supplyMessage(
              supplyInputAmount,
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ),
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
      case SupportedPairs[0].pair: {
        sendSICXToDex().then(() => {
          const new_sICXBalance = walletBalance.sICXbalance.minus(new BigNumber(supplyInputAmount));
          changeWalletBalance({
            sICXbalance: new_sICXBalance,
          });
        });
        break;
      }
      case SupportedPairs[1].pair: {
        sendBALNToDex().then(() => {
          const new_bnUSDBalance = walletBalance.bnUSDbalance.minus(new BigNumber(supplyInputAmount));
          changeWalletBalance({
            bnUSDbalance: new_bnUSDBalance,
          });
        });
        break;
      }
      case SupportedPairs[2].pair: {
        sendICXToDex().then(() => {
          const newICXBalance = walletBalance.ICXbalance.minus(new BigNumber(supplyInputAmount));
          changeWalletBalance({
            ICXbalance: newICXBalance,
          });
        });
        break;
      }
      default: {
        console.log('deposit input currency not yet supported');
      }
    }
  };

  const handleSupplyOutputDepositConfirm = () => {
    if (!account) return;
    switch (selectedPair.pair) {
      case SupportedPairs[0].pair: {
        sendBnUSDToDex().then(() => {
          const new_bnUSDBalance = walletBalance.bnUSDbalance.minus(new BigNumber(supplyOutputAmount));
          changeWalletBalance({
            bnUSDbalance: new_bnUSDBalance,
          });
        });
        break;
      }
      case SupportedPairs[1].pair: {
        sendBnUSDToDex().then(() => {
          const new_bnUSDBalance = walletBalance.bnUSDbalance.minus(new BigNumber(supplyOutputAmount));
          changeWalletBalance({
            bnUSDbalance: new_bnUSDBalance,
          });
        });
        break;
      }
      default: {
        console.log('deposit output currency not yet supported');
      }
    }
  };

  const supply_sICXbnUSD = () => {
    bnJs
      .eject({ account: account })
      .Dex.dexSupplysICXbnUSD(new BigNumber(supplyInputAmount), new BigNumber(supplyOutputAmount))
      .then(res => {
        console.log('supply_sICXbnUSD = ', res);
        addTransaction(
          { hash: res.result },
          {
            summary: supplyMessage(
              supplyInputAmount,
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ),
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const supplyBALNbnUSD = () => {
    bnJs
      .eject({ account: account })
      .Dex.supplyBALNbnUSD(new BigNumber(supplyInputAmount), new BigNumber(supplyOutputAmount))
      .then(res => {
        console.log('supplyBALNbnUSD = ', res);
        addTransaction(
          { hash: res.result },
          {
            summary: supplyMessage(
              supplyInputAmount,
              selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
            ),
          },
        );
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleSupplyConfirm = () => {
    if (!account) return;
    switch (selectedPair.pair) {
      case SupportedPairs[0].pair: {
        supply_sICXbnUSD();
        break;
      }
      case SupportedPairs[1].pair: {
        supplyBALNbnUSD();
        break;
      }
      case SupportedPairs[2].pair: {
        sendICXToDex().then(() => {
          changeLiquiditySupply({ ICXBalance: ICXliquiditySupply.plus(new BigNumber(supplyInputAmount)) });
        });
        break;
      }
      default: {
        console.log('deposit input currency not yet supported');
      }
    }
  };

  const [suppliedPairAmount, setSuppliedPairAmount] = React.useState({
    base: new BigNumber(0),
    quote: new BigNumber(0),
    baseSupply: new BigNumber(0),
    quoteSupply: new BigNumber(0),
    dailyReward: new BigNumber(0),
    poolTotalDailyReward: new BigNumber(0),
  });
  const [walletBalanceSelected, setWalletBalanceSelected] = React.useState({
    base: new BigNumber(0),
    quote: new BigNumber(0),
  });

  const getSuppliedPairAmount = React.useCallback(() => {
    switch (selectedPair.pair) {
      case SupportedPairs[0].pair: {
        let sICXbnUSDpoolDailyReward = poolReward.sICXbnUSDreward?.multipliedBy(
          poolReward.poolDailyReward || new BigNumber(0),
        );
        let sICXbnUSDSuppliedShare = liquiditySupply.sICXbnUSDBalance?.dividedBy(
          liquiditySupply.sICXbnUSDTotalSupply || new BigNumber(0),
        );
        let dailyReward = sICXbnUSDpoolDailyReward?.multipliedBy(sICXbnUSDSuppliedShare || new BigNumber(0));
        return {
          base: liquiditySupply.sICXSuppliedPoolsICXbnUSD || new BigNumber(0),
          quote: liquiditySupply.bnUSDSuppliedPoolsICXbnUSD || new BigNumber(0),
          baseSupply: liquiditySupply.sICXPoolsICXbnUSDTotal || new BigNumber(0),
          quoteSupply: liquiditySupply.bnUSDPoolsICXbnUSDTotal || new BigNumber(0),
          dailyReward: dailyReward || new BigNumber(0),
          poolTotalDailyReward: sICXbnUSDpoolDailyReward || new BigNumber(0),
        };
      }
      case SupportedPairs[1].pair: {
        let BALNbnUSDpoolDailyReward = poolReward.BALNbnUSDreward?.multipliedBy(
          poolReward.poolDailyReward || new BigNumber(0),
        );
        let BALNbnUSDSuppliedShare = liquiditySupply.BALNbnUSDBalance?.dividedBy(
          liquiditySupply.BALNbnUSDTotalSupply || new BigNumber(0),
        );
        let dailyReward = BALNbnUSDpoolDailyReward?.multipliedBy(BALNbnUSDSuppliedShare || new BigNumber(0));
        return {
          base: liquiditySupply.BALNSuppliedPoolBALNbnUSD || new BigNumber(0),
          quote: liquiditySupply.bnUSDSuppliedPoolBALNbnUSD || new BigNumber(0),
          baseSupply: liquiditySupply.BALNPoolBALNbnUSDTotal || new BigNumber(0),
          quoteSupply: liquiditySupply.bnUSDPoolBALNbnUSDTotal || new BigNumber(0),
          dailyReward: dailyReward || new BigNumber(0),
          poolTotalDailyReward: BALNbnUSDpoolDailyReward || new BigNumber(0),
        };
      }
      case SupportedPairs[2].pair: {
        let sICXICXpoolDailyReward = poolReward.sICXICXreward?.multipliedBy(
          poolReward.poolDailyReward || new BigNumber(0),
        );
        let sICXICXSuppliedShare = liquiditySupply.ICXBalance?.dividedBy(
          liquiditySupply.sICXICXTotalSupply || new BigNumber(0),
        );
        let dailyReward = sICXICXpoolDailyReward?.multipliedBy(sICXICXSuppliedShare || new BigNumber(0));
        return {
          base: new BigNumber(2),
          quote: new BigNumber(2),
          baseSupply: new BigNumber(0),
          quoteSupply: new BigNumber(0),
          dailyReward: dailyReward || new BigNumber(0),
          poolTotalDailyReward: sICXICXpoolDailyReward || new BigNumber(0),
        };
      }
      default: {
        return {
          base: new BigNumber(0),
          quote: new BigNumber(0),
          baseSupply: new BigNumber(0),
          quoteSupply: new BigNumber(0),
          dailyReward: new BigNumber(0),
          poolTotalDailyReward: new BigNumber(0),
        };
      }
    }
  }, [selectedPair, liquiditySupply, poolReward]);

  const getWalletBalanceSelected = React.useCallback(() => {
    switch (selectedPair.pair) {
      case SupportedPairs[0].pair: {
        return {
          base: walletBalance.sICXbalance || new BigNumber(0),
          quote: walletBalance.bnUSDbalance || new BigNumber(0),
        };
      }
      case SupportedPairs[1].pair: {
        return {
          base: walletBalance.BALNbalance || new BigNumber(0),
          quote: walletBalance.bnUSDbalance || new BigNumber(0),
        };
      }
      case SupportedPairs[2].pair: {
        return { base: walletBalance.ICXbalance || new BigNumber(0), quote: new BigNumber(0) };
      }
      default: {
        return { base: new BigNumber(0), quote: new BigNumber(0) };
      }
    }
  }, [selectedPair, walletBalance]);

  React.useEffect(() => {
    setSuppliedPairAmount(getSuppliedPairAmount());
    setWalletBalanceSelected(getWalletBalanceSelected());
  }, [getSuppliedPairAmount, getWalletBalanceSelected, selectedPair]);

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
              value={supplyInputAmount}
              showMaxButton={false}
              currency={CURRENCYLIST[selectedPair.baseCurrencyKey.toLowerCase()]}
              onUserInput={handleTypeInput}
              id="supply-liquidity-input-tokena"
            />
          </Flex>

          <Flex mt={3} style={selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx' ? { display: 'none' } : {}}>
            <CurrencyInputPanel
              value={supplyOutputAmount}
              showMaxButton={false}
              currency={CURRENCYLIST[selectedPair.quoteCurrencyKey.toLowerCase()]}
              onUserInput={handleTypeOutput}
              id="supply-liquidity-input-tokenb"
            />
          </Flex>

          <Typography mt={3} textAlign="right">
            Wallet: {walletBalanceSelected.base?.toFixed(2)} {selectedPair.baseCurrencyKey}
            {selectedPair === SupportedPairs[2]
              ? ''
              : ' / ' + walletBalanceSelected.quote?.toFixed(2) + ' ' + selectedPair.quoteCurrencyKey}
          </Typography>

          <Box mt={5}>
            <Nouislider
              id="slider-supply"
              start={[0]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [100],
              }}
            />
          </Box>

          <Flex justifyContent="center">
            <Button color="primary" marginTop={5} onClick={handleSupply}>
              Supply
            </Button>
          </Flex>
        </BrightPanel>

        <Box bg="bg2" flex={1} padding={7}>
          <Typography variant="h3" mb={2}>
            {selectedPair.pair} liquidity pool
          </Typography>
          <Typography mb={5} lineHeight={'25px'}>
            {selectedPair.baseCurrencyKey.toLowerCase() === 'icx'
              ? 'Earn Balance Tokens every day you supply liquidity. Your assets will be locked for the first 24 hours, and your supply ratio will fluctuate with the price.'
              : selectedPair.baseCurrencyKey.toLowerCase() === 'baln'
              ? 'Earn Balance Tokens every day you supply liquidity, and start accruing dividends. Your supply ratio will fluctuate with the price.'
              : selectedPair.baseCurrencyKey.toLowerCase() === 'sicx'
              ? 'Earn Balance Tokens every day you supply liquidity. Your supply ratio will fluctuate with the price.'
              : ''}
          </Typography>

          <Flex flexWrap="wrap">
            <Box
              width={[1, 1 / 2]} //
              sx={{
                borderBottom: ['1px solid rgba(255, 255, 255, 0.15)', 0], //
                borderRight: [0, '1px solid rgba(255, 255, 255, 0.15)'],
              }}
            >
              <StyledDL>
                <dt>Your supply</dt>
                <dd>
                  {selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx'
                    ? ICXliquiditySupply.toFixed(2) + ' ICX'
                    : suppliedPairAmount.base.toFixed(2) +
                      ' ' +
                      selectedPair.baseCurrencyKey +
                      ' / ' +
                      suppliedPairAmount.quote.toFixed(2) +
                      ' ' +
                      selectedPair.quoteCurrencyKey}
                </dd>
              </StyledDL>
              <StyledDL>
                <dt>Your daily rewards</dt>
                <dd>
                  ~ {suppliedPairAmount.dailyReward.isNaN() ? '0' : suppliedPairAmount.dailyReward.toFixed(2)} BALN
                </dd>
              </StyledDL>
            </Box>
            <Box width={[1, 1 / 2]}>
              <StyledDL>
                <dt>Total supply</dt>
                <dd>
                  {' '}
                  {selectedPair.quoteCurrencyKey.toLowerCase() === 'sicx'
                    ? (liquiditySupply.sICXICXTotalSupply?.toFixed(2) || '0') + ' ICX'
                    : suppliedPairAmount.baseSupply.toFixed(2) +
                      ' ' +
                      selectedPair.baseCurrencyKey +
                      ' / ' +
                      suppliedPairAmount.quoteSupply.toFixed(2) +
                      ' ' +
                      selectedPair.quoteCurrencyKey}
                </dd>
              </StyledDL>
              <StyledDL>
                <dt>Total daily rewards</dt>
                <dd>
                  {suppliedPairAmount.poolTotalDailyReward.isNaN()
                    ? '0'
                    : suppliedPairAmount.poolTotalDailyReward.toFixed(2)}{' '}
                  BALN
                </dd>
              </StyledDL>
            </Box>
          </Flex>
        </Box>
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
                {supplyInputAmount} {selectedPair.baseCurrencyKey}
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
                {supplyOutputAmount} {selectedPair.quoteCurrencyKey}
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
