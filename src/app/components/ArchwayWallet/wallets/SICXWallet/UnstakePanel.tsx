import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useChangeShouldLedgerSign, useICXUnstakingTime, useShouldLedgerSign } from 'store/application/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useICONWalletBalances } from 'store/wallet/hooks';
import { isZeroCA, multiplyCABN, toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

export default function UnstakePanel() {
  const [portion, setPortion] = React.useState<number>(0);

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const sliderInstance = React.useRef<any>(null);

  const handleSlider = (values: string[], handle: number) => {
    setPortion(parseFloat(values[handle]) / 100);
  };

  const { account } = useIconReact();

  const { data: icxUnstakingTime } = useICXUnstakingTime();

  const wallet = useICONWalletBalances();

  const sicxAddress = bnJs.sICX.address;

  const ratio = useRatio();

  const maxAmount = wallet[sicxAddress];

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;

    setOpen(!open);
  };

  const beforeAmount = wallet[sicxAddress];

  const differenceAmount = multiplyCABN(beforeAmount, new BigNumber(portion));

  const afterAmount = beforeAmount.subtract(differenceAmount);

  const addTransaction = useTransactionAdder();

  const handleUnstake = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .sICX.unstake(toDec(differenceAmount))
      .then(res => {
        if (res.result) {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Preparing to unstake sICX...`,
              summary: t`Unstaking ${differenceAmount.toFixed(2, {
                groupSeparator: ',',
              })} sICX. Check the ICX entry in your wallet for details.`,
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
      <Typography variant="h3">
        <Trans>Unstake sICX</Trans>
      </Typography>

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
        <Button onClick={toggleOpen}>
          <Trans>Unstake sICX</Trans>
        </Button>
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            <Trans>Unstake sICX?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.toFixed(2, { groupSeparator: ',' }) + ' sICX'}
          </Typography>

          <Typography textAlign="center" mb="5px">
            {differenceAmountByICX.toFixed(2, { groupSeparator: ',' })} ICX
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.toFixed(2, { groupSeparator: ',' }) + ' sICX'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.toFixed(2, { groupSeparator: ',' }) + ' sICX'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            {t`Takes up to ${
              icxUnstakingTime ? icxUnstakingTime.toFixed(1) : '~7'
            } days. When it's ready, you can claim your ICX from the wallet section.`}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleUnstake} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Unstake</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
