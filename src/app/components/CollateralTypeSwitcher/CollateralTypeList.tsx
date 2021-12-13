import React, { useState } from 'react';

import { Box } from 'rebass';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { Typography } from 'app/theme';
import { ReactComponent as SearchIcon } from 'assets/icons/search.svg';
import { useCollateralChangeCollateralType, useAllCollateralData } from 'store/collateral/hooks';
import { getTokenFromCurrencyKey } from 'types/adapter';

const SearchField = styled.input`
  background-color: ${({ theme }) => theme.colors.bg5};
  border: 2px solid ${({ theme }) => theme.colors.bg5};
  border-radius: 10px;
  height: 40px;
  width: 100%;
  outline: none;
  appearance: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  padding-left: 45px;
  padding-right: 20px;

  &::placeholder {
    opacity: 0.8;
  }

  &:focus {
    outline: none;
    border: 2px solid ${({ theme }) => theme.colors.primary};
  }
`;

const SearchWrap = styled.div`
  position: relative;
  margin-bottom: 15px;
  min-width: 415px;
  padding: 0 25px;

  svg {
    position: absolute;
    left: 42px;
  }
`;

const CollateralTypesGrid = styled.div<{ border?: boolean; negativeMargin?: boolean }>`
  display: grid;
  grid-template-columns: 5fr 5fr 4fr;
  width: 100%;
  ${({ border }) => (border ? 'border-bottom: 1px solid #304a68;' : '')}
  ${({ negativeMargin }) => (negativeMargin ? 'margin-top: -10px;' : '')}

  .white, .grey {
    transition: all ease 0.2s;
  }

  .white {
    color: #ffffff;
  }

  .grey {
    color: #d5d7db;
  }

  &:hover,
  &.active {
    .white,
    .grey {
      color: ${({ theme }) => theme.colors.primaryBright};
    }
  }
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

  img {
    position: absolute;
    left: 0;
  }
`;

const GridWrap = styled.div`
  max-height: 305px;
  overflow-y: auto;
  padding: 0 25px;
`;

const CollateralTypeList = () => {
  const changeCollateralType = useCollateralChangeCollateralType();
  const [searchQuery, setSearchQuery] = useState('');
  const allCollateralData = useAllCollateralData();

  const filteredCollateralTypes = allCollateralData?.filter(
    collateralType =>
      collateralType.symbol.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 ||
      collateralType.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0,
  );

  return (
    <Box p={'25px 0 5px'}>
      <SearchWrap>
        <SearchIcon width="18px" />
        <SearchField
          type="text"
          className="search-field"
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search assets"
          value={searchQuery}
        />
      </SearchWrap>

      {filteredCollateralTypes?.length ? (
        <GridWrap>
          <CollateralTypesGrid>
            <CollateralTypesGridHeader>Asset</CollateralTypesGridHeader>
            <CollateralTypesGridHeader>Collateral</CollateralTypesGridHeader>
            <CollateralTypesGridHeader>Loan</CollateralTypesGridHeader>
          </CollateralTypesGrid>
        </GridWrap>
      ) : null}

      <GridWrap>
        {filteredCollateralTypes.map((collateralType, i, { length }) => {
          const isLast = length - 1 === i;
          const isFirst = 0 === i;

          return (
            <CollateralTypesGrid
              key={i}
              border={!isLast}
              negativeMargin={isFirst}
              onClick={() => changeCollateralType(collateralType.symbol)}
            >
              <CollateralTypesGridItem>
                <AssetInfo>
                  <CurrencyLogo size={'26px'} currency={getTokenFromCurrencyKey(collateralType.symbol)!} />
                  <Box paddingLeft={'40px'}>
                    <Typography className="white" fontWeight={700}>
                      {collateralType.symbol}
                    </Typography>
                    <Typography className="grey">{'Available:'}</Typography>
                  </Box>
                </AssetInfo>
              </CollateralTypesGridItem>
              <CollateralTypesGridItem>
                <Typography className="white">
                  {`${collateralType.collateralUsed.dp(2).toFormat()} ${collateralType.symbol}`}
                </Typography>
                <Typography className="grey">{`${collateralType.collateralAvailable.dp(2).toFormat()} ${
                  collateralType.symbol
                }`}</Typography>
              </CollateralTypesGridItem>
              <CollateralTypesGridItem>
                <Typography className="white">{`${collateralType.loanTaken.dp(2).toFormat()} bnUSD`}</Typography>
                <Typography className="grey">{`${collateralType.loanAvailable.dp(2).toFormat()} bnUSD`}</Typography>
              </CollateralTypesGridItem>
            </CollateralTypesGrid>
          );
        })}

        {filteredCollateralTypes?.length === 0 ? (
          <Typography padding={'10px 0 20px'} width={'100%'} textAlign={'center'}>
            No asset found for <strong>'{searchQuery}'</strong>
          </Typography>
        ) : null}
      </GridWrap>
    </Box>
  );
};

export default CollateralTypeList;
