import * as React from 'react';

import { Trans } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import Divider from 'app/components/Divider';
import { DropdownPopper } from 'app/components/Popover';
import SearchInput from 'app/components/SearchModal/SearchInput';
import { Typography } from 'app/theme';
import useArrowControl from 'hooks/useArrowControl';
import { CxMethod } from 'hooks/useCxApi';
import useKeyPress from 'hooks/useKeyPress';
import { useUpdateCallMethod } from 'store/arbitraryCalls/hooks';
import { EditableArbitraryCall } from 'store/arbitraryCalls/reducer';

const MethodSelectorWrap = styled.div`
  width: 100%;
`;

const MethodList = styled.ul`
  max-height: 240px;
  min-width: 160px;
  overflow-y: auto;
  margin: 0;
  list-style-type: none;
  padding: 0;
`;

const MethodListItem = styled.li`
  padding: 9px 0;
  cursor: pointer;
  transition: color ease 0.2s;

  &.active,
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ContentWrap = styled.div`
  padding: 15px;
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
  const [isOpen, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const updateCallMethod = useUpdateCallMethod();

  const filteredMethods = React.useMemo(() => {
    if (!search) {
      return cxApi;
    } else {
      return cxApi.filter(method => method.name.toLowerCase().includes(search.toLowerCase()));
    }
  }, [cxApi, search]);

  const enter = useKeyPress('Enter');
  const { activeIndex, setActiveIndex } = useArrowControl(isOpen, filteredMethods?.length || 0);

  const popperRef = React.useRef(null);
  const arrowRef = React.useRef(null);
  const searchRef = React.useRef<HTMLInputElement>();

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleMethodSelect = React.useCallback(
    (method: CxMethod) => {
      setOpen(false);
      updateCallMethod(callIndex, method.name, method.inputs);
      setSearch(method.name);
    },
    [callIndex, updateCallMethod],
  );

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

  React.useEffect(() => {
    if (isOpen) {
      setActiveIndex(undefined);
    }
  }, [isOpen, setActiveIndex]);

  React.useEffect(() => {
    if (isOpen && enter && filteredMethods?.length && activeIndex !== undefined) {
      handleMethodSelect(filteredMethods[activeIndex]);
      setSearch(filteredMethods[activeIndex].name);
    }
  }, [isOpen, activeIndex, enter, filteredMethods, handleMethodSelect]);

  return (
    <MethodSelectorWrap>
      <Typography variant="h3" ref={arrowRef} style={{ display: 'inline-block' }}>
        <Trans>Method</Trans>
      </Typography>
      <SearchInput
        ref={popperRef}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        value={search}
        onChange={onSearchChange}
        type="text"
        style={{ margin: '10px 0 20px' }}
      />
      <DropdownPopper
        show={isOpen}
        anchorEl={popperRef.current}
        arrowEl={arrowRef.current}
        placement="bottom-start"
        offset={[0, 10]}
        customArrowStyle={{ transform: 'translateX(19px)' }}
      >
        <ContentWrap>
          <MethodList>
            <Typography color="text" fontSize={18} fontWeight="bold" mt="5px" mb="10px">
              Available contract methods
            </Typography>
            {filteredMethods.map((method, index) => (
              <React.Fragment key={index}>
                <MethodListItem
                  key={method.name}
                  onClick={() => handleMethodSelect(method)}
                  onFocus={() => setActiveIndex(index)}
                  className={index === activeIndex ? 'active' : ''}
                >
                  {method.name}
                </MethodListItem>
                {index !== filteredMethods.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </MethodList>
        </ContentWrap>
      </DropdownPopper>
    </MethodSelectorWrap>
  );
};

export default ArbitraryCallMethodSelector;
