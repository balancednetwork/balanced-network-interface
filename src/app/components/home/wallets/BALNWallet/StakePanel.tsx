import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails } from 'store/wallet/hooks';

export default React.memo(function StakePanel() {
  const details = useBALNDetails();

  const totalBalance: BigNumber = details['Total balance'] || new BigNumber(0);

  const stakedBalance: BigNumber = React.useMemo(() => details['Staked balance'] || new BigNumber(0), [details]);

  const [isAdjusting, setAdjusting] = React.useState(false);
  const handleAdjust = () => {
    setAdjusting(true);
  };
  const handleCancel = () => {
    setAdjusting(false);
  };

  const [tempBalance, setTempBalance] = React.useState(stakedBalance);
  const stakedPercent = totalBalance.isZero() ? new BigNumber(0) : tempBalance.div(totalBalance).times(100);

  const handleSlide = React.useCallback(
    (values: string[], handle: number) => {
      setTempBalance(new BigNumber(values[handle]));
    },
    [setTempBalance],
  );

  React.useEffect(() => {
    if (!isAdjusting) {
      setTempBalance(stakedBalance);
    }
  }, [stakedBalance, isAdjusting]);

  // modal
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const beforeAmount = stakedBalance;
  const afterAmount = tempBalance;
  const differenceAmount = afterAmount.minus(beforeAmount);
  const shouldStake = differenceAmount.isPositive();

  const addTransaction = useTransactionAdder();

  const { account } = useIconReact();
  const handleConfirm = () => {
    bnJs
      .inject({ account: account })
      .BALN.stake(BalancedJs.utils.toLoop(afterAmount))
      .then(res => {
        if (res.result) {
          if (shouldStake) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Staking BALN tokens...',
                summary: `Staked ${differenceAmount.abs().dp(2).toFormat()} BALN tokens.`,
              },
            );
          } else {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Unstaking BALN tokens...',
                summary: `Unstaked ${differenceAmount.abs().dp(2).toFormat()} BALN tokens.`,
              },
            );
          }
          toggleOpen();
          handleCancel();
        } else {
          console.error(res);
        }
      });
  };

  return (
    <>
      <Typography variant="h3">Stake Balance Tokens</Typography>

      <Typography my={1}>Stake your Balance Tokens to earn network fees.</Typography>

      <Box my={3}>
        <Nouislider
          disabled={!isAdjusting}
          id="slider-collateral"
          start={[stakedBalance.dp(2).toNumber()]}
          padding={[0]}
          connect={[true, false]}
          range={{
            min: [0],
            max: [totalBalance.dp(2).isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : totalBalance.dp(2).toNumber()],
          }}
          onSlide={handleSlide}
        />
      </Box>

      <Flex my={1} alignItems="center" justifyContent="space-between">
        <Typography>
          {tempBalance.dp(2).toFormat()} / {totalBalance.dp(2).toFormat()}
        </Typography>
        <Typography>{stakedPercent.dp(2, BigNumber.ROUND_UP).toFormat()}% staked</Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        {!isAdjusting ? (
          <Button onClick={handleAdjust}>Adjust</Button>
        ) : (
          <>
            <TextButton onClick={handleCancel}>Cancel</TextButton>
            <Button onClick={toggleOpen}>Confirm</Button>
          </>
        )}
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldStake ? 'Stake Balance Tokens?' : 'Unstake Balance Tokens?'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + ' BALN'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            {shouldStake ? 'Unstaking takes 3 days.' : `You'll receive them within 3 days.`}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button onClick={handleConfirm} fontSize={14}>
              {shouldStake ? 'Stake' : 'Unstake'}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
});
