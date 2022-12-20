import React from 'react';

import { motion } from 'framer-motion';
import { Trans } from 'react-i18next';
import { Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { DashGrid, DataText, HeaderText, List1, ListItem } from 'app/components/List';

import { Icon } from '../Icon';

const Assets = styled(motion(Flex))`
  position: absolute;
  border-radius: 10px;
  flex-direction: column;
  z-index: 5;
  max-width: initial;
  width: 380px;
  top: 100%;
  margin-top: 15px;
  padding: 25px;

  ${({ theme }) => css`
    background-color: ${theme.colors.bg2};
    border: 2px solid ${theme.colors.primary};

    &:after {
      content: '';
      width: 0;
      height: 0;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-bottom: 9px solid ${theme.colors.primary};
      display: inline-block;
      position: absolute;
      bottom: 100%;
      left: 20px;
    }
  `};
`;

const AssetItem = ({ asset, onChange }) => {
  return (
    <ListItem onClick={() => onChange(asset)} className={false ? 'focused' : ''}>
      <Flex>
        <Icon icon={asset?.value} width="24px" margin={'0 8px 0 0'} />
        <DataText variant="p" fontWeight="bold">
          {asset.value || asset.label}
        </DataText>
      </Flex>
      <Flex justifyContent="flex-end" alignItems="center">
        <DataText variant="p" textAlign="right">
          {Number(asset.balance) === 0 ? asset.balance : Number(asset.balance).toFixed(asset.label === 'BTCB' ? 6 : 2)}
        </DataText>
      </Flex>
    </ListItem>
  );
};

export const AssetModal = ({ data, onChange }) => {
  return (
    <>
      <Assets>
        <List1 mt={0}>
          <DashGrid>
            <HeaderText>
              <Trans>Asset</Trans>
            </HeaderText>
            <HeaderText textAlign="right">
              <Trans>Wallet</Trans>
            </HeaderText>
          </DashGrid>
          {data &&
            data.map((item, idx) => {
              return <AssetItem asset={item} key={idx} onChange={onChange} />;
            })}
        </List1>
      </Assets>
    </>
  );
};
