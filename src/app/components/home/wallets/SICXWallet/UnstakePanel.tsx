import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useRatioValue } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

export default function UnstakePanel() {
  const [value, setValue] = React.useState('0');

  const handleSlider = (values: string[], handle: number) => {
    setValue(values[handle]);
  };

  const { account } = useIconReact();

  const wallet = useWalletBalanceValue();

  const ratio = useRatioValue();

  const maxAmount = wallet.sICXbalance;

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const beforeAmount = wallet.sICXbalance;

  const differenceAmount = isNaN(parseFloat(value)) ? new BigNumber(0) : new BigNumber(value);

  const afterAmount = beforeAmount.minus(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleSend = () => {
    bnJs
      .eject({ account })
      .sICX.unstake(differenceAmount)
      .then(res => {
        if (res.result) {
          addTransaction({ hash: res.result }, { summary: `Unstake ${differenceAmount.toNumber()} sICX.` });
          toggleOpen();
          setValue('0');
        } else {
          // to do
          // need to handle error case
          // for example: out of balance
          console.error(res);
        }
      });
  };

  const differenceAmountByICX = differenceAmount.multipliedBy(ratio.sICXICXratio);

  return (
    <>
      <Typography variant="h3">Unstake sICX</Typography>

      <Box my={3}>
        <Nouislider
          start={[0]}
          padding={[0]}
          connect={[true, false]}
          range={{
            min: [0],
            max: [maxAmount.isZero() ? 0.001 : maxAmount.toNumber()],
          }}
          onSlide={handleSlider}
        />
      </Box>

      <Flex my={1} alignItems="center" justifyContent="space-between">
        <Typography>
          {new BigNumber(value).dp(2).toFormat()} / {maxAmount.dp(2).toFormat()} sICX
        </Typography>
        <Typography>~ {differenceAmountByICX.dp(2).toFormat()} ICX</Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        <Button onClick={toggleOpen}>Unstake sICX</Button>
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Unstake sICX?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + ' sICX'}
          </Typography>

          <Typography textAlign="center" mb="5px">
            {differenceAmountByICX.dp(2).toFormat()} ICX
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' sICX'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + ' sICX'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            You'll receive ICX as soon as it becomes available.
            <br />
            Track the unstaking progress from the ICX tab.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button onClick={handleSend} fontSize={14}>
              Send
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
