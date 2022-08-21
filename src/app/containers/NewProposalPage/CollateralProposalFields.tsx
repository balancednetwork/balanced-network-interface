import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';

import { CollateralProposal, FieldInput, ORACLE_TYPE } from '.';

const OracleTypeButton = styled.button<{ isActive: boolean }>`
  cursor: pointer;
  padding: 1px 12px;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  background-color: ${({ theme, isActive }) => (isActive ? theme.colors.primary : theme.colors.bg3)};
  border: 0;
  outline: 0;
  word-break: keep-all;
  height: 100%;
  align-self: center;
  margin: 0 5px 10px 0;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Field = styled(Box)``;

const CollateralTypeGrid = styled(Box)`
  margin-top: 15px;

  ${({ theme }) => theme.mediaWidth.upSmall`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-auto-flow: row;
    gap: 5px 25px;

    .address {
        grid-column: 1 / 4;
        padding-right: 25px;
    }

    .type {
        grid-column: 4 / 7;
    }

    .ceiling {
        grid-column: 1 / 3;
    }

    .borrow {
        grid-column: 3 / 5;
    }

    .liquidation {
        grid-column: 5 / 7;
    }
  `};
`;

const CollateralProposalFields = ({
  newCollateral,
  setNewCollateral,
}: {
  newCollateral: CollateralProposal;
  setNewCollateral: React.Dispatch<React.SetStateAction<CollateralProposal>>;
}) => {
  const onCollateralAddressChange = (event: React.FormEvent<HTMLInputElement>) => {
    setNewCollateral({ ...newCollateral, address: event.currentTarget.value });
  };

  const onOracleTypeChange = (type: ORACLE_TYPE) => {
    setNewCollateral({ ...newCollateral, oracleType: type });
  };

  const onOracleValueChange = (event: React.FormEvent<HTMLInputElement>) => {
    setNewCollateral({ ...newCollateral, oracleValue: event.currentTarget.value });
  };

  const onCeilingChange = (event: React.FormEvent<HTMLInputElement>) => {
    setNewCollateral({
      ...newCollateral,
      debtCeiling: event.currentTarget.value,
    });
  };

  const onBorrowLTVChange = (event: React.FormEvent<HTMLInputElement>) => {
    setNewCollateral({ ...newCollateral, borrowLTV: event.currentTarget.value });
  };

  const onLiquidationLTVChange = (event: React.FormEvent<HTMLInputElement>) => {
    setNewCollateral({ ...newCollateral, liquidationLTV: event.currentTarget.value });
  };
  return (
    <CollateralTypeGrid>
      <Field className="address">
        <Typography variant="h3">
          <Trans>Token contract address</Trans>
        </Typography>
        <FieldInput
          type="text"
          onChange={onCollateralAddressChange}
          value={newCollateral.address}
          placeholder="cx9eefbe346b17328e2265573f6e166f6bc4a13cc4"
        ></FieldInput>
      </Field>
      <Field className="type">
        <Typography variant="h3">
          <Trans>Oracle type</Trans>{' '}
          <QuestionHelper
            text={
              <>
                <Typography mb={4}>Where Balanced will get the price data for this collateral type.</Typography>
                <Typography mb={4}>
                  <strong>DEX:</strong> Use the price from a liquidity pool on Balanced.
                  <br />
                  <span style={{ opacity: 0.75 }}>Requires a pool ID number, i.e. '1' for sICX/bnUSD.</span>
                </Typography>
                <Typography mb={4}>
                  <strong>Band:</strong> Use the price of an asset tracked via the Band oracle.
                  <br />
                  <span style={{ opacity: 0.75 }}>Requires the token ticker, i.e. ICX.</span>
                </Typography>
              </>
            }
          ></QuestionHelper>
        </Typography>
        <Flex>
          <OracleTypeButton
            onClick={() => onOracleTypeChange(ORACLE_TYPE.DEX)}
            isActive={newCollateral.oracleType === ORACLE_TYPE.DEX}
          >
            DEX
          </OracleTypeButton>
          <OracleTypeButton
            onClick={() => onOracleTypeChange(ORACLE_TYPE.BAND)}
            isActive={newCollateral.oracleType === ORACLE_TYPE.BAND}
            style={{ marginRight: '20px' }}
          >
            Band
          </OracleTypeButton>
          <FieldInput
            type="text"
            onChange={onOracleValueChange}
            value={newCollateral.oracleValue}
            placeholder={newCollateral.oracleType === ORACLE_TYPE.BAND ? 'Symbol' : 'Pool ID'}
          ></FieldInput>
        </Flex>
      </Field>
      <Field className="ceiling">
        <Typography variant="h3">
          <Trans>Debt ceiling</Trans>{' '}
          <QuestionHelper text="The maximum amount of bnUSD that can be minted with this collateral type."></QuestionHelper>
        </Typography>
        <FieldInput
          type="number"
          onChange={onCeilingChange}
          value={newCollateral.debtCeiling}
          placeholder="2,500,000 bnUSD"
        ></FieldInput>
      </Field>
      <Field className="borrow">
        <Typography variant="h3">
          <Trans>Borrow LTV</Trans>{' '}
          <QuestionHelper text="The maximum percentage that people can borrow against the value of this collateral type."></QuestionHelper>
        </Typography>
        <FieldInput
          type="number"
          onChange={onBorrowLTVChange}
          value={newCollateral.borrowLTV}
          placeholder="30%"
        ></FieldInput>
      </Field>
      <Field className="liquidation">
        <Typography variant="h3">
          <Trans>Liquidation LTV</Trans>{' '}
          <QuestionHelper text="The percentage of debt required to trigger liquidation for this collateral type."></QuestionHelper>
        </Typography>
        <FieldInput
          type="number"
          onChange={onLiquidationLTVChange}
          value={newCollateral.liquidationLTV}
          placeholder="85%"
        ></FieldInput>
      </Field>
    </CollateralTypeGrid>
  );
};

export default CollateralProposalFields;
