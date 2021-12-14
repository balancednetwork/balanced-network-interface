import React, { useState } from 'react';

import { useMedia } from 'react-use';
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

const SearchWrap = styled.div<{ width?: number }>`
  position: relative;
  margin-bottom: 15px;
  width: 100%;
  padding: 0 25px;

  svg {
    position: absolute;
    left: 42px;
  }
`;

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

const CollateralTypeList = ({ width }) => {
  const changeCollateralType = useCollateralChangeCollateralType();
  const [searchQuery, setSearchQuery] = useState('');
  const allCollateralData = useAllCollateralData();
  const hideCollateralInfoColumn = useMedia('(max-width: 500px)');

  const filteredCollateralTypes = allCollateralData?.filter(
    collateralType =>
      collateralType.symbol.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 ||
      collateralType.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0,
  );

  return (
    <Box p={'25px 0 5px'} width={width}>
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
          <CollateralTypesGrid hideCollateralInfoColumn={hideCollateralInfoColumn}>
            <CollateralTypesGridHeader>Asset</CollateralTypesGridHeader>
            {!hideCollateralInfoColumn && <CollateralTypesGridHeader>Collateral</CollateralTypesGridHeader>}
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
              hideCollateralInfoColumn={hideCollateralInfoColumn}
              onClick={() => changeCollateralType(collateralType.symbol)}
            >
              <CollateralTypesGridItem>
                <AssetInfo>
                  <CurrencyLogo size={'26px'} currency={getTokenFromCurrencyKey(collateralType.symbol)!} />
                  <Box>
                    <Typography className="white" fontWeight={700}>
                      {collateralType.symbol}
                    </Typography>
                    <Typography className="grey">{'Available:'}</Typography>
                  </Box>
                </AssetInfo>
              </CollateralTypesGridItem>

              {!hideCollateralInfoColumn && (
                <CollateralTypesGridItem>
                  <Typography className="white">
                    {`${collateralType.collateralUsed.dp(2).toFormat()} ${collateralType.symbol}`}
                  </Typography>
                  <Typography className="grey">{`${collateralType.collateralAvailable.dp(2).toFormat()} ${
                    collateralType.symbol
                  }`}</Typography>
                </CollateralTypesGridItem>
              )}

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
