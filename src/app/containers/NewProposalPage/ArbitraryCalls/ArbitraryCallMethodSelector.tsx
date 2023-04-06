import * as React from 'react';

import { Trans } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { DropdownPopper } from 'app/components/Popover';
import SearchInput from 'app/components/SearchModal/SearchInput';
import { Typography } from 'app/theme';
import { CxMethod } from 'hooks/useCxApi';
import { useUpdateCallMethod } from 'store/arbitraryCalls/hooks';
import { EditableArbitraryCall } from 'store/arbitraryCalls/reducer';

import { FieldInput } from '..';

const MethodSelectorWrap = styled.div`
  width: 100%;
`;

const MethodList = styled.ul`
  max-height: 240px;
  overflow-y: auto;
  margin: 10px 0 0 0;
  list-style-type: none;
  padding: 0;
`;

const MethodListItem = styled.li`
  padding: 4px 0;
`;

const ContentWrap = styled.div`
  padding: 20px;
`;

const ArbitraryCallMethodSelector = ({
  cxApi,
  call,
  callIndex,
}: {
  cxApi: CxMethod[];
  call: EditableArbitraryCall;
  callIndex: number;
}) => {
  const { method } = call;
  const [isOpen, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const updateCallMethod = useUpdateCallMethod();

  const popperRef = React.useRef(null);
  const arrowRef = React.useRef(null);
  const searchRef = React.useRef<HTMLInputElement>();

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredMethods = React.useMemo(() => {
    if (!search) {
      return cxApi;
    } else {
      return cxApi.filter(method => method.name.toLowerCase().includes(search.toLowerCase()));
    }
  }, [cxApi, search]);

  const handleMethodInputClick = () => {
    setOpen(!isOpen);
  };

  React.useEffect(() => {
    let focusTimeout;
    if (isOpen && !isMobile) {
      focusTimeout = setTimeout(() => {
        searchRef.current?.focus();
      }, 50);
    }
    return () => {
      clearTimeout(focusTimeout);
    };
  }, [isOpen]);

  const handleMethodSelect = (method: CxMethod) => {
    setOpen(false);
    setSearch('');
    updateCallMethod(callIndex, method.name);
  };

  return (
    <MethodSelectorWrap>
      <Typography variant="h3" ref={arrowRef} style={{ display: 'inline-block' }}>
        <Trans>Method</Trans>
      </Typography>
      <FieldInput ref={popperRef} onClick={handleMethodInputClick} type="text" defaultValue={method || ''} />
      {/* <ClickAwayListener onClickAway={() => setOpen(false)}>
        <> */}
      <DropdownPopper
        show={isOpen}
        anchorEl={popperRef.current}
        arrowEl={arrowRef.current}
        placement="bottom-start"
        offset={[0, 10]}
        customArrowStyle={{ transform: 'translateX(40px)' }}
      >
        <ContentWrap>
          <SearchInput
            ref={searchRef as React.RefObject<HTMLInputElement>}
            placeholder="Search for a method"
            value={search}
            onChange={onSearchChange}
          />
          <MethodList>
            {filteredMethods.map(method => (
              <MethodListItem key={method.name} onClick={() => handleMethodSelect(method)}>
                {method.name}
              </MethodListItem>
            ))}
          </MethodList>
        </ContentWrap>
      </DropdownPopper>
      {/* </>
      </ClickAwayListener> */}
    </MethodSelectorWrap>
  );
};

export default ArbitraryCallMethodSelector;
