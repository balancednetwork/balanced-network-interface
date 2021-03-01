import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { CurrencyField } from 'app/components/Form';
import RewardsPanel from 'app/components/home/RewardsPanel';
import WalletPanel from 'app/components/home/WalletPanel';
import { DefaultLayout } from 'app/components/Layout';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'demo';
import { useWalletICXBalance, useStakedICXBalance } from 'hooks';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`;

const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: 2 / 1 / 2 / 3;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
    flex-direction: column;
  `}
`;

const Chip = styled(Box)`
  display: inline-block;
  min-width: 82px;
  text-align: center;
  border-radius: 100px;
  padding: 1px 10px;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.4;
`;

enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export function HomePage() {
  const [isCollateralEditing, setCollateralEditing] = React.useState<boolean>(false);

  const handleCollateralAdjust = () => {
    setCollateralEditing(true);
  };

  const handleCollateralCancel = () => {
    setCollateralEditing(false);
  };

  const [isLoanEditing, setLoanEditing] = React.useState<boolean>(false);

  const handleLoanAdjust = () => {
    setLoanEditing(true);
  };

  const handleLoanCancel = () => {
    setLoanEditing(false);
  };

  //
  const { account } = useIconReact();
  // wallet icx balance
  const unStackedICXAmount = useWalletICXBalance(account);

  // staked icx balance
  const stakedICXAmount = useStakedICXBalance(account);

  // totall icx balance
  const totalICXAmount = unStackedICXAmount.plus(stakedICXAmount);

  const [{ independentField, typedValue }, setCollateralState] = React.useState({
    independentField: Field.LEFT,
    typedValue: '',
  });

  React.useEffect(() => {
    setCollateralState({ independentField: Field.LEFT, typedValue: unStackedICXAmount.toFixed(2) });
  }, [unStackedICXAmount]);

  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const handleStakedAmountType = React.useCallback((value: string) => {
    setCollateralState({ independentField: Field.LEFT, typedValue: value });
  }, []);

  const handleUnstakedAmountType = React.useCallback((value: string) => {
    setCollateralState({ independentField: Field.RIGHT, typedValue: value });
  }, []);

  const handleCollateralSlider = React.useCallback((values: string[], handle: number) => {
    setCollateralState({ independentField: Field.LEFT, typedValue: values[handle] });
  }, []);

  // calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue),
    [dependentField]: totalICXAmount.minus(new BigNumber(typedValue)),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmount[dependentField].toFixed(2),
  };

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    sliderInstance.current.noUiSlider.set(new BigNumber(typedValue).toNumber());
  }, [typedValue]);

  return (
    <DefaultLayout>
      <Helmet>
        <title>Home</title>
      </Helmet>

      <Grid>
        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">Collateral</Typography>

            <Box>
              {isCollateralEditing ? (
                <>
                  <TextButton onClick={handleCollateralCancel}>Cancel</TextButton>
                  <Button>Confirm</Button>
                </>
              ) : (
                <Button onClick={handleCollateralAdjust}>Adjust</Button>
              )}
            </Box>
          </Flex>

          <Box marginY={6}>
            <Nouislider
              id="slider-collateral"
              disabled={!isCollateralEditing}
              start={0}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [totalICXAmount.toNumber()],
              }}
              instanceRef={instance => {
                sliderInstance.current = instance;
              }}
              onSlide={handleCollateralSlider}
            />
          </Box>

          <Flex justifyContent="space-between">
            <Box width={[1, 1 / 2]} mr={4}>
              <CurrencyField
                id="staked-icx-amount"
                editable={isCollateralEditing}
                isActive
                label="Deposited"
                tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                value={formattedAmounts[Field.LEFT]}
                currency={CURRENCYLIST['icx']}
                onUserInput={handleStakedAmountType}
              />
            </Box>

            <Box width={[1, 1 / 2]} ml={4}>
              <CurrencyField
                id="unstaked-icx-amount"
                editable={isCollateralEditing}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={formattedAmounts[Field.RIGHT]}
                currency={CURRENCYLIST['icx']}
                onUserInput={handleUnstakedAmountType}
              />
            </Box>
          </Flex>
        </BoxPanel>

        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">Loan</Typography>

            <Box>
              {isLoanEditing ? (
                <>
                  <TextButton onClick={handleLoanCancel}>Cancel</TextButton>
                  <Button>Confirm</Button>
                </>
              ) : (
                <Button onClick={handleLoanAdjust}>Borrow</Button>
              )}
            </Box>
          </Flex>

          <Box marginY={6}>
            <Nouislider
              disabled={!isLoanEditing}
              id="slider-collateral"
              start={[10000]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [15000],
              }}
            />
          </Box>

          <Flex justifyContent="space-between">
            <Box width={[1, 1 / 2]} mr={4}>
              <CurrencyField
                editable={isLoanEditing}
                isActive
                label="Borrowed"
                tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                value={'37533'}
                currency={CURRENCYLIST['bnusd']}
              />
            </Box>

            <Box width={[1, 1 / 2]} ml={4}>
              <CurrencyField
                editable={isLoanEditing}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={'34740'}
                currency={CURRENCYLIST['bnusd']}
              />
            </Box>
          </Flex>
        </BoxPanel>

        <ActivityPanel bg="bg2">
          <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 350]}>
            <Typography variant="h2" mb={5}>
              Position detail
            </Typography>

            <Flex>
              <Box width={1 / 2} className="border-right">
                <Typography>Collateral</Typography>
                <Typography variant="p">$10,349</Typography>
              </Box>
              <Box width={1 / 2} sx={{ textAlign: 'right' }}>
                <Typography>Loan</Typography>
                <Typography variant="p">$1,512 / $2,587</Typography>
              </Box>
            </Flex>
            <Divider my={4} />
            <Typography mb={2}>
              The current ICX price is <span className="alert">$0.2400</span>.
            </Typography>
            <Typography>
              You hold <span className="white">0.15%</span> of the total debt.
            </Typography>
          </BoxPanel>
          <BoxPanel bg="bg2" flex={1}>
            <Typography variant="h3">Risk ratio</Typography>

            <Flex alignItems="center" justifyContent="space-between" my={4}>
              <Chip bg="primary">Low risk</Chip>
              <Box flex={1} mx={1}>
                <Nouislider
                  disabled={true}
                  id="risk-ratio"
                  start={[10000]}
                  padding={[0]}
                  connect={[true, false]}
                  range={{
                    min: [0],
                    max: [15000],
                  }}
                />
              </Box>
              <Chip bg="red">Liquidated</Chip>
            </Flex>

            <Divider my={3} />

            <Flex flexWrap="wrap" alignItems="flex-end">
              <Box width={[1, 1 / 2]}>
                <Flex alignItems="center" mb={15}>
                  <Typography variant="h3" mr={15}>
                    Rebalancing
                  </Typography>
                  <DropdownText text="Past week">
                    <MenuList>
                      <MenuItem>Day</MenuItem>
                      <MenuItem>Week</MenuItem>
                      <MenuItem>Month</MenuItem>
                    </MenuList>
                  </DropdownText>
                </Flex>
                <Flex>
                  <Box width={1 / 2}>
                    <Typography variant="p">0 ICD</Typography>
                    <Typography>Collateral sold</Typography>
                  </Box>
                  <Box width={1 / 2}>
                    <Typography variant="p">0 ICD</Typography>
                    <Typography>Loan repaid</Typography>
                  </Box>
                </Flex>
              </Box>

              <Box width={[1, 1 / 2]}>
                <Typography>
                  Traders can repay loans by selling ICD for $1 of ICX collateral. Your position will rebalance based on
                  your % of the total debt.
                </Typography>
              </Box>
            </Flex>
          </BoxPanel>
        </ActivityPanel>

        <WalletPanel />

        <div>
          <RewardsPanel />
        </div>
      </Grid>
    </DefaultLayout>
  );
}
