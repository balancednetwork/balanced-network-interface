import React from 'react';

import Nouislider from '@/packages/nouislider-react';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import { inputRegex } from '@/app/components/CurrencyInputPanel';
import { Typography } from '@/app/theme';
import {
  useSavingsRateInfo,
  useSavingsRatePastMonthPayout,
  useSavingsSliderActionHandlers,
  useSavingsSliderState,
  useSavingsXChainId,
} from '@/store/savings/hooks';
import { useXTokenBalances } from '@/store/wallet/hooks';
import { escapeRegExp } from '@/utils';
import {
  XToken,
  getNetworkDisplayName,
  getXChainType,
  useXAccount,
  useXLockedBnUSDAmount,
  xTokenMapBySymbol,
} from '@balancednetwork/xwagmi';
import { useXConnect, useXConnectors } from '@balancednetwork/xwagmi';

import QuestionHelper, { QuestionWrapper } from '@/app/components/QuestionHelper';
import { formatValue } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { useQueryClient } from '@tanstack/react-query';
import { UnderlineText } from '../../DropdownText';
import { handleConnectWallet } from '../../WalletModal/WalletItem';
import { BalnPreviewInput as SavingsPreviewInput } from '../BBaln/styledComponents';
import SavingsModal from './SavingsModal';

const Savings = () => {
  const queryClient = useQueryClient();
  const savingsXChainId = useSavingsXChainId();
  const xAccount = useXAccount(getXChainType(savingsXChainId));

  const { data: lockedAmount, refetch: refetchLockedAmount } = useXLockedBnUSDAmount({
    address: xAccount?.address,
    xChainId: savingsXChainId,
  });

  const [executionBnUSDDiff, setExecutionBnUSDDiff] = React.useState<BigNumber | undefined>(undefined);
  const [executionLockedAmount, setExecutionLockedAmount] = React.useState<CurrencyAmount<XToken> | null | undefined>(
    undefined,
  );

  const { typedValue, isAdjusting, inputType } = useSavingsSliderState();
  const { onFieldAInput, onSlide, onAdjust: adjust } = useSavingsSliderActionHandlers();
  const sliderInstance = React.useRef<any>(null);
  const [isOpen, setOpen] = React.useState(false);
  const isSmallScreen = useMedia('(max-width: 540px)');
  const { data: savingsRate } = useSavingsRateInfo();
  const { data: savingsPastMonthPayout } = useSavingsRatePastMonthPayout();

  const bnUSD = xTokenMapBySymbol[savingsXChainId]['bnUSD'];
  const [bnUSDBalance] = useXTokenBalances([bnUSD]);

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

  const bnUSDDiff = React.useMemo(() => {
    if (isAdjusting) {
      const diff = typedValueBN.minus(lockedAmountBN);
      const balance = new BigNumber(bnUSDBalance?.toFixed() || 0);
      if (diff.isGreaterThan(0) && balance.minus(diff).isLessThan(0.01)) {
        return balance;
      } else {
        return typedValueBN.minus(lockedAmountBN);
      }
    } else {
      return new BigNumber(0);
    }
  }, [bnUSDBalance, isAdjusting, lockedAmountBN, typedValueBN]);

  const dynamicDailyAmountRate = React.useMemo(() => {
    if (!savingsRate) return;
    return savingsRate.dailyPayout.div(new BigNumber(savingsRate.totalLocked.toFixed()).plus(bnUSDDiff));
  }, [bnUSDDiff, savingsRate]);

  const staticDailyAmountRate = React.useMemo(() => {
    if (!savingsRate) return;
    return savingsRate.dailyPayout.div(savingsRate.totalLocked.toFixed());
  }, [savingsRate]);

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

  const handleCancel = () => {
    adjust(false);
    onFieldAInput(lockedAmount?.toFixed(2) || '0');
  };

  const xChainType = getXChainType(savingsXChainId);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  const handleConnect = () => {
    handleConnectWallet(xChainType, xConnectors, xConnect);
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
              <Trans>Savings rate</Trans>
            </Typography>
            <Flex>
              <Typography pt={isSmallScreen ? '5px' : '9px'} mr="5px" color="text1">
                {savingsRate?.APR && `${savingsRate.APR.toFormat(2)}% APR`}
              </Typography>
              <QuestionWrapper style={{ marginTop: isSmallScreen ? '4px' : '8px' }}>
                <QuestionHelper
                  width={220}
                  text={
                    <>
                      {savingsRate && (
                        <Typography mr={1}>
                          Paid in bnUSD{' '}
                          <span style={{ opacity: 0.75 }}>{`(${savingsRate.percentAPRbnUSD.toFormat(2)}%)`}</span>, sICX{' '}
                          <span style={{ opacity: 0.75 }}>{`(${savingsRate.percentAPRsICX.toFormat(2)}%)`}</span>, and
                          BALN <span style={{ opacity: 0.75 }}>{`(${savingsRate.percentAPRBALN.toFormat(2)}%)`}</span>.
                        </Typography>
                      )}

                      {savingsPastMonthPayout && (
                        <Flex>
                          <Typography fontSize={14} mt={3}>
                            <strong style={{ marginRight: '5px' }}>
                              {formatValue(savingsPastMonthPayout.toString())}
                            </strong>
                            <span>
                              <Trans>distributed over the last 30 days.</Trans>
                            </span>
                          </Typography>
                        </Flex>
                      )}
                    </>
                  }
                />
              </QuestionWrapper>
            </Flex>
          </Flex>
          {xAccount.address && bnUSDCombinedTotal > 0 && (
            <Flex>
              {isAdjusting && <TextButton onClick={handleCancel}>{t`Cancel`}</TextButton>}
              <Button
                fontSize={14}
                onClick={
                  isAdjusting
                    ? () => {
                        setExecutionBnUSDDiff(bnUSDDiff);
                        setExecutionLockedAmount(lockedAmount);
                        setOpen(true);
                      }
                    : () => adjust(true)
                }
                disabled={isAdjusting && bnUSDDiff.isEqualTo(0)}
              >
                {isAdjusting
                  ? t`Confirm`
                  : lockedAmount?.greaterThan(0) && !bnUSDBalance
                    ? t`Withdraw`
                    : bnUSDBalance?.greaterThan(0) && (!lockedAmount || lockedAmount?.equalTo(0))
                      ? 'Deposit bnUSD'
                      : 'Adjust'}
              </Button>
            </Flex>
          )}
        </Flex>
        {xAccount.address && bnUSDCombinedTotal > 0 ? (
          <>
            <Box margin="30px 0 10px">
              <Nouislider
                disabled={!isAdjusting}
                id="slider-savings"
                start={[Number(lockedAmount?.toFixed() || 0)]}
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
                <Typography fontSize={14}>{`/ ${new BigNumber(bnUSDCombinedTotal).toFormat(2)} bnUSD`}</Typography>
              </Flex>
              {typedValueBN?.isGreaterThan(0) && dynamicDailyAmountRate && staticDailyAmountRate && (
                <Typography fontSize={14}>{`~ $${typedValueBN
                  .times(isAdjusting ? dynamicDailyAmountRate : staticDailyAmountRate)
                  .times(7)
                  .toFormat(2)} weekly`}</Typography>
              )}
            </Flex>
          </>
        ) : !xAccount.address ? (
          <Typography mt={6} mb={5}>
            <UnderlineText onClick={handleConnect} style={{ color: '#2fccdc' }}>
              <Trans>Sign in on {getNetworkDisplayName(savingsXChainId)}</Trans>
            </UnderlineText>
            <Trans>, then deposit bnUSD to earn rewards.</Trans>
          </Typography>
        ) : (
          <Typography fontSize={14} opacity={0.75} mt={6} mb={5} mr={-1}>
            <Trans>Buy or borrow bnUSD(old), then deposit it here to earn rewards.</Trans>
          </Typography>
        )}
      </Box>

      <SavingsModal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        bnUSDDiff={executionBnUSDDiff || new BigNumber(0)}
        lockedAmount={executionLockedAmount}
        onSuccess={async () => {
          await refetchLockedAmount();
          queryClient.invalidateQueries({ queryKey: ['xLockedBnUSDAmounts'] });
          queryClient.invalidateQueries({ queryKey: ['xBalances', savingsXChainId] });
        }}
      />
    </>
  );
};

export default Savings;
