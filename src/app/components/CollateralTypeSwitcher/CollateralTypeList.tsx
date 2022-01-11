import React, { useState, useEffect } from 'react';

import { useMedia } from 'react-use';
import { Box } from 'rebass';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { Typography } from 'app/theme';
import { ReactComponent as SearchIcon } from 'assets/icons/search.svg';
import useKeyPress from 'hooks/useKeyPress';
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

  &.active {
    transform: translate3d(4px, 0, 0);
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

const CollateralTypeList = ({ width, setAnchor, anchor, ...rest }) => {
  const changeCollateralType = useCollateralChangeCollateralType();
  const [searchQuery, setSearchQuery] = useState('');
  const allCollateralData = useAllCollateralData();
  const hideCollateralInfoColumn = useMedia('(max-width: 500px)');

  const filteredCollateralTypes = allCollateralData?.filter(
    collateralType =>
      collateralType.symbol.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 ||
      collateralType.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0,
  );

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const arrowDown = useKeyPress('ArrowDown', true);
  const arrowUp = useKeyPress('ArrowUp', true);
  const enter = useKeyPress('Enter');
  const escape = useKeyPress('Escape');

  useEffect(() => {
    if (anchor && filteredCollateralTypes.length && arrowDown) {
      setActiveIndex(prevState => (prevState < filteredCollateralTypes.length - 1 ? prevState + 1 : prevState));
    }
  }, [anchor, arrowDown, filteredCollateralTypes.length]);

  useEffect(() => {
    if (anchor && filteredCollateralTypes.length && arrowUp) {
      setActiveIndex(prevState => (prevState > 0 ? prevState - 1 : prevState));
    }
  }, [anchor, arrowUp, filteredCollateralTypes.length]);

  useEffect(() => {
    if (anchor && filteredCollateralTypes.length && enter) {
      setAnchor(null);
      changeCollateralType(filteredCollateralTypes[activeIndex].symbol);
    }
  }, [
    anchor,
    activeIndex,
    enter,
    filteredCollateralTypes,
    filteredCollateralTypes.length,
    changeCollateralType,
    setAnchor,
  ]);

  useEffect(() => {
    if (anchor && escape) {
      setAnchor(null);
    }
  }, [anchor, escape, setAnchor]);

  useEffect(() => {
    if (anchor && filteredCollateralTypes.length && hoveredIndex !== undefined) {
      setActiveIndex(hoveredIndex);
    }
  }, [anchor, hoveredIndex, filteredCollateralTypes.length]);

  useEffect(() => {
    if (anchor && activeIndex >= filteredCollateralTypes.length) {
      setActiveIndex(Math.max(filteredCollateralTypes.length - 1, 0));
    }
  }, [anchor, activeIndex, filteredCollateralTypes.length]);

  return (
    <Box p={'25px 0 5px'} width={width}>
      <SearchWrap>
        <SearchIcon width="18px" />
        <SearchField
          type="text"
          autoFocus
          className="search-field"
          onChange={e => {
            setSearchQuery(e.target.value);
            activeIndex === undefined && setActiveIndex(0);
          }}
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
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(undefined)}
              className={i === activeIndex ? 'active' : ''}
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
