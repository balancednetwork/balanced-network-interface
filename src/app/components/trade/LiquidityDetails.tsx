import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import DropdownText from 'app/components/DropdownText';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';
import { WITHDRAW_LOCK_TIMEOUT } from 'constants/index';
import { useLiquiditySupply, useChangeLiquiditySupply } from 'store/liquidity/hooks';

const LiquidityDetails = () => {
  const { account } = useIconReact();
  const changeLiquiditySupply = useChangeLiquiditySupply();
  const liquiditySupply = useLiquiditySupply();

  const sICXbnUSDTotalSupply = liquiditySupply.sICXbnUSDTotalSupply || new BigNumber(0);
  const sICXbnUSDSuppliedShare = liquiditySupply.sICXSuppliedPoolsICXbnUSD
    ?.dividedBy(sICXbnUSDTotalSupply)
    ?.multipliedBy(100)
    .toFixed(2);

  const BALNPoolBALNbnUSDTotal = liquiditySupply.BALNPoolBALNbnUSDTotal || new BigNumber(0);
  const BALNbnUSDSuppliedShare = liquiditySupply.BALNSuppliedPoolBALNbnUSD?.dividedBy(BALNPoolBALNbnUSDTotal)
    ?.multipliedBy(100)
    .toFixed(2);

  const sICXICXTotalSupply = liquiditySupply.BALNbnUSDTotalSupply || new BigNumber(0);
  const ICXBalance = liquiditySupply.ICXBalance || new BigNumber(0);

  const [amountWithdrawICX, setAmountWithdrawICX] = React.useState('0');

  React.useEffect(() => {
    setAmountWithdrawICX((liquiditySupply.ICXBalance || new BigNumber(0)).toFixed(2));
  }, [liquiditySupply.ICXBalance]);

  const handleTypeAmountWithdrawSICX = (val: string) => {
    setAmountWithdrawSICX(val);
  };

  const handleWithdrawalICX = () => {
    if (!account) return;
    bnJs
      .eject({ account: account })
      .Dex.getICXWithdrawLock()
      .then(result => {
        const ICXWithdrawLockTime = parseInt(result, 16);
        const timeNow = Date.now() * 1000;
        if (timeNow > ICXWithdrawLockTime + WITHDRAW_LOCK_TIMEOUT) {
          bnJs
            .eject({ account: account })
            .Dex.getICXBalance()
            .then(result => {
              changeLiquiditySupply({ ICXBalance: liquiditySupply.ICXBalance?.minus(amountWithdrawICX) });
            })
            .catch(e => {
              console.error('error', e);
            });
        } else {
          // TODO: show alert
          console.log('show alert the withdrawal is locked');
        }
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const [amountWithdrawSICX, setAmountWithdrawSICX] = React.useState('0');
  const [amountWithdrawBNUSD, setAmountWithdrawBNUSD] = React.useState('0');

  const handleTypeAmountWithdrawICX = (val: string) => {
    setAmountWithdrawICX(val);
  };

  const handleTypeAmountWithdrawBNUSD = (val: string) => {
    setAmountWithdrawBNUSD(val);
  };

  const handleWithdrawalSICXBNUSD = () => {
    if (!account) return;
    // TODO: calculate value and withdrawal
    bnJs
      .eject({ account: account })
      .Dex.withdrawalTokens(BalancedJs.utils.sICXbnUSDpoolId, 10)
      .then(result => {
        console.log(result);
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  return (
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
          <tr>
            <td>sICX / ICX</td>
            <td>{ICXBalance.toFixed(2)} ICX</td>
            <td>{ICXBalance.dividedBy(sICXICXTotalSupply).multipliedBy(100).toFixed(2)}%</td>
            <td>~ 120 BALN</td>
            <td>
              <DropdownText text="Withdraw">
                <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
                  <Typography variant="h3" mb={3}>
                    Withdraw:&nbsp;
                    <Typography as="span">sICX / ICX</Typography>
                  </Typography>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={amountWithdrawICX}
                      showMaxButton={false}
                      currency={CURRENCYLIST['icx']}
                      onUserInput={handleTypeAmountWithdrawICX}
                      id="withdraw-liquidity-input"
                      bg="bg5"
                    />
                  </Box>
                  <Typography mb={5} textAlign="right">
                    Wallet: {ICXBalance.toFixed(2)} ICX
                  </Typography>
                  <Nouislider
                    id="slider-supply"
                    start={[ICXBalance.toFixed(2)]}
                    padding={[0]}
                    connect={[true, false]}
                    range={{
                      min: [0],
                      max: [sICXICXTotalSupply.toNumber()],
                    }}
                  />
                  <Flex alignItems="center" justifyContent="center">
                    <Button mt={5} onClick={handleWithdrawalICX}>
                      Withdraw liquidity
                    </Button>
                  </Flex>
                </Flex>
              </DropdownText>
            </td>
          </tr>

          {/* <!-- ICX / ICD --> */}
          <tr>
            <td>sICX / bnUSD</td>
            <td>
              {liquiditySupply.sICXSuppliedPoolsICXbnUSD?.toFixed(2) + ' sICX'}
              <br />
              {liquiditySupply.bnUSDSuppliedPoolsICXbnUSD?.toFixed(2) + ' bnUSD'}
            </td>
            <td>{!account ? '-' : !sICXbnUSDSuppliedShare ? '0%' : sICXbnUSDSuppliedShare + '%'}</td>
            <td>~ 120 BALN</td>
            <td>
              <DropdownText text="Withdraw">
                <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
                  <Typography variant="h3" mb={3}>
                    Withdraw:&nbsp;
                    <Typography as="span">ICX / bnUSD</Typography>
                  </Typography>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={amountWithdrawSICX}
                      showMaxButton={false}
                      currency={CURRENCYLIST['sicx']}
                      onUserInput={handleTypeAmountWithdrawSICX}
                      id="withdraw-liquidity-input"
                      bg="bg5"
                    />
                  </Box>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={amountWithdrawBNUSD}
                      showMaxButton={false}
                      currency={CURRENCYLIST['bnusd']}
                      onUserInput={handleTypeAmountWithdrawBNUSD}
                      id="withdraw-liquidity-input"
                      bg="bg5"
                    />
                  </Box>
                  <Typography mb={5} textAlign="right">
                    Wallet: 2,000 ICX / 5,000 bnUSD
                  </Typography>
                  <Nouislider
                    id="slider-supply"
                    start={[0]}
                    padding={[0]}
                    connect={[true, false]}
                    range={{
                      min: [0],
                      max: [100],
                    }}
                  />
                  <Flex alignItems="center" justifyContent="center">
                    <Button mt={5} onClick={handleWithdrawalSICXBNUSD}>
                      Withdraw liquidity
                    </Button>
                  </Flex>
                </Flex>
              </DropdownText>
            </td>
          </tr>

          {/* <!-- BALN / bnUSD --> */}
          <tr>
            <td>BALN / bnUSD</td>
            <td>
              {liquiditySupply.BALNSuppliedPoolBALNbnUSD?.toFixed(2)} BALN
              <br />
              {liquiditySupply.BALNSuppliedPoolBALNbnUSD?.toFixed(2)} bnUSD
            </td>
            <td>{!account ? '-' : !BALNbnUSDSuppliedShare ? '0%' : BALNbnUSDSuppliedShare + '%'}</td>
            <td>~ 120 BALN</td>
            <td>
              <DropdownText text="Withdraw">
                <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
                  <Typography variant="h3" mb={3}>
                    Withdraw:&nbsp;
                    <Typography as="span">BALN / bnUSD</Typography>
                  </Typography>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={'0'}
                      showMaxButton={false}
                      currency={CURRENCYLIST['baln']}
                      onUserInput={() => null}
                      id="withdraw-liquidity-input"
                      bg="bg5"
                    />
                  </Box>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={'0'}
                      showMaxButton={false}
                      currency={CURRENCYLIST['bnusd']}
                      onUserInput={() => null}
                      id="withdraw-liquidity-input"
                      bg="bg5"
                    />
                  </Box>
                  <Typography mb={5} textAlign="right">
                    Wallet: 2,000 BALN / 5,000 ICD
                  </Typography>
                  <Nouislider
                    id="slider-supply"
                    start={[0]}
                    padding={[0]}
                    connect={[true, false]}
                    range={{
                      min: [0],
                      max: [100],
                    }}
                  />
                  <Flex alignItems="center" justifyContent="center">
                    <Button mt={5}>Withdraw liquidity</Button>
                  </Flex>
                </Flex>
              </DropdownText>
            </td>
          </tr>
        </tbody>
      </table>
    </BoxPanel>
  );
};

export default LiquidityDetails;
