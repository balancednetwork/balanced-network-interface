import React, { useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'packages/nouislider-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { inputRegex } from 'app/components/Form';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import { MenuItem, MenuList } from 'app/components/Menu';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import {
  useBBalnAmount,
  useBBalnSliderState,
  useBBalnSliderActionHandlers,
  useLockedPeriod,
  useLockedUntil,
  useSetBoost,
} from 'store/bbaln/hooks';
import { Field } from 'store/loan/actions';
// import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX } from 'store/wallet/hooks';
import { escapeRegExp } from 'utils'; // match escaped "." characters via in a non-capturing group

import { BoxPanel } from '../../Panel';
import { DropdownPopper } from '../../Popover';
import QuestionHelper from '../../QuestionHelper';
import { MetaData } from '../PositionDetailPanel';
import { LockedPeriod } from './types';
import { lockingPeriods, formatDate } from './utils';

const ButtonsWrap = styled(Flex)`
  margin-left: auto;
  flex-direction: row;

  @media screen and (max-width: 400px) {
    flex-direction: column;
  }
`;

const SliderWrap = styled(Box)`
  margin: 25px 0;

  .noUi-horizontal .noUi-connects {
    background: #144a68;
    border-radius: 5px;
  }

  .lockup-notice {
    /* transition: all ease 0.2s; */
    opacity: 0;
    transform: translate3d(0, -5px, 0);

    &.show {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
`;

const BoostedInfo = styled(Flex)`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
  position: relative;
  flex-wrap: wrap;
`;

const BoostedBox = styled(Flex)`
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  flex-flow: column;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  width: 33.333%;

  &.no-border {
    border-right: 0;
  }

  @media screen and (max-width: 600px) {
    width: 100%;
    border-right: 0;
    margin-bottom: 20px;

    &.no-border {
      border-right: 0;
      margin-bottom: 0;
    }
  }
`;

const StyledTypography = styled(Typography)`
  position: relative;
  padding: 0 20px;
  margin: 0 -20px;

  svg {
    position: absolute;
    right: 0;
    top: 3px;
    cursor: help;
  }
`;

const PoolItem = styled(Flex)`
  min-width: 120px;
  width: 100%;
  max-width: 25%;
  padding: 15px 15px 0 15px;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  @media screen and (max-width: 600px) {
    max-width: 33.333%;
  }

  @media screen and (max-width: 500px) {
    max-width: 50%;
  }

  @media screen and (max-width: 360px) {
    max-width: 100%;
  }
`;

const BalnPreviewInput = styled.input`
  background: ${({ theme }) => theme.colors.bg5};
  padding: 3px 10px;
  border-radius: 10px;
  border: 2px solid ${({ theme }) => theme.colors.bg5};
  color: #d5d7db;
  font-size: 14px;
  text-align: right;
  width: 80px;
  outline: none;
  margin-right: 4px;
  transition: all ease 0.2s;

  &:focus,
  &:hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
  }

  &[disabled] {
    background: transparent;
  }
`;

const Threshold = styled(Box)<{ position: number }>`
  left: ${({ position }) => position + '%'};
  position: absolute;
  width: 1px;
  height: 25px;
  margin-top: -15px;
  background: #fff;

  ::after {
    position: absolute;
    content: '';
    top: 0;
    width: 10px;
    height: 1px;
    margin-left: -10px;
    transition: height 0.3s ease;
    background: #fff;
  }

  ${MetaData} {
    width: 60px;
    margin-left: -75px;

    dd {
      color: rgba(255, 255, 255, 1);
    }
  }
`;

const LiquidityDetailsWrap = styled(Box)<{ show?: boolean }>`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 20px;
  width: 100%;
  text-align: right;
  opacity: 0;
  z-index: -1;
  pointer-events: none;
  transition: all ease 0.2s;

  ${({ show }) =>
    show &&
    css`
      opacity: 1;
      z-index: 1;
      pointer-events: all;
    `}

  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid ${({ theme }) => theme.colors.primary};
    position: absolute;
    bottom: 100%;
    margin-bottom: -2px;
    right: calc(16.666% - 13px);

    @media screen and (max-width: 600px) {
      right: calc(50% - 12px);
    }
  }
`;

const LiquidityDetails = styled(Flex)`
  flex-wrap: wrap;
  display: inline-flex;
  padding: 0 15px 15px 15px;
  background: ${({ theme }) => theme.colors.bg2};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  width: auto;
`;

const MaxRewardsReachedNotice = styled(Box)<{ show?: boolean }>`
  opacity: 0;
  pointer-events: none;
  transition: opacity ease 0.2s;
  ${({ theme, show }) =>
    css`
      background: ${theme.colors.bg2};
      border: 2px solid ${theme.colors.primary};

      ${show && 'opacity: 1;'}
      ${show && 'pointer-events: all;'}
    `}
  border-radius: 10px;
  padding: 15px;
  font-size: 14px;
  color: #fff;
  position: absolute;
  bottom: 100%;
  margin-bottom: -2px;

  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 12px solid ${({ theme }) => theme.colors.primary};
    position: absolute;
    top: 100%;
    right: calc(50% - 12px);
  }

  @media screen and (max-width: 600px) {
    ${({ show }) =>
      css`
        ${show && 'position: relative;'}
      `}

    transition: none;
    top: 0;
    transform: translate3d(0, -13px, 0);
  }
`;

export default function BBalnPanel() {
  const bBalnAmount = useBBalnAmount();
  //const lockedBaln = useLockedBaln();
  const lockedUntil = useLockedUntil();
  //const lockedOn = useLockedOn();
  const lockedPeriod = useLockedPeriod();
  const { independentField, typedValue, isAdjusting, inputType } = useBBalnSliderState();
  const { onFieldAInput, onSlide, onAdjust: adjust } = useBBalnSliderActionHandlers();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;
  const sliderInstance = React.useRef<any>(null);
  const [showLiquidityTooltip, setShowLiquidityTooltip] = useState(false);
  const arrowRef = React.useRef(null);
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const shouldLedgerSign = useShouldLedgerSign();
  const [periodDropdownAnchor, setPeriodDropdownAnchor] = useState<HTMLElement | null>(null);
  const [selectedLockedPeriod, setSelectedLockedPeriod] = useState<LockedPeriod>(lockingPeriods[0]);
  const periodArrowRef = useRef(null);
  const balnDetails = useBALNDetails();
  const hasEnoughICX = useHasEnoughICX();
  const setBoost = useSetBoost();
  const isSmallScreen = useMedia('(max-width: 540px)');
  const isSuperSmallScreen = useMedia('(max-width: 400px)');

  const balnBalanceAvailable =
    balnDetails && balnDetails['Available balance'] ? balnDetails['Available balance']! : new BigNumber(0);

  const handleEnableAdjusting = () => {
    adjust(true);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
    setPeriodDropdownAnchor(null);
    setShowLiquidityTooltip(false);
    changeShouldLedgerSign(false);
  };

  const showLPTooltip = () => {
    setShowLiquidityTooltip(true);
  };

  const hideLPTooltip = () => {
    setShowLiquidityTooltip(false || isAdjusting);
  };

  const handleBoostUpdate = () => {
    setBoost(new BigNumber(typedValue), new Date(), selectedLockedPeriod, new BigNumber(typedValue));
    setConfirmationModalOpen(false);
  };

  const [confirmationModalOpen, setConfirmationModalOpen] = React.useState(false);

  const toggleConfirmationModalOpen = () => {
    if (shouldLedgerSign) return;
    setConfirmationModalOpen(!confirmationModalOpen);
  };

  const parsedBBalnAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    // total Baln
    [dependentField]: new BigNumber(4000).minus(new BigNumber(typedValue || '0')),
  };

  // bbaln > 0
  const buttonText = bBalnAmount?.isZero() ? 'Boost' : 'Adjust';

  //before
  const beforeBBalnAmount = bBalnAmount;
  //after
  const afterBBalnAmount = parsedBBalnAmount[Field.LEFT];
  //difference = after-before
  const differenceBBalnAmount = afterBBalnAmount.minus(beforeBBalnAmount || new BigNumber(0));

  const shouldBoost = differenceBBalnAmount.isPositive();

  // const addTransaction = useTransactionAdder();

  // reset loan ui state if cancel adjusting
  // change typedValue if sICX and ratio changes
  React.useEffect(() => {
    if (!isAdjusting) {
      onFieldAInput(bBalnAmount !== undefined ? (bBalnAmount.isZero() ? '0' : bBalnAmount?.toFixed(2)) : '0');
    }
  }, [onFieldAInput, bBalnAmount, isAdjusting]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(afterBBalnAmount.toNumber());
    }
  }, [afterBBalnAmount, inputType]);

  const shouldShowLock = bBalnAmount && !bBalnAmount.isZero();
  const lockbarPercentPosition = bBalnAmount.times(100).div(balnBalanceAvailable).toNumber();

  const handleLockingPeriodChange = period => {
    setSelectedLockedPeriod(period);
  };

  const handlePeriodDropdownToggle = (e: React.MouseEvent<HTMLElement>) => {
    setPeriodDropdownAnchor(periodDropdownAnchor ? null : periodArrowRef.current);
  };

  const closeDropdown = () => {
    setPeriodDropdownAnchor(null);
  };

  const handleBBalnInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextUserInput = event.target.value.replace(/,/g, '.');

    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      let nextInput = nextUserInput;
      const value = new BigNumber(nextUserInput || '0');

      if (value.isGreaterThan(balnBalanceAvailable)) {
        nextInput = balnBalanceAvailable.dp(2).toFixed();
      } else if (value.isLessThan(0)) {
        nextInput = '0';
      }

      onFieldAInput(nextInput);
    }
  };

  //temporary
  const isMaxRewardsReached = parsedBBalnAmount[Field.LEFT].isGreaterThan(balnBalanceAvailable.times(0.8));

  return (
    <BoxPanel bg="bg2" flex={1}>
      {balnBalanceAvailable.isGreaterThan(0) ? (
        <>
          <Flex alignItems={isSmallScreen ? 'flex-start' : 'flex-end'}>
            <Flex
              flexDirection={isSmallScreen ? 'column' : 'row'}
              alignItems={isSmallScreen ? 'flex-start' : 'flex-end'}
            >
              <Typography variant="h3" paddingRight={'10px'} paddingBottom={isSmallScreen ? '5px' : '0'}>
                Boost rewards{' '}
              </Typography>
              <Typography padding="0 3px 2px 0">
                {parsedBBalnAmount[Field.LEFT].toFormat()} bBALN
                <QuestionHelper text="Lock BALN to boost your earning potential. The longer you lock it, the more bBALN (boosted BALN) you'll receive, which determines your earning and voting power." />
              </Typography>
            </Flex>

            <ButtonsWrap>
              {isAdjusting ? (
                <>
                  <TextButton onClick={handleCancelAdjusting} marginBottom={isSuperSmallScreen ? '5px' : 0}>
                    Cancel
                  </TextButton>
                  <Button
                    disabled={
                      differenceBBalnAmount.isZero() &&
                      (lockedPeriod === undefined || selectedLockedPeriod.days === lockedPeriod?.days)
                    }
                    onClick={toggleConfirmationModalOpen}
                    fontSize={14}
                  >
                    Confirm
                  </Button>
                </>
              ) : (
                <Button onClick={handleEnableAdjusting} fontSize={14}>
                  {buttonText}
                </Button>
              )}
            </ButtonsWrap>
          </Flex>
          <SliderWrap>
            <Typography className={`lockup-notice${isAdjusting ? '' : ' show'}`}>
              Lock up BALN to boost your earning potential.
            </Typography>

            {shouldShowLock && isAdjusting && (
              <Box style={{ position: 'relative' }}>
                <Threshold position={lockbarPercentPosition}>
                  <MetaData as="dl" style={{ textAlign: 'right' }}>
                    <dd>Locked</dd>
                  </MetaData>
                </Threshold>
              </Box>
            )}

            <Box margin="10px 0">
              <Nouislider
                disabled={!isAdjusting}
                id="slider-bbaln"
                start={[bBalnAmount?.dp(2).toNumber() || 0]}
                connect={[true, false]}
                step={1}
                range={{
                  min: [0],
                  max: [balnBalanceAvailable.toNumber()], //baln balance - max SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, boostableAmount
                }}
                instanceRef={instance => {
                  if (instance) {
                    sliderInstance.current = instance;
                  }
                }}
                onSlide={onSlide}
              />
            </Box>

            <Flex justifyContent="space-between" flexWrap={'wrap'}>
              <Flex alignItems="center">
                {isAdjusting ? (
                  <BalnPreviewInput
                    type="text"
                    disabled={!isAdjusting}
                    value={parsedBBalnAmount[Field.LEFT].toNumber()}
                    onChange={handleBBalnInputChange}
                  />
                ) : (
                  <Typography paddingRight={'5px'}>{parsedBBalnAmount[Field.LEFT].toFormat()}</Typography>
                )}

                <Typography paddingRight={'15px'}> / {balnBalanceAvailable.toFormat()} BALN</Typography>
              </Flex>

              {(bBalnAmount?.isGreaterThan(0) || isAdjusting) && (
                <Typography paddingTop={isAdjusting ? '6px' : '0'}>
                  {shouldBoost ? (
                    <>
                      Locked until{' '}
                      {isAdjusting ? (
                        <>
                          <ClickAwayListener onClickAway={closeDropdown}>
                            <UnderlineTextWithArrow
                              onClick={handlePeriodDropdownToggle}
                              text={formatDate(
                                new Date(new Date().setDate(new Date().getDate() + selectedLockedPeriod.days)),
                              )}
                              arrowRef={periodArrowRef}
                            />
                          </ClickAwayListener>
                          <DropdownPopper
                            show={Boolean(periodDropdownAnchor)}
                            anchorEl={periodDropdownAnchor}
                            placement="bottom-end"
                          >
                            <MenuList>
                              {lockingPeriods
                                .filter(period => {
                                  return lockedUntil
                                    ? lockedUntil < new Date(new Date().setDate(new Date().getDate() + period.days))
                                    : true;
                                })
                                .map(
                                  period => (
                                    // lockingPeriods[period].days !== timePeriod.days && (
                                    <MenuItem key={period.days} onClick={() => handleLockingPeriodChange(period)}>
                                      {period.name}
                                    </MenuItem>
                                  ),
                                  // ),
                                )}
                            </MenuList>
                          </DropdownPopper>
                        </>
                      ) : (
                        formatDate(lockedUntil)
                      )}
                    </>
                  ) : (
                    <Typography fontSize={14} color="#fb6a6a">
                      You'll need to pay a 50% fee to unlock BALN early.
                    </Typography>
                  )}
                </Typography>
              )}
            </Flex>
          </SliderWrap>
          {parsedBBalnAmount[Field.LEFT].isGreaterThan(0) && (
            <BoostedInfo>
              <BoostedBox>
                <Typography fontSize={16} color="#FFF">
                  0.03 %
                </Typography>
                <Typography>Network fees</Typography>
              </BoostedBox>
              <BoostedBox>
                <MaxRewardsReachedNotice show={isAdjusting && isMaxRewardsReached}>Max rewards</MaxRewardsReachedNotice>
                <Typography fontSize={16} color="#FFF">
                  1.88 x
                </Typography>
                <Typography>Loan rewards</Typography>
              </BoostedBox>
              <BoostedBox className="no-border">
                <Typography fontSize={16} color="#FFF">
                  1.72 x 0 1.85 x
                </Typography>
                <StyledTypography ref={arrowRef}>
                  Liquidity rewards{' '}
                  <QuestionIcon width={14} onMouseEnter={showLPTooltip} onMouseLeave={hideLPTooltip} />
                </StyledTypography>
              </BoostedBox>
              <LiquidityDetailsWrap show={showLiquidityTooltip || isAdjusting}>
                <LiquidityDetails>
                  <PoolItem>
                    <Typography fontSize={16} color="#FFF">
                      1.73 x
                    </Typography>
                    <Typography fontSize={14}>bnUSD / sICX</Typography>
                  </PoolItem>
                  <PoolItem>
                    <Typography fontSize={16} color="#FFF">
                      1.73 x
                    </Typography>
                    <Typography fontSize={14}>bnUSD / sICX</Typography>
                  </PoolItem>
                  <PoolItem>
                    <Typography fontSize={16} color="#FFF">
                      1.73 x
                    </Typography>
                    <Typography fontSize={14}>bnUSD / sICX</Typography>
                  </PoolItem>
                  <PoolItem>
                    <Typography fontSize={16} color="#FFF">
                      1.73 x
                    </Typography>
                    <Typography fontSize={14}>bnUSD / sICX</Typography>
                  </PoolItem>
                  <PoolItem>
                    <Typography fontSize={16} color="#FFF">
                      1.73 x
                    </Typography>
                    <Typography fontSize={14}>bnUSD / sICX</Typography>
                  </PoolItem>
                  <PoolItem>
                    <Typography fontSize={16} color="#FFF">
                      1.73 x
                    </Typography>
                    <Typography fontSize={14}>bnUSD / sICX</Typography>
                  </PoolItem>
                </LiquidityDetails>
              </LiquidityDetailsWrap>
            </BoostedInfo>
          )}
        </>
      ) : (
        <>
          <Typography variant="h3" marginBottom={6}>
            Boost rewards
          </Typography>
          <Typography fontSize={14} opacity={0.75}>
            Earn or buy BALN, then lock it up here to boost your earning potential and voting power.
          </Typography>
        </>
      )}

      <Modal isOpen={confirmationModalOpen} onDismiss={toggleConfirmationModalOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldBoost ? 'Lock up Balance Tokens?' : 'Unlock Balance Tokens?'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceBBalnAmount.abs().toFormat()} BALN
          </Typography>
          {!shouldBoost && (
            <Typography textAlign="center" fontSize={14} color="#fb6a6a">
              Minus 50% fee: {differenceBBalnAmount.div(2).abs().toFormat()} BALN
            </Typography>
          )}

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {balnBalanceAvailable.minus(bBalnAmount).toFormat()} BALN
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {balnBalanceAvailable
                  .minus(bBalnAmount)
                  .minus(shouldBoost ? differenceBBalnAmount : differenceBBalnAmount.div(2))
                  .toFormat()}{' '}
                BALN
              </Typography>
            </Box>
          </Flex>

          {shouldBoost && (
            <Typography textAlign="center">
              Your BALN will be locked until{' '}
              <strong>
                {formatDate(new Date(new Date().setDate(new Date().getDate() + selectedLockedPeriod.days)))}
              </strong>
            </Typography>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top" flexWrap={'wrap'}>
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleConfirmationModalOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleBoostUpdate} fontSize={14} warning={!shouldBoost}>
                  {shouldBoost ? 'Lock up BALN' : 'Unlock BALN for a 50% fee'}
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </BoxPanel>
  );
}
