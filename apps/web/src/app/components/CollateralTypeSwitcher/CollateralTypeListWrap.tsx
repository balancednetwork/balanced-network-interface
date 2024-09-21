import React, { RefObject, useEffect, useRef, useState } from 'react';

import { Trans, t } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { Box, Flex } from 'rebass';

import { ChartControlButton as CollateralTabButton } from '@/app/components/ChartControl';
import useKeyPress from '@/hooks/useKeyPress';
import { useSignedInWallets } from '@/hooks/useWallets';
import SearchInput from '../SearchModal/SearchInput';
import CollateralTypeList from './CollateralTypeList';

export enum CollateralTab {
  ALL = 'all',
  YOUR = 'your',
}

const CollateralTypeListWrap = ({ width, setAnchor, anchor, ...rest }) => {
  const inputRef = useRef<HTMLInputElement>();
  const handleEscape = useKeyPress('Escape');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collateralTab, setCollateralTab] = useState(CollateralTab.YOUR);
  const signedInWallets = useSignedInWallets();

  useEffect(() => {
    if (anchor && handleEscape) {
      setAnchor(null);
    }
  }, [anchor, handleEscape, setAnchor]);

  return (
    <Box p={'25px 25px 25px'} width={width}>
      <SearchInput
        type="text"
        id="collateral-search-input"
        placeholder={t`Search assets...`}
        autoComplete="off"
        value={searchQuery}
        ref={inputRef as RefObject<HTMLInputElement>}
        tabIndex={isMobile ? -1 : 1}
        onChange={e => {
          setSearchQuery(e.target.value);
        }}
        style={{ marginBottom: '15px' }}
      />
      {signedInWallets.length ? (
        <Flex justifyContent="center" mb={3}>
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
      ) : null}

      <CollateralTypeList
        setAnchor={setAnchor}
        query={searchQuery}
        collateralTab={signedInWallets.length ? collateralTab : CollateralTab.ALL}
      />
    </Box>
  );
};

export default CollateralTypeListWrap;
