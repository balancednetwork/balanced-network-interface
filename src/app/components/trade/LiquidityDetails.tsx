import React from 'react';

import Nouislider from 'nouislider-react';
import { Flex, Box } from 'rebass/styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import DropdownText from 'app/components/DropdownText';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';

const LiquidityDetails = () => {
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
            <td>15,000 ICX</td>
            <td>3.1%</td>
            <td>~ 120 BALN</td>
            <td>
              <DropdownText text="Withdraw">
                <Flex padding={5} bg="bg3" maxWidth={320} flexDirection="column">
                  <Typography variant="h3" mb={3}>
                    Withdraw:&nbsp;
                    <Typography as="span">sICX / ICX</Typography>
                  </Typography>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={'0'}
                      showMaxButton={false}
                      currency={CURRENCYLIST['icx']}
                      onUserInput={() => null}
                      id="withdraw-liquidity-input"
                    />
                  </Box>
                  <Typography mb={5} textAlign="right">
                    Wallet: 12,000 ICX
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

          {/* <!-- ICX / ICD --> */}
          <tr>
            <td>ICX / bnUSD</td>
            <td>
              15,000 ICX
              <br />
              15,000 bnUSD
            </td>
            <td>3.1%</td>
            <td>~ 120 BALN</td>
            <td>
              <DropdownText text="Withdraw">
                <Flex padding={5} bg="bg3" maxWidth={320} flexDirection="column">
                  <Typography variant="h3" mb={3}>
                    Withdraw:&nbsp;
                    <Typography as="span">ICX / bnUSD</Typography>
                  </Typography>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={'0'}
                      showMaxButton={false}
                      currency={CURRENCYLIST['icx']}
                      onUserInput={() => null}
                      id="withdraw-liquidity-input"
                    />
                  </Box>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={'0'}
                      showMaxButton={false}
                      currency={CURRENCYLIST['bnusd']}
                      onUserInput={() => null}
                      id="withdraw-liquidity-input"
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
                    <Button mt={5}>Withdraw liquidity</Button>
                  </Flex>
                </Flex>
              </DropdownText>
            </td>
          </tr>

          {/* <!-- BALN / bnUSD --> */}
          <tr>
            <td>BALN / bnUSD</td>
            <td>
              15,000 BALN
              <br />
              15,000 bnUSD
            </td>
            <td>3.1%</td>
            <td>~ 120 BALN</td>
            <td>
              <DropdownText text="Withdraw">
                <Flex padding={5} bg="bg3" maxWidth={320} flexDirection="column">
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
                    />
                  </Box>
                  <Box mb={3}>
                    <CurrencyInputPanel
                      value={'0'}
                      showMaxButton={false}
                      currency={CURRENCYLIST['bnusd']}
                      onUserInput={() => null}
                      id="withdraw-liquidity-input"
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
