import React, { useMemo, useState } from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { sizes, Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import { useIncentivisedPairs } from 'queries/reward';
import {
  useBBalnAmount,
  useLockedBaln,
  useBBalnSliderState,
  useTotalSupply,
  Source,
  useWorkingBalance,
  useSources,
  useDBBalnAmountDiff,
  usePastMonthFeesDistributed,
} from 'store/bbaln/hooks';
import { useBALNDetails } from 'store/wallet/hooks';

import { BoxPanel } from '../../Panel';
import QuestionHelper from '../../QuestionHelper';
import BBalnSlider from './BBalnSlider';
import {
  BoostedBox,
  BoostedInfo,
  LiquidityDetails,
  LiquidityDetailsWrap,
  PoolItem,
  StyledTypography,
} from './styledComponents';

export default function BBalnPanel() {
  const bBalnAmount = useBBalnAmount();
  const lockedBalnAmount = useLockedBaln();
  const totalSupplyBBaln = useTotalSupply();
  const bbalnAmountDiff = useDBBalnAmountDiff();
  const sources = useSources();
  const { typedValue, isAdjusting } = useBBalnSliderState();
  const getWorkingBalance = useWorkingBalance();
  const [showLiquidityTooltip, setShowLiquidityTooltip] = useState(false);
  const arrowRef = React.useRef(null);
  const balnDetails = useBALNDetails();
  const { data: pastMonthFees } = usePastMonthFeesDistributed();
  const { data: incentivisedPairs } = useIncentivisedPairs();

  const balnBalanceAvailable = useMemo(
    () => (balnDetails && balnDetails['Available balance'] ? balnDetails['Available balance']! : new BigNumber(0)),
    [balnDetails],
  );

  const stakedBalance = balnDetails && balnDetails['Staked balance'];

  const showLPTooltip = () => {
    setShowLiquidityTooltip(true);
  };

  const hideLPTooltip = () => {
    setShowLiquidityTooltip(false);
  };

  const balnSliderAmount = useMemo(() => new BigNumber(typedValue), [typedValue]);
  const beforeBalnAmount = new BigNumber(lockedBalnAmount?.toFixed(0) || 0);
  const differenceBalnAmount = balnSliderAmount.minus(beforeBalnAmount || new BigNumber(0));

  const boostedLPs = useMemo(() => {
    if (sources && incentivisedPairs) {
      const pairNames = incentivisedPairs.map(pair => pair.name);
      return Object.keys(sources).reduce((LPs, sourceName) => {
        if (pairNames.indexOf(sourceName) >= 0 && sources[sourceName].balance.isGreaterThan(0)) {
          LPs[sourceName] = { ...sources[sourceName] };
        }
        return LPs;
      }, {} as { [key in string]: Source });
    }
  }, [sources, incentivisedPairs]);

  const boostedLPNumbers = useMemo(
    () =>
      boostedLPs &&
      Object.values(boostedLPs).map(boostedLP =>
        getWorkingBalance(boostedLP.balance, boostedLP.supply).dividedBy(boostedLP.balance).dp(2).toNumber(),
      ),
    [boostedLPs, getWorkingBalance],
  );

  return (
    <BoxPanel bg="bg2" flex={1}>
      <BBalnSlider
        title={t`Boost rewards`}
        lockupNotice="Lock up BALN to boost your earning potential."
        onActiveSlider={boostedLPs?.length && showLPTooltip}
        onDisabledSlider={hideLPTooltip}
        showMaxRewardsNotice
      />
      {(balnBalanceAvailable.isGreaterThan(0) || bBalnAmount.isGreaterThan(0) || stakedBalance?.isGreaterThan(0)) && (
        <BoostedInfo showBorder>
          <BoostedBox>
            <Typography fontSize={16} color="#FFF">
              {bBalnAmount.isEqualTo(0) && !isAdjusting
                ? 'N/A'
                : totalSupplyBBaln
                ? isAdjusting
                  ? differenceBalnAmount.isGreaterThanOrEqualTo(0)
                    ? `${bBalnAmount
                        .plus(bbalnAmountDiff)
                        .dividedBy(totalSupplyBBaln.plus(bbalnAmountDiff))
                        .times(100)
                        .toPrecision(3)} %`
                    : `${bBalnAmount
                        .minus(bbalnAmountDiff)
                        .dividedBy(totalSupplyBBaln.minus(bbalnAmountDiff))
                        .times(100)
                        .toPrecision(3)} %`
                  : `${bBalnAmount.dividedBy(totalSupplyBBaln).times(100).toPrecision(3)} %`
                : '-'}
            </Typography>
            <Typography marginLeft="14px">
              Network fees
              <QuestionHelper
                iconStyle={{ position: 'relative', transform: 'translate3d(1px, 2px, 0)' }}
                strategy="absolute"
                placement="bottom"
                offset={[0, 15]}
                text={
                  <>
                    <Trans>
                      Your share of the fees distributed to bBALN holders, calculated with Your bBALN ÷ Total bBALN.
                    </Trans>
                    {pastMonthFees && (
                      <Typography mt={2} color="text1">
                        <>{t`$${pastMonthFees.total.toFormat(0)} was distributed over the last 30 days`}</>
                        {totalSupplyBBaln && bBalnAmount && bbalnAmountDiff && bBalnAmount.isGreaterThan(0) ? (
                          <>
                            {t`, so you would have received`}{' '}
                            <strong>{t`$${pastMonthFees?.total
                              .times(
                                bBalnAmount.plus(bbalnAmountDiff).dividedBy(totalSupplyBBaln.plus(bbalnAmountDiff)),
                              )
                              .toFormat(2)}.`}</strong>
                          </>
                        ) : (
                          '.'
                        )}
                      </Typography>
                    )}
                  </>
                }
              />
            </Typography>
          </BoostedBox>
          <BoostedBox>
            <Typography fontSize={16} color="#FFF">
              {sources && sources.Loans.balance.isEqualTo(0)
                ? 'N/A'
                : isAdjusting
                ? sources && totalSupplyBBaln
                  ? `${getWorkingBalance(sources.Loans.balance, sources.Loans.supply)
                      .dividedBy(sources.Loans.balance)
                      .toFixed(2)} x`
                  : '-'
                : sources
                ? `${sources.Loans.workingBalance.dividedBy(sources.Loans.balance).toFixed(2)} x`
                : '-'}
            </Typography>
            <Typography>Loan rewards</Typography>
          </BoostedBox>
          <BoostedBox className="no-border">
            <Typography fontSize={16} color="#FFF">
              {boostedLPNumbers
                ? boostedLPNumbers.length !== 0
                  ? boostedLPNumbers.length === 1 || Math.min(...boostedLPNumbers) === Math.max(...boostedLPNumbers)
                    ? `${boostedLPNumbers[0].toFixed(2)} x`
                    : `${Math.min(...boostedLPNumbers).toFixed(2)} x - ${Math.max(...boostedLPNumbers).toFixed(2)} x`
                  : 'N/A'
                : '-'}
            </Typography>
            <StyledTypography ref={arrowRef}>
              Liquidity rewards{' '}
              <QuestionIcon
                width={14}
                onMouseEnter={showLPTooltip}
                onMouseLeave={hideLPTooltip}
                onTouchStart={showLPTooltip}
              />
            </StyledTypography>
          </BoostedBox>
          <LiquidityDetailsWrap
            show={
              showLiquidityTooltip || (isAdjusting && boostedLPNumbers !== undefined && boostedLPNumbers?.length !== 0)
            }
            ref={ref => {
              if (window.innerWidth >= sizes.upLarge) return;
              const rewardsPanelEl = document.querySelector('.js-rewards-panel') as HTMLDivElement;
              if (rewardsPanelEl !== undefined && ref !== null) {
                rewardsPanelEl.style.marginBottom = ref.offsetHeight - 20 + 'px';
              }
            }}
          >
            <LiquidityDetails>
              {boostedLPNumbers !== undefined && boostedLPNumbers?.length !== 0 ? (
                boostedLPs &&
                Object.keys(boostedLPs).map(boostedLP => (
                  <PoolItem key={boostedLP}>
                    <Typography fontSize={16} color="#FFF">
                      {`${getWorkingBalance(boostedLPs[boostedLP].balance, boostedLPs[boostedLP].supply)
                        .dividedBy(boostedLPs[boostedLP].balance)
                        .toFixed(2)} x`}
                    </Typography>
                    <Typography fontSize={14} style={{ whiteSpace: 'nowrap' }}>
                      {boostedLP}
                    </Typography>
                  </PoolItem>
                ))
              ) : (
                <Typography paddingTop="10px" marginBottom="-5px" maxWidth={250} textAlign="left">
                  <Trans>To earn liquidity rewards, supply liquidity to a BALN-incentivised pool.</Trans>
                </Typography>
              )}
            </LiquidityDetails>
          </LiquidityDetailsWrap>
        </BoostedInfo>
      )}
    </BoxPanel>
  );
}
