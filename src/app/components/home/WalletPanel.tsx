import React from 'react';

import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '@reach/accordion';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@reach/tabs';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import CurrencyLogo from 'app/components/CurrencyLogo';
import Divider from 'app/components/Divider';
import { Link } from 'app/components/Link';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';
import '@reach/tabs/styles.css';
import { useWalletICXBalance } from 'hooks';
import { useRatioValue } from 'store/ratio/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

import { Button } from '../Button';

const AssetSymbol = styled.div`
  display: grid;
  grid-column-gap: 12px;
  grid-template-columns: auto 1fr;
  align-items: center;
`;

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-areas: 'asset balance value';
  align-items: center;

  & > * {
    justify-content: flex-end;
    text-align: right;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

const DataText = styled(Typography)`
  font-size: 16px;
`;

const ListItem = styled(DashGrid)`
  padding: 20px 0;
  cursor: pointer;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);

  :hover {
    color: #2ca9b7;
    transition: color 0.2s ease;
  }
`;

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
`;

const StyledAccordionButton = styled(AccordionButton)`
  width: 100%;
  appearance: none;
  background: 0;
  border: 0;
  box-shadow: none;
  padding: 0;

  &[aria-expanded='true'] {
    & > ${ListItem} {
      color: #2ca9b7;
      border-bottom: none;
    }
  }
`;

const Wrapper = styled.div``;

const StyledTabList = styled(TabList)`
  &[data-reach-tab-list] {
    width: 100%;
    background: transparent;
  }
`;

const StyledTab = styled(Tab)`
  &[data-reach-tab] {
    box-sizing: border-box;
    padding: 10px 15px;
    padding-top: 0;
    margin-right: 15px;
    border-bottom: 3px solid #144a68;
    color: rgba(255, 255, 255, 0.75);
    background-color: transparent;
    transition: border-bottom 0.3s ease, color 0.3s ease;

    &[data-selected] {
      border-bottom: 3px solid #2ca9b7;
      color: #ffffff;
      transition: border-bottom 0.2s ease, color 0.2s ease;
    }

    :hover {
      border-bottom: 3px solid #2ca9b7;
      color: #ffffff;
      transition: border-bottom 0.2s ease, color 0.2s ease;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-auto-rows: auto;
  row-gap: 15px;
`;

const WalletPanel = () => {
  // #redux-step-9: how to use
  const walletBalance = useWalletBalanceValue(); // get from store
  const { account } = useIconReact();
  const ICXbalance = useWalletICXBalance(account);
  const ratio = useRatioValue();

  return (
    <BoxPanel bg="bg2">
      <Typography variant="h2" mb={5}>
        Wallet
      </Typography>

      <Wrapper>
        <DashGrid>
          <HeaderText>Asset</HeaderText>
          <HeaderText>Balance</HeaderText>
          <HeaderText>Value</HeaderText>
        </DashGrid>

        <List>
          <Accordion collapsible>
            {/* icx section */}
            <AccordionItem>
              <StyledAccordionButton>
                <ListItem>
                  <AssetSymbol>
                    <CurrencyLogo currency={CURRENCYLIST['icx']} />
                    <Typography fontSize={16} fontWeight="bold">
                      {CURRENCYLIST['icx'].symbol}
                    </Typography>
                  </AssetSymbol>
                  <DataText>{!account ? '-' : ICXbalance.toNumber() === 0 ? '0' : ICXbalance.toFixed(2)}</DataText>
                  <DataText>
                    {!account
                      ? '-'
                      : ICXbalance.toNumber() === 0
                      ? '$0'
                      : '$' + (ICXbalance.toNumber() * (ratio.ICXUSDratio?.toNumber() || 0)).toFixed(2).toString()}
                  </DataText>
                </ListItem>
              </StyledAccordionButton>

              <AccordionPanel>
                <BoxPanel bg="bg3">
                  <Tabs>
                    <StyledTabList>
                      <StyledTab>Send</StyledTab>
                      <StyledTab>Unstaking</StyledTab>
                    </StyledTabList>
                    <Divider mb={3} />
                    <TabPanels>
                      <TabPanel>
                        <Grid>
                          <Flex alignItems="center" justifyContent="space-between">
                            <Typography variant="h3">Send bnUSD</Typography>
                            <Link href="#">Send max</Link>
                          </Flex>

                          <CurrencyInputPanel
                            value="0"
                            showMaxButton={false}
                            currency={CURRENCYLIST['icx']}
                            onUserInput={() => null}
                            id="swap-currency-output"
                          />

                          <AddressInputPanel value="" onUserInput={() => null} />
                        </Grid>

                        <Flex alignItems="center" justifyContent="center" mt={5}>
                          <Button>Send</Button>
                        </Flex>
                      </TabPanel>

                      <TabPanel>
                        <Grid>
                          <Typography variant="h3">Unstaking</Typography>

                          <Box>
                            <Typography>Collateral unstaking</Typography>
                            <Typography variant="p">9,716 ICX ~12 days remaining.</Typography>
                          </Box>

                          <Box>
                            <Typography>Liquidity unstaking</Typography>
                            <Typography variant="p">3,468 ICX ~5 days remaining.</Typography>
                          </Box>
                        </Grid>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </BoxPanel>
              </AccordionPanel>
            </AccordionItem>

            {/* sicx section */}
            <AccordionItem>
              <StyledAccordionButton>
                <ListItem>
                  <AssetSymbol>
                    <CurrencyLogo currency={CURRENCYLIST['sicx']} />
                    <Typography fontSize={16} fontWeight="bold">
                      {CURRENCYLIST['sicx'].symbol}
                    </Typography>
                  </AssetSymbol>
                  <DataText>
                    {!account
                      ? '-'
                      : walletBalance.sICXbalance?.toNumber() === 0
                      ? '0'
                      : walletBalance.sICXbalance?.toFixed(2)}
                  </DataText>
                  <DataText>
                    {!account
                      ? '-'
                      : walletBalance.sICXbalance?.toNumber() === 0
                      ? '$0'
                      : '$' +
                        (
                          (walletBalance.sICXbalance?.toNumber() || 0) *
                          (ratio.sICXICXratio?.toNumber() || 0) *
                          (ratio.ICXUSDratio?.toNumber() || 0)
                        )
                          .toFixed(2)
                          .toString()}
                  </DataText>
                </ListItem>
              </StyledAccordionButton>

              <AccordionPanel>
                <BoxPanel bg="bg3">
                  <Grid>
                    <Flex alignItems="center" justifyContent="space-between">
                      <Typography variant="h3">Send sICX</Typography>
                      <Link href="#">Send max</Link>
                    </Flex>

                    <CurrencyInputPanel
                      value="0"
                      showMaxButton={false}
                      currency={CURRENCYLIST['sicx']}
                      onUserInput={() => null}
                      id="swap-currency-output"
                    />

                    <AddressInputPanel value="" onUserInput={() => null} />
                  </Grid>

                  <Flex alignItems="center" justifyContent="center" mt={5}>
                    <Button>Send</Button>
                  </Flex>
                </BoxPanel>
              </AccordionPanel>
            </AccordionItem>

            {/* bnusd section */}
            <AccordionItem>
              <StyledAccordionButton>
                <ListItem>
                  <AssetSymbol>
                    <CurrencyLogo currency={CURRENCYLIST['bnusd']} />
                    <Typography fontSize={16} fontWeight="bold">
                      {CURRENCYLIST['bnusd'].symbol}
                    </Typography>
                  </AssetSymbol>
                  <DataText>
                    {!account
                      ? '-'
                      : walletBalance.bnUSDbalance?.toNumber() === 0
                      ? '0'
                      : walletBalance.bnUSDbalance?.toFixed(2)}
                  </DataText>
                  <DataText>
                    {!account
                      ? '-'
                      : walletBalance.bnUSDbalance?.toNumber() === 0
                      ? '$0'
                      : '$' + walletBalance.bnUSDbalance?.toFixed(2)}
                  </DataText>
                </ListItem>
              </StyledAccordionButton>

              <AccordionPanel>
                <BoxPanel bg="bg3">
                  <Grid>
                    <Flex alignItems="center" justifyContent="space-between">
                      <Typography variant="h3">Send bnUSD</Typography>
                      <Link href="#">Send max</Link>
                    </Flex>

                    <CurrencyInputPanel
                      value="0"
                      showMaxButton={false}
                      currency={CURRENCYLIST['bnusd']}
                      onUserInput={() => null}
                      id="swap-currency-output"
                    />

                    <AddressInputPanel value="" onUserInput={() => null} />
                  </Grid>

                  <Flex alignItems="center" justifyContent="center" mt={5}>
                    <Button>Send</Button>
                  </Flex>
                </BoxPanel>
              </AccordionPanel>
            </AccordionItem>

            {/* baln section */}
            <AccordionItem>
              <StyledAccordionButton>
                <ListItem>
                  <AssetSymbol>
                    <CurrencyLogo currency={CURRENCYLIST['baln']} />
                    <Typography fontSize={16} fontWeight="bold">
                      {CURRENCYLIST['baln'].symbol}
                    </Typography>
                  </AssetSymbol>
                  <DataText>
                    {!account
                      ? '-'
                      : walletBalance.BALNbalance?.toNumber() === 0
                      ? '0'
                      : walletBalance.BALNbalance?.toFixed(2)}
                  </DataText>
                  <DataText>
                    {!account
                      ? '-'
                      : walletBalance.BALNbalance?.toNumber() === 0
                      ? '$0'
                      : '$' +
                        ((walletBalance.BALNbalance?.toNumber() || 0) * (ratio.BALNbnUSDratio?.toNumber() || 0))
                          .toFixed(2)
                          .toString()}
                  </DataText>
                </ListItem>
              </StyledAccordionButton>

              <AccordionPanel>
                <BoxPanel bg="bg3">
                  <Tabs>
                    <StyledTabList>
                      <StyledTab>Stake</StyledTab>
                      <StyledTab>Send</StyledTab>
                      <StyledTab>Unstaking</StyledTab>
                    </StyledTabList>
                    <Divider mb={3} />
                    <TabPanels>
                      <TabPanel>
                        <Typography variant="h3">Stake Balance Tokens</Typography>

                        <Typography my={1}>Stake your Balance Tokens to earn dividends.</Typography>

                        <Box my={3}>
                          <Nouislider
                            disabled
                            id="slider-collateral"
                            start={[10000]}
                            padding={[0]}
                            connect={[true, false]}
                            range={{
                              min: [0],
                              max: [15000],
                            }}
                          />
                        </Box>

                        <Flex my={1} alignItems="center" justifyContent="space-between">
                          <Typography>0 / 724</Typography>
                          <Typography>97% staked</Typography>
                        </Flex>

                        <Flex alignItems="center" justifyContent="center" mt={5}>
                          <Button>Adjust</Button>
                        </Flex>
                      </TabPanel>

                      <TabPanel>
                        <Grid>
                          <Flex alignItems="center" justifyContent="space-between">
                            <Typography variant="h3">Send BALN</Typography>
                            <Link href="#">Send max</Link>
                          </Flex>

                          <CurrencyInputPanel
                            value="0"
                            showMaxButton={false}
                            currency={CURRENCYLIST['baln']}
                            onUserInput={() => null}
                            id="swap-currency-output"
                          />

                          <AddressInputPanel value="" onUserInput={() => null} />
                        </Grid>

                        <Flex alignItems="center" justifyContent="center" mt={5}>
                          <Button>Send</Button>
                        </Flex>
                      </TabPanel>

                      <TabPanel>
                        <Grid>
                          <Typography variant="h3">Unstaking</Typography>

                          <Box>
                            <Typography>Collateral unstaking</Typography>
                            <Typography variant="p">9,716 ICX ~12 days remaining.</Typography>
                          </Box>

                          <Box>
                            <Typography>Liquidity unstaking</Typography>
                            <Typography variant="p">3,468 ICX ~5 days remaining.</Typography>
                          </Box>
                        </Grid>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </BoxPanel>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </List>
      </Wrapper>
    </BoxPanel>
  );
};

export default WalletPanel;
