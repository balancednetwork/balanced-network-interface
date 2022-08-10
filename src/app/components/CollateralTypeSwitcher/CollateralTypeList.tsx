import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useMedia } from 'react-use';
import { Box } from 'rebass';
import styled from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { Typography } from 'app/theme';
import { ReactComponent as SearchIcon } from 'assets/icons/search.svg';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import useArrowControl from 'hooks/useArrowControl';
import useKeyPress from 'hooks/useKeyPress';
import { useCollateralChangeCollateralType, useAllCollateralData } from 'store/collateral/hooks';

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
  const enter = useKeyPress('Enter');
  const escape = useKeyPress('Escape');

  const filteredCollateralTypes = useMemo(
    () =>
      allCollateralData?.filter(
        collateralType =>
          collateralType.symbol.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 ||
          collateralType.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0,
      ),
    [allCollateralData, searchQuery],
  );

  const { activeIndex, setActiveIndex } = useArrowControl(!!anchor, filteredCollateralTypes?.length || 0);

  const handleCollateralTypeChange = useCallback(
    symbol => {
      setAnchor(null);
      changeCollateralType(symbol);
    },
    [changeCollateralType, setAnchor],
  );

  //on enter press
  useEffect(() => {
    if (anchor && filteredCollateralTypes?.length && enter) {
      setAnchor(null);
      activeIndex !== undefined && changeCollateralType(filteredCollateralTypes[activeIndex].symbol);
    }
  }, [
    anchor,
    activeIndex,
    enter,
    filteredCollateralTypes,
    filteredCollateralTypes?.length,
    changeCollateralType,
    setAnchor,
  ]);

  useEffect(() => {
    if (anchor && escape) {
      setAnchor(null);
    }
  }, [anchor, escape, setAnchor]);

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
        {filteredCollateralTypes?.map((collateralType, i, { length }) => {
          const isLast = length - 1 === i;
          const isFirst = 0 === i;

          return (
            <CollateralTypesGrid
              key={i}
              border={!isLast}
              negativeMargin={isFirst}
              hideCollateralInfoColumn={hideCollateralInfoColumn}
              onClick={() => handleCollateralTypeChange(collateralType.symbol)}
              onMouseEnter={() => setActiveIndex(i)}
              className={i === activeIndex ? 'active' : ''}
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
                  <Typography className="white">{`$${collateralType.collateralDeposit.toFormat(0)}`}</Typography>
                  <Typography className="grey">{`$${collateralType.collateralAvailable.toFormat(0)}`}</Typography>
                </CollateralTypesGridItem>
              )}

              <CollateralTypesGridItem>
                <Typography className="white">{`$${collateralType.loanTaken.toFormat(0)}`}</Typography>
                <Typography className="grey">{`$${collateralType.loanAvailable.toFormat(0)}`}</Typography>
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
