import React, { useEffect, useCallback } from 'react';

import { useMedia } from 'react-use';
import { Box } from 'rebass';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { Typography } from 'app/theme';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import useKeyPress from 'hooks/useKeyPress';
import {
  useCollateralChangeCollateralType,
  useAllCollateralData,
  useCollateralActionHandlers,
} from 'store/collateral/hooks';
import { useLoanActionHandlers } from 'store/loan/hooks';

import { StyledSkeleton as Skeleton } from '../ProposalInfo';

const CollateralTypesGrid = styled.div<{
  border?: boolean;
  negativeMargin?: boolean;
  hideCollateralInfoColumn?: boolean;
}>`
  display: grid;
  grid-template-columns: ${({ hideCollateralInfoColumn }) => (hideCollateralInfoColumn ? '1fr 1fr' : '5fr 5fr 4fr')};
  width: 100%;
  ${({ border }) => (border ? 'border-bottom: 1px solid #304a68;' : '')}
  ${({ negativeMargin }) => (negativeMargin ? 'margin-top: -10px;' : '')}
  transition: transform ease .3s;

  .white,
  .grey {
    transition: all ease-out 0.2s;
  }

  .white {
    color: #ffffff;
  }

  .grey {
    color: #d5d7db;
  }

  &:hover {
    .white,
    .grey {
      color: ${({ theme }) => theme.colors.primaryBright};
    }
  }
`;

const StyledSkeleton = styled(Skeleton)`
  margin-left: auto;
`;

const CollateralTypesGridHeader = styled.div`
  text-transform: uppercase;
  text-align: right;
  font-size: 14px;
  letter-spacing: 3px;
  padding-bottom: 10px;
  color: ${({ theme }) => theme.colors.text1};

  &:first-of-type {
    text-align: left;
  }
`;

const CollateralTypesGridItem = styled.div`
  text-align: right;
  font-size: 14px;
  padding: 20px 0 20px 10px;
  cursor: pointer;

  &:first-of-type {
    text-align: left;
    padding: 20px 0;
  }
`;

const AssetInfo = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  padding-left: 40px;

  img {
    position: absolute;
    left: 0;
  }

  @media screen and (max-width: 350px) {
    padding-left: 0;
    img {
      display: none;
    }
  }
`;

const GridWrap = styled.div`
  max-height: 305px;
  overflow-y: auto;
  padding: 0 25px;
`;

const CollateralTypeList = ({ width, setAnchor, anchor, ...rest }) => {
  const changeCollateralType = useCollateralChangeCollateralType();
  const allCollateralData = useAllCollateralData();
  const hideCollateralInfoColumn = useMedia('(max-width: 500px)');
  const escape = useKeyPress('Escape');
  const { onAdjust: adjust } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan } = useLoanActionHandlers();

  const handleCollateralTypeChange = useCallback(
    symbol => {
      setAnchor(null);
      changeCollateralType(symbol);
      adjust(false);
      adjustLoan(false);
    },
    [changeCollateralType, setAnchor, adjust, adjustLoan],
  );

  useEffect(() => {
    if (anchor && escape) {
      setAnchor(null);
    }
  }, [anchor, escape, setAnchor]);

  return (
    <Box p={'25px 0 5px'} width={width}>
      {allCollateralData?.length ? (
        <GridWrap>
          <CollateralTypesGrid hideCollateralInfoColumn={hideCollateralInfoColumn}>
            <CollateralTypesGridHeader>Asset</CollateralTypesGridHeader>
            {!hideCollateralInfoColumn && <CollateralTypesGridHeader>Collateral</CollateralTypesGridHeader>}
            <CollateralTypesGridHeader>Loan</CollateralTypesGridHeader>
          </CollateralTypesGrid>
        </GridWrap>
      ) : null}

      <GridWrap>
        {allCollateralData
          ?.sort((a, b) => b.collateralDeposit.toNumber() - a.collateralDeposit.toNumber())
          .map((collateralType, i, { length }) => {
            const isLast = length - 1 === i;
            const isFirst = 0 === i;

            return (
              <CollateralTypesGrid
                key={i}
                border={!isLast}
                negativeMargin={isFirst}
                hideCollateralInfoColumn={hideCollateralInfoColumn}
                onClick={() => handleCollateralTypeChange(collateralType.symbol)}
              >
                <CollateralTypesGridItem>
                  <AssetInfo>
                    <CurrencyLogo
                      size={'26px'}
                      currency={SUPPORTED_TOKENS_LIST.find(token => token.symbol === collateralType.symbol)}
                    />
                    <Box>
                      <Typography className="white" fontWeight={700}>
                        {collateralType.displayName ? collateralType.displayName : collateralType.symbol}
                      </Typography>
                      <Typography className="grey">{'Available:'}</Typography>
                    </Box>
                  </AssetInfo>
                </CollateralTypesGridItem>

                {!hideCollateralInfoColumn && (
                  <CollateralTypesGridItem>
                    <Typography className="white">
                      {collateralType.collateralDeposit.isNaN() ? (
                        <StyledSkeleton width={50} animation="wave" />
                      ) : (
                        `$${collateralType.collateralDeposit.toFormat(0)}`
                      )}
                    </Typography>
                    <Typography className="grey">
                      {collateralType.collateralAvailable.isNaN() ? (
                        <StyledSkeleton width={50} animation="wave" />
                      ) : (
                        `$${collateralType.collateralAvailable.toFormat(0)}`
                      )}
                    </Typography>
                  </CollateralTypesGridItem>
                )}

                <CollateralTypesGridItem>
                  <Typography className="white">{`$${collateralType.loanTaken.toFormat(0)}`}</Typography>
                  <Typography className="grey">{`$${collateralType.loanAvailable.toFormat(0)}`}</Typography>
                </CollateralTypesGridItem>
              </CollateralTypesGrid>
            );
          })}
      </GridWrap>
    </Box>
  );
};

export default CollateralTypeList;
