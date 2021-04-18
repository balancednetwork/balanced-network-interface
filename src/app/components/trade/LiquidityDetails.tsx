import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { Flex, Box } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { Wrapper, UnderlineText, UnderlineTextWithArrow } from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST } from 'constants/currency';
import { useLiquiditySupply, useChangeLiquiditySupply } from 'store/liquidity/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useReward } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import { withdrawMessage } from './utils';

const LiquidityDetails = () => {
  const { account } = useIconReact();

  const changeLiquiditySupply = useChangeLiquiditySupply();
  const liquiditySupply = useLiquiditySupply();
  const addTransaction = useTransactionAdder();
  const balances = useWalletBalances();
  const ratio = useRatio();
  const poolReward = useReward();

  const sICXbnUSDTotalSupply = liquiditySupply.sICXbnUSDTotalSupply || new BigNumber(0);
  const sICXbnUSDSuppliedShare =
    liquiditySupply.sICXbnUSDBalance?.dividedBy(sICXbnUSDTotalSupply)?.multipliedBy(100) || new BigNumber(0);

  const BALNbnUSDTotalSupply = liquiditySupply.BALNbnUSDTotalSupply || new BigNumber(0);
  const BALNbnUSDSuppliedShare =
    liquiditySupply.BALNbnUSDBalance?.dividedBy(BALNbnUSDTotalSupply)?.multipliedBy(100) || new BigNumber(0);

  const sICXICXTotalSupply = liquiditySupply.sICXICXTotalSupply || new BigNumber(0);
  const ICXBalance = liquiditySupply.ICXBalance || new BigNumber(0);
  const sICXICXSuppliedShare = ICXBalance.dividedBy(sICXICXTotalSupply).multipliedBy(100);

  //const [amountWithdrawICX, setAmountWithdrawICX] = React.useState('0');

  const [showSwapConfirm, setShowWithdrawConfirm] = React.useState(false);

  const [inputCurrency, setInputCurrency] = React.useState('');

  const [outputCurrency, setOutputCurrency] = React.useState('');

  const [withdrawInputAmount, setwithdrawInputAmount] = React.useState('0');

  const [withdrawOutputAmount, setwithdrawOutputAmount] = React.useState('0');

  const handleWithdrawConfirmDismiss = () => {
    setShowWithdrawConfirm(false);
  };

  const [anchorSICXbnUSD, setAnchorSICXbnUSD] = React.useState<HTMLElement | null>(null);
  const [anchorBALNbnUSD, setAnchorBALNbnUSD] = React.useState<HTMLElement | null>(null);
  //const [anchorSICXICX, setAnchorSICXICX] = React.useState<HTMLElement | null>(null);

  const arrowRefSICXbnUSD = React.useRef(null);
  const arrowRefBALNbnUSD = React.useRef(null);
  //const arrowRefSICXICX = React.useRef(null);

  const closeDropdownSICXbnUSD = () => {
    setAnchorSICXbnUSD(null);
  };

  const closeDropdownBALNbnUSD = () => {
    setAnchorBALNbnUSD(null);
  };

  // const closeDropdownSICXICX = () => {
  //   setAnchorSICXICX(null);
  // };

  const handleToggleDropdownSICXbnUSD = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorSICXbnUSD(anchorSICXbnUSD ? null : arrowRefSICXbnUSD.current);
  };

  const handleToggleDropdownBALNbnUSD = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorBALNbnUSD(anchorBALNbnUSD ? null : arrowRefBALNbnUSD.current);
  };

  // const handleToggleDropdownSICXICX = (e: React.MouseEvent<HTMLElement>) => {
  //   setAnchorSICXICX(anchorSICXICX ? null : arrowRefSICXICX.current);
  // };

  React.useEffect(() => {
    //setAmountWithdrawICX('0');
    setAmountWithdrawBALNPoolBALNbnUSD('0');
    setAmountWithdrawBNUSDPoolsBALNbnUSD('0');
    setAmountWithdrawSICXPoolsICXbnUSD('0');
    setAmountWithdrawBNUSDPoolsICXbnUSD('0');
  }, [liquiditySupply.ICXBalance]);

  const [amountWithdrawsICXbnUSDMax, setAmountWithdrawsICXbnUSDMax] = React.useState(0);

  React.useEffect(() => {
    if (
      liquiditySupply.sICXSuppliedPoolsICXbnUSD
        ?.multipliedBy(ratio.sICXbnUSDratio)
        .isLessThanOrEqualTo(liquiditySupply.bnUSDSuppliedPoolsICXbnUSD || new BigNumber(0))
    ) {
      setAmountWithdrawsICXbnUSDMax(liquiditySupply.sICXSuppliedPoolsICXbnUSD?.toNumber() || 0);
    } else {
      setAmountWithdrawsICXbnUSDMax(liquiditySupply.bnUSDSuppliedPoolsICXbnUSD?.toNumber() || 0);
    }
  }, [liquiditySupply.sICXSuppliedPoolsICXbnUSD, liquiditySupply.bnUSDSuppliedPoolsICXbnUSD, ratio.sICXbnUSDratio]);

  const [amountWithdrawBALNbnUSDMax, setAmountWithdrawBALNbnUSDMax] = React.useState('0');

  React.useEffect(() => {
    if (
      liquiditySupply.BALNSuppliedPoolBALNbnUSD?.multipliedBy(ratio.BALNbnUSDratio).isLessThanOrEqualTo(
        liquiditySupply.bnUSDSuppliedPoolBALNbnUSD || new BigNumber(0),
      )
    ) {
      setAmountWithdrawBALNbnUSDMax(liquiditySupply.BALNSuppliedPoolBALNbnUSD?.toString() || '0');
    } else {
      setAmountWithdrawBALNbnUSDMax(liquiditySupply.bnUSDSuppliedPoolBALNbnUSD?.toString() || '0');
    }
  }, [liquiditySupply.BALNSuppliedPoolBALNbnUSD, liquiditySupply.bnUSDSuppliedPoolBALNbnUSD, ratio.BALNbnUSDratio]);

  // const handleTypeAmountWithdrawICX = (val: string) => {
  //   setAmountWithdrawICX(val);
  // };

  const sICXICXpoolDailyReward =
    (poolReward.sICXICXreward?.toNumber() || 0) * (poolReward.poolDailyReward?.toNumber() || 0);

  const sICXbnUSDpoolDailyReward = poolReward.sICXbnUSDreward?.multipliedBy(
    poolReward.poolDailyReward || new BigNumber(0),
  );

  const BALNbnUSDpoolDailyReward = poolReward.BALNbnUSDreward?.multipliedBy(
    poolReward.poolDailyReward || new BigNumber(0),
  );

  const handleWithdrawConfirm = () => {
    if (inputCurrency.toLowerCase() === 'sicx' && outputCurrency.toLowerCase() === 'bnusd') {
      withdrawSICXBNUSD(withdrawInputAmount, withdrawOutputAmount);
    } else if (inputCurrency.toLowerCase() === 'baln' && outputCurrency.toLowerCase() === 'bnusd') {
      withdrawBALNbnUSD(withdrawInputAmount, withdrawOutputAmount);
    } else if (inputCurrency.toLowerCase() === 'icx' && outputCurrency.toLowerCase() === 'sicx') {
      withdrawICX(formatBigNumber(ICXBalance, 'currency'));
    }
  };

  const handleWithdrawSICXICX = () => {
    if (!account) return;
    setInputCurrency('ICX');
    setOutputCurrency('sICX');
    setwithdrawInputAmount(formatBigNumber(new BigNumber(ICXBalance), 'currency'));
    setwithdrawOutputAmount('');
    //setAmountWithdrawICX(formatBigNumber(new BigNumber(ICXBalance), 'currency'));
    //closeDropdownSICXICX();
    setShowWithdrawConfirm(true);
  };

  const handleWithdrawSICXbnUSD = () => {
    if (!account) return;
    setInputCurrency('sICX');
    setOutputCurrency('bnUSD');
    setwithdrawInputAmount(amountWithdrawSICXPoolsICXbnUSD);
    setwithdrawOutputAmount(amountWithdrawBNUSDPoolsICXbnUSD);
    closeDropdownSICXbnUSD();
    setShowWithdrawConfirm(true);
  };

  const handleWithdrawBALNbnUSD = () => {
    if (!account) return;
    setInputCurrency('BALN');
    setOutputCurrency('bnUSD');
    setwithdrawInputAmount(amountWithdrawBALNPoolBALNbnUSD);
    setwithdrawOutputAmount(amountWithdrawBNUSDPoolBALNbnUSD);
    closeDropdownBALNbnUSD();
    setShowWithdrawConfirm(true);
  };

  const withdrawICX = (withdrawICXamount: string) => {
    if (!account) return;
    bnJs
      .inject({ account: account })
      .Dex.cancelSicxIcxOrder()
      .then(res => {
        changeLiquiditySupply({ ICXBalance: new BigNumber(0) });
        addTransaction(
          { hash: res.result || res },
          {
            pending: withdrawMessage(withdrawICXamount, 'ICX', '', 'sICX').pendingMessage,
            summary: withdrawMessage(withdrawICXamount, 'ICX', '', 'sICX').successMessage,
          },
        );
        handleWithdrawConfirmDismiss();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const withdrawSICXBNUSD = (withdrawSICXamount: string, withdrawBNUSDamount: string) => {
    if (!account) return;
    let withdrawTotal = new BigNumber(0);
    if (
      parseFloat(withdrawSICXamount) >= amountWithdrawsICXbnUSDMax ||
      parseFloat(withdrawBNUSDamount) >= amountWithdrawsICXbnUSDMax
    ) {
      withdrawTotal = liquiditySupply.sICXbnUSDBalance || new BigNumber(0);
    } else {
      withdrawTotal = new BigNumber(withdrawSICXamount)
        .dividedBy(liquiditySupply.sICXPoolsICXbnUSDTotal || new BigNumber(0))
        .multipliedBy(liquiditySupply.sICXbnUSDTotalSupply || new BigNumber(0));
    }

    bnJs
      .inject({ account: account })
      .Dex.remove(BalancedJs.utils.POOL_IDS.sICXbnUSD, withdrawTotal)
      .then(result => {
        console.log(result);
        addTransaction(
          { hash: result.result },
          {
            pending: withdrawMessage(amountWithdrawSICXPoolsICXbnUSD, 'sICX', amountWithdrawBNUSDPoolsICXbnUSD, 'bnUSD')
              .pendingMessage,
            summary: `${amountWithdrawSICXPoolsICXbnUSD} sICX and ${amountWithdrawBNUSDPoolsICXbnUSD} bnUSD added to your wallet.`,
          },
        );
        handleWithdrawConfirmDismiss();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const withdrawBALNbnUSD = (withdrawBALNamount: string, withdrawBNUSDamount: string) => {
    if (!account) return;
    let withdrawTotal = new BigNumber(0);
    if (
      parseFloat(withdrawBALNamount) >= parseFloat(amountWithdrawBALNbnUSDMax) ||
      parseFloat(withdrawBNUSDamount) >= parseFloat(amountWithdrawBALNbnUSDMax)
    ) {
      withdrawTotal = liquiditySupply.BALNbnUSDBalance || new BigNumber(0);
    } else {
      withdrawTotal = new BigNumber(withdrawBALNamount)
        .dividedBy(liquiditySupply.BALNPoolBALNbnUSDTotal || new BigNumber(0))
        .multipliedBy(liquiditySupply.BALNbnUSDTotalSupply || new BigNumber(0));
    }

    bnJs
      .inject({ account: account })
      .Dex.remove(BalancedJs.utils.POOL_IDS.BALNbnUSD, new BigNumber(withdrawTotal))
      .then(result => {
        console.log(result);
        addTransaction(
          { hash: result.result },
          {
            pending: withdrawMessage(amountWithdrawBALNPoolBALNbnUSD, 'BALN', amountWithdrawBNUSDPoolBALNbnUSD, 'bnUSD')
              .pendingMessage,
            summary: `${amountWithdrawBALNPoolBALNbnUSD} BALN and ${amountWithdrawBNUSDPoolBALNbnUSD} bnUSD added to your wallet.`,
          },
        );
        handleWithdrawConfirmDismiss();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const [amountWithdrawSICXPoolsICXbnUSD, setAmountWithdrawSICXPoolsICXbnUSD] = React.useState('0');
  const [amountWithdrawBNUSDPoolsICXbnUSD, setAmountWithdrawBNUSDPoolsICXbnUSD] = React.useState('0');

  const handleTypeAmountWithdrawsICXPoolsICXbnUSD = (val: string) => {
    setAmountWithdrawSICXPoolsICXbnUSD(val);
    let outputAmount = new BigNumber(val).multipliedBy(ratio.sICXbnUSDratio);
    if (outputAmount.isNaN()) outputAmount = new BigNumber(0);
    setAmountWithdrawBNUSDPoolsICXbnUSD(formatBigNumber(outputAmount, 'input'));
  };

  const handleTypeAmountWithdrawBNUSDPoolsICXbnUSD = (val: string) => {
    setAmountWithdrawBNUSDPoolsICXbnUSD(val);
    let inputAmount = new BigNumber(val).multipliedBy(new BigNumber(1).dividedBy(ratio.sICXbnUSDratio));
    if (inputAmount.isNaN()) inputAmount = new BigNumber(0);
    setAmountWithdrawSICXPoolsICXbnUSD(formatBigNumber(inputAmount, 'input'));
  };

  /** withdraw BALNbnUSD */

  const [amountWithdrawBALNPoolBALNbnUSD, setAmountWithdrawBALNPoolBALNbnUSD] = React.useState('0');
  const [amountWithdrawBNUSDPoolBALNbnUSD, setAmountWithdrawBNUSDPoolsBALNbnUSD] = React.useState('0');

  const handleTypeAmountWithdrawBALNPoolBALNbnUSD = (val: string, inputType?: 'slider' | 'text') => {
    if (inputType === 'slider') {
      setAmountWithdrawBALNPoolBALNbnUSD(formatBigNumber(new BigNumber(val), 'input'));
    } else {
      setAmountWithdrawBALNPoolBALNbnUSD(val);
    }
    let outputAmount = new BigNumber(val).multipliedBy(ratio.BALNbnUSDratio);
    if (outputAmount.isNaN()) outputAmount = new BigNumber(0);
    setAmountWithdrawBNUSDPoolsBALNbnUSD(formatBigNumber(outputAmount, 'input'));
  };

  const handleTypeAmountWithdrawBNUSDPoolBALNbnUSD = (val: string) => {
    setAmountWithdrawBNUSDPoolsBALNbnUSD(val);
    let inputAmount = new BigNumber(val).multipliedBy(new BigNumber(1).dividedBy(ratio.BALNbnUSDratio));
    if (inputAmount.isNaN()) inputAmount = new BigNumber(0);
    setAmountWithdrawBALNPoolBALNbnUSD(formatBigNumber(inputAmount, 'input'));
  };

  if (
    !account ||
    (formatBigNumber(liquiditySupply.sICXSuppliedPoolsICXbnUSD, 'currency') === '0' &&
      formatBigNumber(liquiditySupply.BALNSuppliedPoolBALNbnUSD, 'currency') === '0' &&
      formatBigNumber(liquiditySupply.ICXBalance, 'currency') === '0')
  ) {
    return null;
  }

  // const handleSlideWithdrawalICX = (values: string[], handle: number) => {
  //   setAmountWithdrawICX(values[handle]);
  // };

  const handleSlideWithdrawsICXPoolsICXbnUSD = (values: string[], handle: number) => {
    handleTypeAmountWithdrawsICXPoolsICXbnUSD(values[handle]);
  };

  const handleSlideWithdrawBALNPoolBALNbnUSD = (values: string[], handle: number) => {
    if (new BigNumber(values[handle]).isGreaterThanOrEqualTo(new BigNumber(amountWithdrawBALNbnUSDMax))) {
      handleTypeAmountWithdrawBALNPoolBALNbnUSD(amountWithdrawBALNbnUSDMax, 'slider');
    } else {
      handleTypeAmountWithdrawBALNPoolBALNbnUSD(values[handle], 'slider');
    }
  };

  return (
    <>
      <BoxPanel bg="bg2" mb={10}>
        <Typography variant="h2" mb={5}>
          Liquidity details
        </Typography>

        {/* <!-- Liquidity list --> */}
        <table className="list liquidity">
          <thead>
            <tr>
              <th>Pool</th>
              <th>Your supply</th>
              <th>Pool share</th>
              <th>Daily rewards</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {/* <!-- sICX / ICX --> */}
            <tr style={ICXBalance.toNumber() === 0 ? { display: 'none' } : {}}>
              <td>sICX / ICX</td>
              <td>{formatBigNumber(ICXBalance, 'currency')} ICX</td>
              <td>{sICXICXSuppliedShare?.isNaN() ? '0.00' : formatBigNumber(sICXICXSuppliedShare, 'currency')}%</td>
              <td>
                ~{' '}
                {formatBigNumber(
                  new BigNumber(sICXICXpoolDailyReward * (ICXBalance.toNumber() / sICXICXTotalSupply.toNumber())),
                  'currency',
                )}{' '}
                BALN
              </td>
              <td style={{ paddingRight: '16px' }}>
                <Wrapper>
                  <UnderlineText onClick={handleWithdrawSICXICX}>Withdraw</UnderlineText>
                </Wrapper>
              </td>
            </tr>

            <tr style={liquiditySupply.sICXSuppliedPoolsICXbnUSD?.toNumber() === 0 ? { display: 'none' } : {}}>
              <td>sICX / bnUSD</td>
              <td>
                {formatBigNumber(liquiditySupply.sICXSuppliedPoolsICXbnUSD, 'currency') + ' sICX'}
                <br />
                {formatBigNumber(liquiditySupply.bnUSDSuppliedPoolsICXbnUSD, 'currency') + ' bnUSD'}
              </td>
              <td>
                {!account
                  ? '-'
                  : sICXbnUSDSuppliedShare?.isNaN()
                  ? '0.00'
                  : formatBigNumber(sICXbnUSDSuppliedShare, 'currency')}
                %
              </td>
              <td>
                ~{' '}
                {formatBigNumber(
                  sICXbnUSDpoolDailyReward?.multipliedBy(sICXbnUSDSuppliedShare?.dividedBy(100)),
                  'currency',
                )}{' '}
                BALN
              </td>
              <td>
                <ClickAwayListener onClickAway={closeDropdownSICXbnUSD}>
                  <div>
                    <UnderlineTextWithArrow
                      onClick={handleToggleDropdownSICXbnUSD}
                      text="Withdraw"
                      arrowRef={arrowRefSICXbnUSD}
                    />
                    <DropdownPopper show={Boolean(anchorSICXbnUSD)} anchorEl={anchorSICXbnUSD}>
                      <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
                        <Typography variant="h3" mb={3}>
                          Withdraw:&nbsp;
                          <Typography as="span">sICX / bnUSD</Typography>
                        </Typography>
                        <Box mb={3}>
                          <CurrencyInputPanel
                            value={amountWithdrawSICXPoolsICXbnUSD}
                            showMaxButton={false}
                            currency={CURRENCY_LIST['sicx']}
                            onUserInput={handleTypeAmountWithdrawsICXPoolsICXbnUSD}
                            id="withdraw-liquidity-input"
                            bg="bg5"
                          />
                        </Box>
                        <Box mb={3}>
                          <CurrencyInputPanel
                            value={amountWithdrawBNUSDPoolsICXbnUSD}
                            showMaxButton={false}
                            currency={CURRENCY_LIST['bnusd']}
                            onUserInput={handleTypeAmountWithdrawBNUSDPoolsICXbnUSD}
                            id="withdraw-liquidity-input"
                            bg="bg5"
                          />
                        </Box>
                        <Typography mb={5} textAlign="right">
                          Wallet: {formatBigNumber(balances['sICX'], 'currency')} sICX /{' '}
                          {formatBigNumber(balances['bnUSD'], 'currency')} bnUSD
                        </Typography>
                        <Nouislider
                          id="slider-supply"
                          start={[0]}
                          padding={[0]}
                          connect={[true, false]}
                          range={{
                            min: [0],
                            max: [amountWithdrawsICXbnUSDMax],
                          }}
                          onSlide={handleSlideWithdrawsICXPoolsICXbnUSD}
                        />
                        <Flex alignItems="center" justifyContent="center">
                          <Button mt={5} onClick={handleWithdrawSICXbnUSD}>
                            Withdraw liquidity
                          </Button>
                        </Flex>
                      </Flex>
                    </DropdownPopper>
                  </div>
                </ClickAwayListener>
              </td>
            </tr>

            {/* <!-- BALN / bnUSD --> */}
            <tr style={liquiditySupply.BALNSuppliedPoolBALNbnUSD?.toNumber() === 0 ? { display: 'none' } : {}}>
              <td>BALN / bnUSD</td>
              <td>
                {formatBigNumber(liquiditySupply.BALNSuppliedPoolBALNbnUSD, 'currency')} BALN
                <br />
                {formatBigNumber(liquiditySupply.bnUSDSuppliedPoolBALNbnUSD, 'currency')} bnUSD
              </td>
              <td>{!account ? '-' : formatBigNumber(BALNbnUSDSuppliedShare, 'currency')}%</td>
              <td>
                ~{' '}
                {formatBigNumber(
                  BALNbnUSDpoolDailyReward?.multipliedBy(BALNbnUSDSuppliedShare.dividedBy(100)),
                  'currency',
                )}{' '}
                BALN
              </td>
              <td>
                <ClickAwayListener onClickAway={closeDropdownBALNbnUSD}>
                  <div>
                    <UnderlineTextWithArrow
                      onClick={handleToggleDropdownBALNbnUSD}
                      text="Withdraw"
                      arrowRef={arrowRefBALNbnUSD}
                    />
                    <DropdownPopper show={Boolean(anchorBALNbnUSD)} anchorEl={anchorBALNbnUSD}>
                      <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
                        <Typography variant="h3" mb={3}>
                          Withdraw:&nbsp;
                          <Typography as="span">BALN / bnUSD</Typography>
                        </Typography>
                        <Box mb={3}>
                          <CurrencyInputPanel
                            value={amountWithdrawBALNPoolBALNbnUSD}
                            showMaxButton={false}
                            currency={CURRENCY_LIST['baln']}
                            onUserInput={handleTypeAmountWithdrawBALNPoolBALNbnUSD}
                            id="withdraw-liquidity-input"
                            bg="bg5"
                          />
                        </Box>
                        <Box mb={3}>
                          <CurrencyInputPanel
                            value={amountWithdrawBNUSDPoolBALNbnUSD}
                            showMaxButton={false}
                            currency={CURRENCY_LIST['bnusd']}
                            onUserInput={handleTypeAmountWithdrawBNUSDPoolBALNbnUSD}
                            id="withdraw-liquidity-input"
                            bg="bg5"
                          />
                        </Box>
                        <Typography mb={5} textAlign="right">
                          Wallet: {formatBigNumber(balances['BALN'], 'currency')} BALN /{' '}
                          {formatBigNumber(balances['bnUSD'], 'currency')} bnUSD
                        </Typography>
                        <Nouislider
                          id="slider-supply"
                          start={[0]}
                          padding={[0]}
                          connect={[true, false]}
                          range={{
                            min: [0],
                            max: [parseFloat(formatBigNumber(new BigNumber(amountWithdrawBALNbnUSDMax), 'input'))],
                          }}
                          onSlide={handleSlideWithdrawBALNPoolBALNbnUSD}
                        />
                        <Flex alignItems="center" justifyContent="center">
                          <Button mt={5} onClick={handleWithdrawBALNbnUSD}>
                            Withdraw liquidity
                          </Button>
                        </Flex>
                      </Flex>
                    </DropdownPopper>
                  </div>
                </ClickAwayListener>
              </td>
            </tr>
          </tbody>
        </table>
      </BoxPanel>
      <Modal isOpen={showSwapConfirm} onDismiss={handleWithdrawConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            Withdraw liquidity?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {withdrawInputAmount} {inputCurrency}
            <br />
            {inputCurrency === 'ICX' ? '' : withdrawOutputAmount + ' ' + outputCurrency}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleWithdrawConfirmDismiss}>Cancel</TextButton>
            <Button onClick={handleWithdrawConfirm}>Withdraw</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default LiquidityDetails;
