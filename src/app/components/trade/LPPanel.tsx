import React from 'react';

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
import { useLiquiditySupply } from 'store/liquidity/hooks';
import { usePoolPair } from 'store/pool/hooks';
import { useRatioValue } from 'store/ratio/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

import { SectionPanel, BrightPanel } from './utils';

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
  const sICXtotalSupply = liquiditySupply.sICXsupply?.toNumber() || 0;
  const bnUSDtotalSsupply = liquiditySupply.bnUSDsupply?.toNumber() || 0;

  const sICXbnUSDsupply = liquiditySupply.sICXbnUSDsupply?.toNumber() || 0;
  const sICXbnUSDtotalSupply = liquiditySupply.sICXbnUSDtotalSupply?.toNumber() || 0;
  const sICXbnUSDsupplyShare = (sICXbnUSDsupply / sICXbnUSDtotalSupply) * 100;
  const sICXsupply = sICXtotalSupply * (sICXbnUSDsupplyShare / 100);
  const bnUSDsupply = bnUSDtotalSsupply * (sICXbnUSDsupplyShare / 100);

  const [showSupplyConfirm, setShowSupplyConfirm] = React.useState(false);

  const handleSupplyConfirmDismiss = () => {
    setShowSupplyConfirm(false);
  };

  const handleSupply = () => {
    setShowSupplyConfirm(true);
    console.log('selectedPair = ', selectedPair);
  };

  const selectedPair = usePoolPair();
  const ratio = useRatioValue();
  const sICXbnUSDratio = ratio.sICXbnUSDratio?.toNumber() || 0;

  const [supplyInputAmount, setsupplyInputAmount] = React.useState('0');

  const [supplyOutputAmount, setsupplyOutputAmount] = React.useState('0');

  const handleTypeInput = (val: string) => {
    setsupplyInputAmount(val);
    setsupplyOutputAmount((parseFloat(val) * sICXbnUSDratio).toFixed(2).toString());
  };

  const handleTypeOutput = (val: string) => {
    setsupplyOutputAmount(val);
    setsupplyInputAmount((parseFloat(val) / sICXbnUSDratio).toFixed(2).toString());
  };

  const handleSupplyInputDepositConfirm = () => {
    if (!account) return;
    bnJs
      .eject({ account: account })
      //.sICX.borrowAdd(newBorrowValue)
      .sICX.dexDeposit(parseFloat(supplyInputAmount))
      .then(res => {
        console.log('res', res);
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleSupplyOutputDepositConfirm = () => {
    if (!account) return;
    bnJs
      .eject({ account: account })
      //.sICX.borrowAdd(newBorrowValue)
      .bnUSD.dexDeposit(parseFloat(supplyOutputAmount))
      .then(res => {
        console.log('res', res);
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleSupplyConfirm = () => {
    if (!account) return;
    console.log('selectedPair = ', selectedPair);
    if (selectedPair.pair === SupportedPairs[2].pair) {
      console.log('match pair = ', parseFloat(supplyInputAmount));
      bnJs
        .eject({ account: account })
        .Dex.transferICX(parseFloat(supplyInputAmount))
        .then(res => {
          console.log('res', res);
        })
        .catch(e => {
          console.error('error', e);
        });
    } else {
      bnJs
        .eject({ account: account })
        //.sICX.borrowAdd(newBorrowValue)
        .Dex.dexSupplysICXbnUSD(parseFloat(supplyInputAmount), parseFloat(supplyOutputAmount))
        .then(res => {
          console.log('res', res);
        })
        .catch(e => {
          console.error('error', e);
        });
    }
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
              value={supplyInputAmount}
              showMaxButton={false}
              currency={CURRENCYLIST[selectedPair.baseCurrencyKey.toLowerCase()]}
              onUserInput={handleTypeInput}
              disableCurrencySelect={true}
              id="supply-liquidity-input-tokena"
            />
          </Flex>

          <Flex mt={3}>
            <CurrencyInputPanel
              value={supplyOutputAmount}
              showMaxButton={false}
              currency={CURRENCYLIST[selectedPair.quoteCurrencyKey.toLowerCase()]}
              onUserInput={handleTypeOutput}
              disableCurrencySelect={true}
              id="supply-liquidity-input-tokenb"
            />
          </Flex>

          <Typography mt={3} textAlign="right">
            Wallet: {walletBalance.sICXbalance?.toFixed(2)} {selectedPair.baseCurrencyKey} /{' '}
            {walletBalance.bnUSDbalance?.toFixed(2)} {selectedPair.quoteCurrencyKey}
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
            Earn Balance Tokens every day you supply liquidity. Your assets will be locked for the first 24 hours, and
            your supply ratio will fluctuate with the price.
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
                  {sICXsupply.toFixed(2)} {selectedPair.baseCurrencyKey} / {bnUSDsupply.toFixed(2)}{' '}
                  {selectedPair.quoteCurrencyKey}
                </dd>
              </StyledDL>
              <StyledDL>
                <dt>Your daily rewards</dt>
                <dd>~120 BALN</dd>
              </StyledDL>
            </Box>
            <Box width={[1, 1 / 2]}>
              <StyledDL>
                <dt>Total supply</dt>
                <dd>
                  {sICXtotalSupply.toFixed(2)} {selectedPair.baseCurrencyKey} / {bnUSDtotalSsupply.toFixed(2)}{' '}
                  {selectedPair.quoteCurrencyKey}
                </dd>
              </StyledDL>
              <StyledDL>
                <dt>Total daily rewards</dt>
                <dd>~17,500 BALN</dd>
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

          <Typography variant="p" textAlign="center" mb={4}>
            Send each asset to the pool, <br />
            then click Supply
          </Typography>

          <Flex alignItems="center" mb={4}>
            <Box width={1 / 2}>
              <Typography variant="p" fontWeight="bold" textAlign="right">
                {supplyInputAmount} {selectedPair.baseCurrencyKey}
              </Typography>
            </Box>
            <Box width={1 / 2}>
              <SupplyButton ml={3} onClick={handleSupplyInputDepositConfirm}>
                Send
              </SupplyButton>
            </Box>
          </Flex>

          <Flex alignItems="center" mb={4}>
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
            Your ICX will be staked, and your
            <br />
            assets will be locked for 24 hours.
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
