import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'demo';
import { useWalletICXBalance, useStakedICXBalance } from 'hooks';

enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const CollateralPanel = () => {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const [editing, setEditing] = React.useState<boolean>(false);

  const toggleEditing = () => {
    setEditing(!editing);
  };

  const [{ independentField, typedValue }, setCollateralState] = React.useState({
    independentField: Field.LEFT,
    typedValue: '',
  });

  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const handleStakedAmountType = React.useCallback(
    (value: string) => {
      setCollateralState({ independentField: Field.LEFT, typedValue: value });
    },
    [setCollateralState],
  );

  const handleUnstakedAmountType = React.useCallback(
    (value: string) => {
      setCollateralState({ independentField: Field.RIGHT, typedValue: value });
    },
    [setCollateralState],
  );

  const handleCollateralSlider = (values: string[], handle: number) => {
    setCollateralState(state => ({ independentField: state['independentField'], typedValue: values[handle] }));
  };

  //
  const { account } = useIconReact();
  // wallet icx balance
  const unStackedICXAmount = useWalletICXBalance(account);

  // staked icx balance
  const stakedICXAmount = useStakedICXBalance(account);

  // totall icx balance
  const totalICXAmount = unStackedICXAmount.plus(stakedICXAmount);
  // calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue || '0',
    [dependentField]: parsedAmount[dependentField].toFixed(2),
  };

  console.log(
    independentField,
    unStackedICXAmount.toFixed(2),
    stakedICXAmount.toFixed(2),
    totalICXAmount.toFixed(2),
    parsedAmount,
    formattedAmounts,
  );

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    sliderInstance.current.noUiSlider.set(new BigNumber(typedValue).toNumber());
  }, [typedValue, editing]);

  return (
    <>
      <BoxPanel bg="bg3">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">Collateral</Typography>

          <Box>
            {editing ? (
              <>
                <TextButton onClick={toggleEditing}>Cancel</TextButton>
                <Button onClick={toggleOpen}>Confirm</Button>
              </>
            ) : (
              <Button onClick={toggleEditing}>Deposit</Button>
            )}
          </Box>
        </Flex>

        <Box marginY={6} height={20}>
          <Nouislider
            id="slider-collateral"
            disabled={!editing}
            start={[0]}
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
              editable={editing}
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
              editable={editing}
              isActive={false}
              label="Wallet"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={formattedAmounts[Field.RIGHT]}
              currency={CURRENCYLIST['icx']}
              onUserInput={handleUnstakedAmountType}
            />
          </Box>
        </Flex>
      </BoxPanel>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3">
            Deposit ICON collateral?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            0 ICX
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                8,205 ICX
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                8,205 ICX
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">Your ICX will be staked as sICX.</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen}>Cancel</TextButton>
            <Button>Deposit</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default CollateralPanel;
