import React, { RefObject, useEffect, useRef, useState } from 'react';
import CollateralTypeList from './CollateralTypeList';
import { Box, Flex } from 'rebass';
import SearchInput from '../SearchModal/SearchInput';
import useKeyPress from 'hooks/useKeyPress';
import { isMobile } from 'react-device-detect';
import { Trans, t } from '@lingui/macro';
import { ChartControlButton as CollateralTabButton } from 'app/pages/trade/supply/_components/utils';

export enum CollateralTab {
  ALL = 'all',
  YOUR = 'your',
}

const CollateralTypeListWrap = ({ width, setAnchor, anchor, ...rest }) => {
  const inputRef = useRef<HTMLInputElement>();
  const handleEscape = useKeyPress('Escape');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collateralTab, setCollateralTab] = useState(CollateralTab.ALL);

  useEffect(() => {
    if (anchor && handleEscape) {
      setAnchor(null);
    }
  }, [anchor, handleEscape, setAnchor]);

  return (
    <Box p={'25px 25px 5px'} width={width}>
      <SearchInput
        type="text"
        id="collateral-search-input"
        placeholder={t`Search assets`}
        autoComplete="off"
        value={searchQuery}
        ref={inputRef as RefObject<HTMLInputElement>}
        tabIndex={isMobile ? -1 : 1}
        onChange={e => {
          setSearchQuery(e.target.value);
        }}
      />
      <Flex justifyContent="center" mt={3}>
        <CollateralTabButton
          $active={collateralTab === CollateralTab.YOUR}
          mr={2}
          onClick={() => setCollateralTab(CollateralTab.YOUR)}
        >
          <Trans>Your collateral</Trans>
        </CollateralTabButton>
        <CollateralTabButton
          $active={collateralTab === CollateralTab.ALL}
          onClick={() => setCollateralTab(CollateralTab.ALL)}
        >
          <Trans>All collateral</Trans>
        </CollateralTabButton>
      </Flex>
      <CollateralTypeList setAnchor={setAnchor} collateralTab={collateralTab} />
    </Box>
  );
};

export default CollateralTypeListWrap;
