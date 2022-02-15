import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletBalances } from 'store/wallet/hooks';
import { isZeroCA, multiplyCABN, toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

export default function DepositPanel() {
  const [portion, setPortion] = React.useState<number>(0);

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const sliderInstance = React.useRef<any>(null);

  const handleSlider = (values: string[], handle: number) => {
    setPortion(parseFloat(values[handle]) / 100);
  };

  const { account } = useIconReact();

  const wallet = useWalletBalances();

  const ratio = useRatio();

  const sicxAddress = bnJs.sICX.address;

  const maxAmount = wallet[sicxAddress];

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const beforeAmount = wallet[sicxAddress];

  const differenceAmount = multiplyCABN(maxAmount, new BigNumber(portion));

  const afterAmount = beforeAmount.subtract(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleSend = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .sICX.depositAndBorrow(toDec(differenceAmount))
      .then((res: any) => {
        if (res.result) {
          addTransaction(
            { hash: res.result },
            {
              pending: `Depositing collateral...`,
              summary: `Deposited ${differenceAmount.toFixed(2, { groupSeparator: ',' })} sICX as collateral.`,
            },
          );
          toggleOpen();
          setPortion(0);
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

  const differenceAmountByICX = multiplyCABN(differenceAmount, ratio.sICXICXratio);

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Typography variant="h3">Deposit as collateral</Typography>

      <Typography my={1}>Add your sICX to the collateral pool.</Typography>

      <Box my={3}>
        <Nouislider
          disabled={isZeroCA(maxAmount)}
          start={[0]}
          padding={[0]}
          connect={[true, false]}
          range={{
            min: [0],
            max: [isZeroCA(maxAmount) ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : 100],
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
          {differenceAmount.toFixed(2, { groupSeparator: ',' })} / {maxAmount.toFixed(2, { groupSeparator: ',' })} sICX
        </Typography>
        <Typography>~ {differenceAmountByICX.toFixed(2, { groupSeparator: ',' })} ICX</Typography>
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
            {differenceAmount.toFixed(2, { groupSeparator: ',' }) + ' sICX'}
          </Typography>

          <Typography textAlign="center" mb="5px">
            {differenceAmountByICX.toFixed(2, { groupSeparator: ',' })} ICX
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.toFixed(2, { groupSeparator: ',' }) + ' sICX'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.toFixed(2, { groupSeparator: ',' }) + ' sICX'}
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
