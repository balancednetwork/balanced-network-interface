import React from 'react';

import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '@reach/accordion';
import BigNumber from 'bignumber.js';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCY } from 'constants/currency';
import '@reach/tabs/styles.css';
import { useRatio } from 'store/ratio/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

import BALNWallet from './wallets/BALNWallet';
import ICXWallet from './wallets/ICXWallet';
import SendPanel from './wallets/SendPanel';
import SICXWallet from './wallets/SICXWallet';

const WalletUIs = {
  ICX: ICXWallet,
  sICX: SICXWallet,
  BALN: BALNWallet,
};

const WalletPanel = () => {
  const balances = useWalletBalances();
  const ratio = useRatio();

  const rates = React.useMemo(
    () => ({
      ICX: ratio.ICXUSDratio,
      sICX: ratio.sICXICXratio.times(ratio.ICXUSDratio),
      bnUSD: new BigNumber(1),
      BALN: ratio.BALNbnUSDratio,
    }),
    [ratio],
  );

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
            {CURRENCY.filter(currency => {
              return !balances[currency]?.dp(2).isZero();
            }).map((currency, index, arr) => {
              const WalletUI = WalletUIs[currency] || SendPanel;
              return (
                <AccordionItem key={currency}>
                  <StyledAccordionButton>
                    <ListItem border={index !== arr.length - 1}>
                      <AssetSymbol>
                        <CurrencyLogo currencyKey={currency} />
                        <Typography fontSize={16} fontWeight="bold">
                          {currency}
                        </Typography>
                      </AssetSymbol>
                      <DataText as="div">{balances[currency].dp(2).toFormat()}</DataText>

                      <DataText as="div">
                        {`$${balances[currency].multipliedBy(rates[currency]).dp(2).toFormat()}`}
                      </DataText>
                    </ListItem>
                  </StyledAccordionButton>

                  <AccordionPanel>
                    <BoxPanel bg="bg3">
                      <WalletUI currencyKey={currency} />
                    </BoxPanel>
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        </List>
      </Wrapper>
    </BoxPanel>
  );
};

export default WalletPanel;

const AssetSymbol = styled.div`
  display: grid;
  grid-column-gap: 12px;
  grid-template-columns: auto 1fr;
  align-items: center;
`;

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
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

const ListItem = styled(DashGrid)<{ border?: boolean }>`
  padding: 20px 0;
  cursor: pointer;
  color: #ffffff;
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};

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
