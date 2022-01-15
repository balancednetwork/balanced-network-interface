import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletBalances } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

export default function DepositPanel() {
  const [portion, setPortion] = React.useState<BigNumber>(ZERO);

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const sliderInstance = React.useRef<any>(null);

  const handleSlider = (values: string[], handle: number) => {
    setPortion(new BigNumber(values[handle]).div(100));
  };

  const { account } = useIconReact();

  const wallet = useWalletBalances();

  const ratio = useRatio();

  const maxAmount = wallet['sICX'];

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const beforeAmount = wallet['sICX'];

  const differenceAmount = maxAmount.times(portion);

  const afterAmount = beforeAmount.minus(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleSend = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .sICX.depositAndBorrow(BalancedJs.utils.toLoop(differenceAmount))
      .then((res: any) => {
        if (res.result) {
          addTransaction(
            { hash: res.result },
            {
              pending: `Depositing collateral...`,
              summary: `Deposited ${differenceAmount.dp(2).toFormat()} sICX as collateral.`,
            },
          );
          toggleOpen();
          setPortion(ZERO);
          sliderInstance?.current?.noUiSlider.set(0);
        } else {
          console.error(res);
        }
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const differenceAmountByICX = differenceAmount.multipliedBy(ratio.sICXICXratio);

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Typography variant="h3">Deposit as collateral</Typography>

      <Typography my={1}>Add your sICX to the collateral pool.</Typography>

      <Box my={3}>
        <Nouislider
          disabled={maxAmount.isZero()}
          start={[0]}
          padding={[0]}
          connect={[true, false]}
          range={{
            min: [0],
            max: [maxAmount.isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : 100],
          }}
          onSlide={handleSlider}
          instanceRef={instance => {
            if (instance && !sliderInstance.current) {
              sliderInstance.current = instance;
            }
          }}
        />
      </Box>

      <Flex my={1} alignItems="center" justifyContent="space-between">
        <Typography>
          {differenceAmount.dp(2).toFormat()} / {maxAmount.dp(2).toFormat()} sICX
        </Typography>
        <Typography>~ {differenceAmountByICX.dp(2).toFormat()} ICX</Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        <Button onClick={toggleOpen}>Deposit sICX</Button>
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Deposit sICX collateral?
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

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button onClick={handleSend} fontSize={14} disabled={!hasEnoughICX}>
                  Deposit
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </>
  );
}
