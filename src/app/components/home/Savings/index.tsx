import React from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import { inputRegex } from 'app/components/CurrencyInputPanel';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useLockedAmount, useSavingsSliderActionHandlers, useSavingsSliderState } from 'store/savings/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useICONWalletBalances } from 'store/wallet/hooks';
import { escapeRegExp, parseUnits } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { BalnPreviewInput as SavingsPreviewInput } from '../BBaln/styledComponents';

const Savings = () => {
  const lockedAmount = useLockedAmount();
  const { account } = useIconReact();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const shouldLedgerSign = useShouldLedgerSign();
  const { typedValue, isAdjusting, inputType } = useSavingsSliderState();
  const { onFieldAInput, onSlide, onAdjust: adjust } = useSavingsSliderActionHandlers();
  const balances = useICONWalletBalances();
  const bnUSDBalance = balances?.[bnJs.bnUSD.address];
  const sliderInstance = React.useRef<any>(null);
  const addTransaction = useTransactionAdder();
  const hasEnoughICX = useHasEnoughICX();
  const [isOpen, setOpen] = React.useState(false);
  const isSmallScreen = useMedia('(max-width: 540px)');

  const toggleOpen = React.useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen]);

  const [typedValueBN, lockedAmountBN] = React.useMemo(() => {
    return [new BigNumber(parseFloat(typedValue)), new BigNumber(lockedAmount?.toFixed() || 0)];
  }, [lockedAmount, typedValue]);

  const bnUSDCombinedTotal = React.useMemo(() => {
    if (bnUSDBalance?.greaterThan(0)) {
      return lockedAmount ? parseFloat(bnUSDBalance.add(lockedAmount).toFixed(2)) : parseFloat(bnUSDBalance.toFixed(2));
    } else if (lockedAmount) {
      return parseFloat(lockedAmount.toFixed(2));
    } else return 0;
  }, [bnUSDBalance, lockedAmount]);

  React.useEffect(() => {
    if (lockedAmount && sliderInstance.current) {
      onFieldAInput(lockedAmount.toFixed(2));
    } else {
      onFieldAInput('0');
    }
  }, [lockedAmount, onFieldAInput]);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(typedValueBN.toNumber());
    }
  }, [typedValueBN, inputType]);

  const formatEnforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      const typedValue = new BigNumber(parseFloat(nextUserInput));
      if (bnUSDCombinedTotal > 0) {
        if (typedValue.isGreaterThan(bnUSDCombinedTotal)) {
          onFieldAInput(bnUSDCombinedTotal.toFixed(2));
        } else {
          onFieldAInput(nextUserInput);
        }
      }
    }
  };

  const bnUSDDiff = React.useMemo(() => {
    if (isAdjusting) {
      return typedValueBN.minus(lockedAmountBN);
    } else {
      return new BigNumber(0);
    }
  }, [isAdjusting, lockedAmountBN, typedValueBN]);

  const handleCancel = () => {
    adjust(false);
    onFieldAInput(lockedAmount?.toFixed(2) || '0');
  };

  const handleConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }
    if (account) {
      try {
        bnJs.inject({ account });
        if (bnUSDDiff.isGreaterThan(0)) {
          const { result: hash } = await bnJs.bnUSD.stake(parseUnits(bnUSDDiff.toFixed()));
          addTransaction(
            { hash },
            {
              pending: t`Staking bnUSD...`,
              summary: t`${bnUSDDiff.abs().toFormat()} bnUSD staked.`,
            },
          );
        } else if (bnUSDDiff.isLessThan(0)) {
          const { result: hash } = await bnJs.Savings.unlock(parseUnits(bnUSDDiff.abs().toFixed()));
          addTransaction(
            { hash },
            {
              pending: t`Unstaking bnUSD...`,
              summary: t`${bnUSDDiff.abs().toFormat()} bnUSD unstaked.`,
            },
          );
        }
        toggleOpen();
      } catch (error) {
        console.error('staking/unlocking bnUSD error: ', error);
      } finally {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    }
    adjust(false);
  };

  return (
    <>
      <Box>
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Flex
            alignItems={isSmallScreen ? 'flex-start' : 'flex-start'}
            flexDirection={isSmallScreen ? 'column' : 'row'}
            flexWrap="wrap"
          >
            <Typography mr="10px" variant="h4">
              bnUSD savings
            </Typography>
            <Typography pt={isSmallScreen ? '5px' : '9px'} color="text1">
              22.4% APR
            </Typography>
          </Flex>
          {bnUSDCombinedTotal > 0 && (
            <Flex>
              {isAdjusting && <TextButton onClick={handleCancel}>{t`Cancel`}</TextButton>}
              <Button
                fontSize={14}
                onClick={isAdjusting ? () => toggleOpen() : () => adjust(true)}
                disabled={isAdjusting && bnUSDDiff.isEqualTo(0)}
              >
                {isAdjusting ? t`Confirm` : t`Adjust`}
              </Button>
            </Flex>
          )}
        </Flex>
        {bnUSDCombinedTotal > 0 ? (
          <>
            <Box margin="25px 0 10px">
              <Nouislider
                disabled={!isAdjusting}
                id="slider-savings"
                start={[Number(lockedAmount?.toFixed(0) || 0)]}
                connect={[true, false]}
                range={{
                  min: [0],
                  max: [bnUSDCombinedTotal || 1],
                }}
                instanceRef={instance => {
                  if (instance) {
                    sliderInstance.current = instance;
                  }
                }}
                onSlide={onSlide}
              />
            </Box>

            <Flex alignItems="center" justifyContent="space-between" pt={isAdjusting ? '5px' : 0}>
              <Flex alignItems="center">
                {isAdjusting ? (
                  <SavingsPreviewInput
                    type="text"
                    value={typedValue}
                    onChange={event => formatEnforcer(event.target.value.replace(/,/g, '.'))}
                  />
                ) : (
                  <Typography mr={'4px'} fontSize={14}>
                    {lockedAmount?.toFixed(2, { groupSeparator: ',' }).replace('.00', '') || 0}
                  </Typography>
                )}
                <Typography fontSize={14}>{`/ ${bnUSDCombinedTotal.toFixed(2)} bnUSD`}</Typography>
              </Flex>
              <Typography fontSize={14}>{`~ $_ daily`}</Typography>
            </Flex>
          </>
        ) : (
          <>Get some bnUSD to stake it.</>
        )}
      </Box>

      <Modal isOpen={isOpen} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={'25px'} width="100%">
          <Typography textAlign="center" mb="5px">
            {bnUSDDiff.isGreaterThan(0) ? t`Stake bnUSD?` : t`Unstake bnUSD?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${bnUSDDiff.abs().toFormat()} bnUSD`}
          </Typography>

          <Flex my={'25px'}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {lockedAmount?.toFixed(0, { groupSeparator: ',' })} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {`${bnUSDDiff.plus(new BigNumber(lockedAmount?.toFixed() ?? 0))} bnUSD`}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            <Trans>You can update your staked balance anytime.</Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top" flexWrap={'wrap'}>
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleConfirm} fontSize={14}>
                  {bnUSDDiff.isGreaterThan(0) ? 'Stake bnUSD' : t`Unstake bnUSD`}
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
};

export default Savings;
