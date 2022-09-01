import React from 'react';

import { t, Trans } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { StyledAddress } from 'app/components/Header';
import QuestionHelper from 'app/components/QuestionHelper';
import { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { shortenSCOREAddress } from 'utils';

import { CollateralProposal, FieldInput, ORACLE_TYPE } from '.';

export const CopyableSCORE = ({ score }: { score: string | undefined }) => {
  const [isCopied, updateCopyState] = React.useState(false);
  const copyAddress = React.useCallback(async (score: string) => {
    await navigator.clipboard.writeText(score);
    updateCopyState(true);
  }, []);

  return score ? (
    <MouseoverTooltip
      text={<div style={{ width: '100px', textAlign: 'center' }}>{isCopied ? t`Copied` : t`Copy address`}</div>}
      placement={'bottom'}
      noArrowAndBorder
      closeAfterDelay={isMobile ? 3000 : undefined}
    >
      <StyledAddress
        onMouseLeave={() => {
          setTimeout(() => updateCopyState(false), 250);
        }}
        onClick={() => copyAddress(score)}
        fontSize={16}
      >
        {shortenSCOREAddress(score, 5)}
      </StyledAddress>
    </MouseoverTooltip>
  ) : null;
};

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
    const collateralInfo = { ...newCollateral, oracleType: type };
    if (type === ORACLE_TYPE.DEX) {
      collateralInfo.oracleValue = '';
    }
    setNewCollateral(collateralInfo);
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
    if (Number(event.currentTarget.value) <= 100) {
      setNewCollateral({ ...newCollateral, borrowLTV: event.currentTarget.value });
    }
  };

  const onLiquidationLTVChange = (event: React.FormEvent<HTMLInputElement>) => {
    if (Number(event.currentTarget.value) <= 100) {
      setNewCollateral({ ...newCollateral, liquidationLTV: event.currentTarget.value });
    }
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
            width={270}
            text={
              <>
                <Typography mb={4}>
                  <Trans>Where Balanced will get the price data for this collateral type.</Trans>
                </Typography>
                <Typography mb={4}>
                  <strong>
                    <Trans>DEX</Trans>:
                  </strong>{' '}
                  <Trans>Use the price from Balanced.</Trans>
                  <br />
                  <span style={{ opacity: 0.75 }}>
                    <Trans>Requires a bnUSD liquidity pool for this collateral type.</Trans>
                  </span>
                </Typography>
                <Typography>
                  <strong>
                    <Trans>Band</Trans>:
                  </strong>{' '}
                  <Trans>Use the price of an asset tracked via the Band oracle.</Trans>
                  <br />
                  <span style={{ opacity: 0.75 }}>
                    <Trans>Requires the token ticker, i.e. ICX.</Trans>
                  </span>
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
            <Trans>DEX</Trans>
          </OracleTypeButton>
          <OracleTypeButton
            onClick={() => onOracleTypeChange(ORACLE_TYPE.BAND)}
            isActive={newCollateral.oracleType === ORACLE_TYPE.BAND}
            style={{ marginRight: '20px' }}
          >
            <Trans>Band</Trans>
          </OracleTypeButton>
          <FieldInput
            type="text"
            disabled={newCollateral.oracleType === ORACLE_TYPE.DEX}
            onChange={onOracleValueChange}
            value={newCollateral.oracleValue}
            placeholder="Symbol"
          ></FieldInput>
        </Flex>
      </Field>
      <Field className="ceiling">
        <Typography variant="h3">
          <Trans>Debt ceiling</Trans>{' '}
          <QuestionHelper
            text={t`The maximum amount of bnUSD that can be minted with this collateral type.`}
          ></QuestionHelper>
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
          <QuestionHelper
            text={t`The maximum percentage that people can borrow against the value of this collateral type.`}
          ></QuestionHelper>
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
          <QuestionHelper
            text={t`The percentage of debt required to trigger liquidation for this collateral type.`}
          ></QuestionHelper>
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
