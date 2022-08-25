import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import LockBar from 'app/components/LockBar';
import Modal from 'app/components/Modal';
import { BoxPanel, FlexPanel, BoxPanelWrap } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as InfoAbove } from 'assets/images/rebalancing-above.svg';
import { ReactComponent as InfoBelow } from 'assets/images/rebalancing-below.svg';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useCollateralActionHandlers, useCollateralType } from 'store/collateral/hooks';
import { Field } from 'store/loan/actions';
import {
  useLoanBorrowedAmount,
  useLoanState,
  useLoanTotalBorrowableAmount,
  useLoanActionHandlers,
  useLoanUsedAmount,
  useLoanParameters,
} from 'store/loan/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { parseUnits } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ModalContent from '../ModalContent';
import { PanelInfoWrap, PanelInfoItem } from './CollateralPanel';

const LoanPanel = () => {
  const { account } = useIconReact();
  const collateralType = useCollateralType();
  const locale = useActiveLocale();

  const isSuperSmall = useMedia(`(max-width: ${'es-ES,nl-NL,de-DE,pl-PL'.indexOf(locale) >= 0 ? '450px' : '300px'})`);

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  // user interaction logic
  const { independentField, typedValue, isAdjusting, inputType } = useLoanState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const { onFieldAInput, onFieldBInput, onSlide, onAdjust: adjust } = useLoanActionHandlers();
  const { onAdjust: adjustCollateral } = useCollateralActionHandlers();

  const handleEnableAdjusting = () => {
    adjust(true);
    adjustCollateral(false);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
    changeShouldLedgerSign(false);
  };

  //
  const borrowedAmount = useLoanBorrowedAmount();
  const totalBorrowableAmount = useLoanTotalBorrowableAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalBorrowableAmount.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]:
      parsedAmount[dependentField].isZero() || parsedAmount[dependentField].isNegative()
        ? '0'
        : parsedAmount[dependentField].toFixed(2),
  };

  const buttonText = borrowedAmount.isZero() ? t`Borrow` : t`Adjust`;

  // loan confirm modal logic & value
  const [open, setOpen] = React.useState(false);
  const [rebalancingModalOpen, setRebalancingModalOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const toggleRebalancingModalOpen = (shouldUpdateLoan: boolean = false) => {
    setRebalancingModalOpen(!rebalancingModalOpen);
    if (shouldUpdateLoan) {
      toggleOpen();
    }
  };

  //before
  const beforeAmount = borrowedAmount;
  //after
  const afterAmount = parsedAmount[Field.LEFT];
  //difference = after-before
  const differenceAmount = afterAmount.minus(beforeAmount);
  const roundedDisplayDiffAmount = afterAmount.minus(beforeAmount.dp(2));

  const { originationFee = 0 } = useLoanParameters() || {};
  //whether if repay or borrow
  const shouldBorrow = differenceAmount.isPositive();
  //borrow fee
  const fee = differenceAmount.times(originationFee);
  const addTransaction = useTransactionAdder();

  const handleLoanUpdate = () => {
    borrowedAmount.isLessThanOrEqualTo(0) ? toggleRebalancingModalOpen() : toggleOpen();
  };

  const handleLoanConfirm = () => {
    if (!account) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (shouldBorrow) {
      bnJs
        .inject({ account })
        .Loans.borrow(parseUnits(differenceAmount.toFixed()), collateralType)
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Borrowing bnUSD...`,
              summary: t`Borrowed ${differenceAmount.dp(2).toFormat()} bnUSD.`,
            },
          );
          // close modal
          toggleOpen();
          // reset loan panel values
          adjust(false);
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    } else {
      bnJs
        .inject({ account })
        .Loans.returnAsset('bnUSD', parseUnits(differenceAmount.abs().toFixed()), collateralType)
        .then(res => {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Repaying bnUSD...`,
              summary: t`Repaid ${differenceAmount.abs().dp(2).toFormat()} bnUSD.`,
            },
          );
          // close modal
          toggleOpen();
          // reset loan panel values
          adjust(false);
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    }
  };

  // reset loan ui state if cancel adjusting
  // change typedValue if sICX and ratio changes
  React.useEffect(() => {
    if (!isAdjusting) {
      onFieldAInput(borrowedAmount.isZero() ? '0' : borrowedAmount.toFixed(2));
    }
  }, [onFieldAInput, borrowedAmount, isAdjusting]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(afterAmount.toNumber());
    }
  }, [afterAmount, inputType]);

  const usedAmount = useLoanUsedAmount();

  const _totalBorrowableAmount = BigNumber.max(totalBorrowableAmount.times(0.99), borrowedAmount);
  const percent = _totalBorrowableAmount.isZero() ? 0 : usedAmount.div(_totalBorrowableAmount).times(100).toNumber();

  const shouldShowLock = !usedAmount.isZero();

  const hasEnoughICX = useHasEnoughICX();

  if (totalBorrowableAmount.isZero() || totalBorrowableAmount.isNegative()) {
    return (
      <FlexPanel bg="bg3" flexDirection="column" minHeight={195}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">
            <Trans>Loan</Trans>
          </Typography>
        </Flex>

        <Flex flex={1} justifyContent="center" alignItems="center">
          <Typography>
            <Trans>To take out a loan, deposit collateral.</Trans>
          </Typography>
        </Flex>
      </FlexPanel>
    );
  }

  const currentValue = parseFloat(formattedAmounts[Field.LEFT]);

  const isLessThanMinimum = currentValue > 0 && currentValue < 10;

  return (
    <>
      <BoxPanelWrap>
        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">
              <Trans>Loan</Trans>
            </Typography>
            <Flex flexDirection={isSuperSmall ? 'column' : 'row'} paddingTop={isSuperSmall ? '4px' : '0'}>
              {isAdjusting ? (
                <>
                  <TextButton onClick={handleCancelAdjusting} marginBottom={isSuperSmall ? '10px' : '0'}>
                    <Trans>Cancel</Trans>
                  </TextButton>
                  <Button
                    disabled={
                      borrowedAmount.isLessThanOrEqualTo(0) ? currentValue >= 0 && currentValue < 10 : currentValue < 0
                    }
                    onClick={handleLoanUpdate}
                    fontSize={14}
                  >
                    <Trans>Confirm</Trans>
                  </Button>
                </>
              ) : (
                <Button onClick={handleEnableAdjusting} fontSize={14}>
                  {buttonText}
                </Button>
              )}
            </Flex>
          </Flex>

          {shouldShowLock && <LockBar disabled={!isAdjusting} percent={percent} text={t`Used`} />}

          <Box marginY={6}>
            <Nouislider
              disabled={!isAdjusting}
              id="slider-loan"
              start={[borrowedAmount.dp(2).toNumber()]}
              padding={[Math.max(Math.min(usedAmount.dp(2).toNumber(), _totalBorrowableAmount.dp(2).toNumber()), 0), 0]}
              connect={[true, false]}
              range={{
                min: [0],
                // https://github.com/balancednetwork/balanced-network-interface/issues/50
                max: [
                  isNaN(_totalBorrowableAmount.dp(2).toNumber()) || _totalBorrowableAmount.dp(2).isZero()
                    ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                    : _totalBorrowableAmount.dp(2).toNumber(),
                ],
              }}
              instanceRef={instance => {
                if (instance) {
                  sliderInstance.current = instance;
                }
              }}
              onSlide={onSlide}
            />
          </Box>
          <PanelInfoWrap>
            <PanelInfoItem>
              {isAdjusting && borrowedAmount.isLessThanOrEqualTo(0) ? (
                <CurrencyField
                  editable={isAdjusting}
                  isActive
                  label="Borrowed"
                  tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                  noticeShow={isLessThanMinimum}
                  noticeText={'10 bnUSD minimum'}
                  value={formattedAmounts[Field.LEFT]}
                  currency={'bnUSD'}
                  onUserInput={onFieldAInput}
                />
              ) : (
                <CurrencyField
                  editable={isAdjusting}
                  isActive
                  label="Borrowed"
                  tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                  value={formattedAmounts[Field.LEFT]}
                  currency={'bnUSD'}
                  onUserInput={onFieldAInput}
                />
              )}
            </PanelInfoItem>

            <PanelInfoItem>
              <CurrencyField
                editable={isAdjusting}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={formattedAmounts[Field.RIGHT]}
                currency={'bnUSD'}
                onUserInput={onFieldBInput}
              />
            </PanelInfoItem>
          </PanelInfoWrap>
        </BoxPanel>
      </BoxPanelWrap>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            {shouldBorrow ? t`Borrow Balanced Dollars?` : t`Repay Balanced Dollars?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {roundedDisplayDiffAmount.dp(2).toFormat()} bnUSD
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>
          </Flex>

          {shouldBorrow && (
            <Typography textAlign="center">
              <Trans>Includes a fee of {fee.dp(2).toFormat()} bnUSD.</Trans>
            </Typography>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleLoanConfirm} fontSize={14}>
                  <Trans>{shouldBorrow ? t`Borrow` : t`Repay`}</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>

      <Modal isOpen={rebalancingModalOpen} onDismiss={() => toggleRebalancingModalOpen(false)} maxWidth={450}>
        <ModalContent noMessages>
          <Typography textAlign="center">
            <Trans>Rebalancing</Trans>
          </Typography>
          <RebalancingInfo />
          <BoxWithBorderTop>
            <Button onClick={() => toggleRebalancingModalOpen(true)}>
              <Trans>Understood</Trans>
            </Button>
          </BoxWithBorderTop>
        </ModalContent>
      </Modal>
    </>
  );
};

export const RebalancingInfo = () => {
  const collateralType = useCollateralType();

  return (
    <RebalancingInfoWrap flexDirection="row" flexWrap="wrap" alignItems="stretch" width="100%">
      <Typography
        textAlign="center"
        mb="5px"
        width="100%"
        maxWidth="320px"
        margin="10px auto 35px"
        fontSize="16"
        fontWeight="bold"
        color="#FFF"
      >
        <Trans>While you borrow bnUSD, your collateral is used to keep its value stable</Trans>
      </Typography>
      <RebalancingColumn borderRight={true}>
        <InfoBelow />
        <Typography fontWeight="bold" color="#FFF">
          <Trans>If bnUSD is below $1</Trans>
        </Typography>
        <Typography>
          <Trans>Balanced sells collateral at a premium to repay some of your loan.</Trans>
        </Typography>
      </RebalancingColumn>
      <RebalancingColumn>
        <InfoAbove />
        <Typography fontWeight="bold" color="#FFF" marginTop="19px">
          <Trans>If bnUSD is above $1</Trans>
        </Typography>
        <Typography>
          <Trans>Balanced increases your loan to buy more collateral at a discount.</Trans>
        </Typography>
      </RebalancingColumn>
      <Typography marginTop="25px">
        {t`You'll receive BALN as a reward, and can mitigate the fluctuations by supplying liquidity to the ${`${collateralType}/bnUSD`}
          pool. The smaller your loan, the less rebalancing affects you.`}
      </Typography>
    </RebalancingInfoWrap>
  );
};

const BoxWithBorderTop = styled(Box)`
  padding-top: 25px;
  margin-top: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
  text-align: center;
`;

const RebalancingColumn = styled(Box)<{ borderRight?: boolean }>`
  width: 50%;
  padding-left: 10px;
  margin-top: -19px;

  ${({ theme }) => theme.mediaWidth.up500`
    padding-left: 25px;
  `};

  ${props =>
    props.borderRight &&
    css`
      padding-left: 0;
      padding-right: 10px;
      margin-top: 0;
      ${props.theme.mediaWidth.up500`
      padding-left: 0;
      padding-right: 25px;
      border-right: 1px solid rgba(255, 255, 255, 0.15);
    `}
    `};
`;

const RebalancingInfoWrap = styled(Flex)`
  color: '#D5D7DB';
  svg {
    height: auto;
    margin-bottom: 10px;
  }
`;

export default LoanPanel;
