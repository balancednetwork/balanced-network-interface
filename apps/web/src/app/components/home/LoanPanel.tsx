import React from 'react';

import Nouislider from '@/packages/nouislider-react';
import { Trans, t } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import { CurrencyField } from '@/app/components/Form';
import LockBar from '@/app/components/LockBar';
import Modal from '@/app/components/Modal';
import { BoxPanel, BoxPanelWrap } from '@/app/components/Panel';
import Spinner from '@/app/components/Spinner';
import { Typography } from '@/app/theme';
import bnJs from '@/bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from '@/constants/index';
import { useActiveLocale } from '@/hooks/useActiveLocale';
import useInterval from '@/hooks/useInterval';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from '@/store/application/hooks';
import { useCollateralActionHandlers, useDerivedCollateralInfo } from '@/store/collateral/hooks';
import {
  useActiveLoanAddress,
  useDerivedLoanInfo,
  useInterestRate,
  useLoanActionHandlers,
  useLoanParameters,
  useLoanRecipientNetwork,
  useLoanState,
  useLoanUsedAmount,
} from '@/store/loan/hooks';
import { Field } from '@/store/loan/reducer';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import { parseUnits } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';

import ModalContent from '@/app/components/ModalContent';
import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import useWidth from '@/hooks/useWidth';
import { MODAL_ID, modalActions } from '@/lib/xcall/_zustand/useModalStore';
import { useIconReact } from '@/packages/icon-react';
import { PanelInfoItem, PanelInfoWrap, UnderPanel } from './CollateralPanel';
import LoanChainSelector from './_components/LoanChainSelector';
import XLoanModal, { XLoanAction } from './_components/xLoanModal';

const LoanPanel = () => {
  const { account, sourceChain, collateralType } = useDerivedCollateralInfo();
  const { account: iconAccount } = useIconReact();
  const {
    borrowedAmount,
    borrowableAmountWithReserve,
    differenceAmount,
    formattedAmounts,
    parsedAmount,
    totalBorrowableAmount,
    bnUSDAmount,
  } = useDerivedLoanInfo();

  const { isAdjusting, inputType } = useLoanState();

  const locale = useActiveLocale();
  const { data: interestRate } = useInterestRate(collateralType);

  const isSuperSmall = useMedia(`(max-width: ${'es-ES,nl-NL,de-DE,pl-PL'.indexOf(locale) >= 0 ? '450px' : '300px'})`);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const [underPanelRef, underPanelWidth] = useWidth();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  const { onFieldAInput, onFieldBInput, onSlide, onAdjust: adjust } = useLoanActionHandlers();
  const { onAdjust: adjustCollateral } = useCollateralActionHandlers();
  //whether if repay or borrow
  const shouldBorrow = differenceAmount.isPositive();

  const action = shouldBorrow ? XLoanAction.BORROW : XLoanAction.REPAY;
  const [storedModalValues, setStoredModalValues] = React.useState<{
    amount: string;
    before: string;
    after: string;
    action: XLoanAction;
  }>({
    amount: '',
    before: '',
    after: '',
    action: shouldBorrow ? XLoanAction.BORROW : XLoanAction.REPAY,
  });

  const handleEnableAdjusting = () => {
    adjust(true);
    adjustCollateral(false);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
    changeShouldLedgerSign(false);
  };

  //BTCB tmp fix
  const buttonText = borrowedAmount.isZero() ? t`Borrow` : collateralType === 'BTCB' ? t`Repay` : t`Adjust`;

  const currentValue = parseFloat(formattedAmounts[Field.LEFT]);

  const [isLessThanMinimum, setLessThanMinimum] = React.useState(false);
  useInterval(() => {
    if (currentValue > 0 && currentValue < 10 !== isLessThanMinimum) {
      setLessThanMinimum(currentValue > 0 && currentValue < 10);
    }
  }, 2000);

  // loan confirm modal logic & value
  const [open, setOpen] = React.useState(false);

  const loanNetwork = useLoanRecipientNetwork();
  const isCrossChain =
    !(action === XLoanAction.REPAY && loanNetwork === ICON_XCALL_NETWORK_ID) &&
    (loanNetwork !== ICON_XCALL_NETWORK_ID || sourceChain !== ICON_XCALL_NETWORK_ID);

  const toggleOpen = () => {
    if (isCrossChain) {
      setStoredModalValues({
        amount: roundedDisplayDiffAmount.dp(2).toFormat(),
        before: borrowedAmount.dp(2).toFormat(),
        after: parsedAmount[Field.LEFT].dp(2).toFormat(),
        action: shouldBorrow ? XLoanAction.BORROW : XLoanAction.REPAY,
      });
      modalActions.openModal(MODAL_ID.XLOAN_CONFIRM_MODAL);
    } else {
      if (shouldLedgerSign) return;
      setOpen(!open);
      changeShouldLedgerSign(false);
    }
  };

  const { originationFee = 0 } = useLoanParameters() || {};
  //borrow fee
  const fee = differenceAmount.times(originationFee);
  const addTransaction = useTransactionAdder();

  const handleLoanConfirm = () => {
    if (!iconAccount) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (shouldBorrow) {
      bnJs
        .inject({ account: iconAccount })
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
      const repayAmount = parsedAmount[Field.LEFT].isEqualTo(0) ? borrowedAmount : differenceAmount.abs();

      const collateralAddress = sourceChain === ICON_XCALL_NETWORK_ID ? account : `${sourceChain}/${account}`;

      bnJs
        .inject({ account: iconAccount })
        .Loans.returnAsset('bnUSD', parseUnits(repayAmount.toFixed()), collateralType, collateralAddress)
        .then(res => {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Repaying bnUSD...`,
              summary: t`Repaid ${repayAmount.dp(2).toFormat()} bnUSD.`,
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
      sliderInstance.current?.noUiSlider.set(parsedAmount[Field.LEFT].toNumber());
    }
  }, [parsedAmount[Field.LEFT], inputType]);

  const roundedDisplayDiffAmount = parsedAmount[Field.LEFT].minus(borrowedAmount.dp(2));

  const activeLoanAccount = useActiveLoanAddress();
  const usedAmount = useLoanUsedAmount(activeLoanAccount);
  const percent = borrowableAmountWithReserve.isZero()
    ? 0
    : usedAmount.div(borrowableAmountWithReserve).times(100).toNumber();

  const shouldShowLock = !usedAmount.isZero();

  const hasEnoughICX = useHasEnoughICX();

  if (totalBorrowableAmount.isZero() || totalBorrowableAmount.isNegative() || !account) {
    return (
      <BoxPanelWrap>
        <BoxPanel bg="bg3" minHeight={195} sx={{ position: 'relative' }} className="drop-shadow">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">
              <Trans>Loan</Trans>
            </Typography>
          </Flex>

          <Flex minHeight={140} flex={1} justifyContent="center" alignItems="center">
            <Typography>
              <Trans>To borrow bnUSD, deposit collateral.</Trans>
            </Typography>
          </Flex>
        </BoxPanel>
        <UnderPanel justifyContent="space-between">
          <Flex width="100%" justifyContent="space-between" ref={underPanelRef}>
            <LoanChainSelector width={underPanelWidth} containerRef={underPanelRef.current} />
          </Flex>
        </UnderPanel>
      </BoxPanelWrap>
    );
  }

  return (
    <>
      <BoxPanelWrap>
        <BoxPanel bg="bg3" sx={{ position: 'relative' }} className="drop-shadow">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">
              <Trans>Loan</Trans>
            </Typography>
            {account && (
              <Flex flexDirection={isSuperSmall ? 'column' : 'row'} paddingTop={isSuperSmall ? '4px' : '0'}>
                {isAdjusting ? (
                  <>
                    <TextButton
                      onClick={handleCancelAdjusting}
                      marginBottom={isSuperSmall ? '10px' : '0'}
                      paddingLeft={isSuperSmall ? '25px' : '0 !important'}
                      paddingRight="17px !important"
                    >
                      <Trans>Cancel</Trans>
                    </TextButton>
                    <Button
                      disabled={
                        borrowedAmount.isLessThanOrEqualTo(0)
                          ? currentValue >= 0 && currentValue < 10
                          : currentValue < 0
                      }
                      onClick={toggleOpen}
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
            )}
          </Flex>

          {shouldShowLock && <LockBar disabled={!isAdjusting} percent={percent} text={t`Repayable`} />}

          <Box pt={7} pb={isAdjusting ? 5 : 6} style={{ transition: 'all ease 0.3s' }}>
            <Nouislider
              disabled={!isAdjusting}
              id="slider-loan"
              start={[borrowedAmount.dp(2).toNumber()]}
              padding={[
                Math.max(Math.min(usedAmount.dp(2).toNumber(), borrowableAmountWithReserve.dp(2).toNumber()), 0),
                0,
              ]}
              connect={[true, false]}
              range={{
                min: [0],
                // https://github.com/balancednetwork/balanced-network-interface/issues/50
                max: [
                  Number.isNaN(borrowableAmountWithReserve.dp(2).toNumber()) ||
                  borrowableAmountWithReserve.dp(2).isZero()
                    ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                    : borrowableAmountWithReserve.dp(2).toNumber(),
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
        <UnderPanel justifyContent="space-between">
          <Flex width="100%" justifyContent="space-between" ref={underPanelRef}>
            <LoanChainSelector width={underPanelWidth} containerRef={underPanelRef.current} />
          </Flex>
        </UnderPanel>
      </BoxPanelWrap>

      <XLoanModal
        collateralAccount={account}
        bnUSDAmount={bnUSDAmount}
        sourceChain={sourceChain}
        originationFee={fee}
        interestRate={interestRate}
        storedModalValues={storedModalValues}
      />

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
                {borrowedAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {parsedAmount[Field.LEFT].dp(2).toFormat()} bnUSD
              </Typography>
            </Box>
          </Flex>

          {shouldBorrow && (
            <Typography textAlign="center">
              <Trans>Borrow fee:</Trans>
              <strong> {fee.dp(2).toFormat()} bnUSD</strong>
            </Typography>
          )}

          {interestRate && interestRate.isGreaterThan(0) && shouldBorrow && (
            <Typography textAlign="center" mt={4}>
              <Trans>
                Your loan will increase at a rate of{' '}
                <strong>{`${interestRate.times(100).toFixed(2)}%`.replace('.00%', '%')}</strong> per year.
              </Trans>
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
    </>
  );
};

export default LoanPanel;
