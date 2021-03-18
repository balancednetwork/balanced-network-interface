import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';
// import { useWalletICXBalance, useStakedICXBalance } from 'hooks';
import { useChangeDepositedValue, useBalance } from 'store/collateral/hooks';

enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const CollateralPanel = () => {
  const { account } = useIconReact();
  bnJs.eject({ account });
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<boolean>(false);

  // staked icx balance
  const [stakedICXAmount, updateStakedICXAmount] = React.useState(0);
  const changeDepositedValue = useChangeDepositedValue();

  const unStackedICXAmount = useBalance();
  const [stakedICXAmountCache, changeStakedICXAmountCache] = React.useState(new BigNumber(0));

  const [{ independentField, typedValue }, setCollateralState] = React.useState({
    independentField: Field.LEFT,
    typedValue: '',
  });

  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  /*******/

  const toggleOpen = () => {
    setOpen(!open);
  };
  // React.useCallback(
  //   (value: string) => {
  //     sliderInstance.current.noUiSlider.set(new BigNumber(value).toNumber());
  //     setCollateralState({ independentField: Field.LEFT, typedValue: value });
  //     changeDepositedValue(new BigNumber(value));
  //   },
  //   [setCollateralState, changeDepositedValue],
  // );
  const toggleEditing = () => {
    setEditing(!editing);
  };

  React.useEffect(() => {
    if (!account) return;
    bnJs.Loans.getAccountPositions().then(result => {
      const stakedICXVal = result['assets']
        ? convertLoopToIcx(new BigNumber(parseInt(result['assets']['sICX'], 16)))
        : 0;
      updateStakedICXAmount(stakedICXVal.toNumber());
      changeStakedICXAmountCache(stakedICXVal);
      setCollateralState({ independentField: Field.LEFT, typedValue: stakedICXVal.toFixed(2) });
    });
  }, [setCollateralState, account]);

  const handleStakedAmountType = React.useCallback(
    (value: string) => {
      sliderInstance.current.noUiSlider.set(new BigNumber(value).toNumber());
      setCollateralState({ independentField: Field.LEFT, typedValue: value });
      changeDepositedValue(new BigNumber(value));
    },
    [setCollateralState, changeDepositedValue],
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

  // total icx balance
  const totalICXAmount = unStackedICXAmount.plus(stakedICXAmount);

  // calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue || '0',
    [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCollateralConfirm = () => {
    if (!account) return;

    const newDepositedValue = parseFloat(formattedAmounts[Field.LEFT]);
    const shouldWithdraw = newDepositedValue < stakedICXAmountCache.toNumber();
    if (shouldWithdraw) {
      bnJs
        .eject({ account: account })
        .Loans.depositWithdrawCollateral(stakedICXAmountCache.toNumber() - newDepositedValue)
        .then(res => {
          console.log('res', res);
        })
        .catch(e => {
          console.error('error', e);
        });
    } else {
      bnJs
        .eject({ account: account })
        .Loans.depositAddCollateral(newDepositedValue - stakedICXAmountCache.toNumber())
        .then(res => {
          console.log('res', res);
        })
        .catch(e => {
          console.error('error', e);
        });
    }
  };

  const sliderInstance = React.useRef<any>(null);

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
            start={[stakedICXAmount]}
            padding={[0]}
            connect={[true, false]}
            range={{
              min: [0],
              max: [totalICXAmount.toNumber()],
            }}
            instanceRef={instance => {
              if (instance && !sliderInstance.current) {
                sliderInstance.current = instance;
              }
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
              value={!account ? '-' : formattedAmounts[Field.LEFT]}
              currency={!account ? CURRENCYLIST['empty'] : CURRENCYLIST['icx']}
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
              value={!account ? '-' : formattedAmounts[Field.RIGHT]}
              currency={!account ? CURRENCYLIST['empty'] : CURRENCYLIST['icx']}
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
            {formattedAmounts[Field.LEFT] === '0' ? '-' : formattedAmounts[Field.LEFT] + ' ICX'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {unStackedICXAmount.toFixed(2) + ' ICX'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {formattedAmounts[Field.RIGHT] + ' ICX'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">Your ICX will be staked as sICX.</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen}>Cancel</TextButton>
            <Button onClick={handleCollateralConfirm}>Deposit</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default CollateralPanel;
