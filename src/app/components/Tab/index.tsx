import React from 'react';

import { isFragment } from 'react-is';
import styled from 'styled-components';

const StyledTabs = styled.ul`
  display: inline-block;
  margin: 0;
  margin-bottom: -5px;
  padding-left: 0;
`;

export const Tabs: React.FC<{
  value?: number;
  onChange?: (event: React.MouseEvent, value: number) => void;
}> = props => {
  const { children: childrenProp, value = 0, onChange } = props;

  let childIndex = 0;
  const valueToIndex = new Map();

  const children = React.Children.map(childrenProp, child => {
    if (!React.isValidElement(child)) {
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      if (isFragment(child)) {
        console.error(
          ["The Tabs component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join(
            '\n',
          ),
        );
      }
    }

    const childValue = child.props.value === undefined ? childIndex : child.props.value;
    valueToIndex.set(childValue, childIndex);
    const selected = childValue === value;

    childIndex += 1;
    return React.cloneElement(child, {
      selected,
      onChange,
      value: childValue,
    });
  });

  return <StyledTabs role="tablist">{children}</StyledTabs>;
};

const StyledTab = styled.li<{ selected: boolean }>`
  float: left;
  margin-right: 5px;
  padding: 10px 15px;
  list-style: none;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  background-color: ${({ selected }) => (selected ? '#144a68' : '#0c2a4d')};
  transition: background-color 0.3s ease;
  outline: none;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 15px 25px;
  `};

  &:not([aria-selected='true']):hover {
    cursor: pointer !important;
    background-color: #0f3859;
    transition: background-color 0.2s ease;
  }
`;

export const Tab = props => {
  const { children, onChange, selected, value, ...rest } = props;

  const handleClick = (event: React.MouseEvent) => {
    if (onChange) {
      onChange(event, value);
    }
  };

  return (
    <StyledTab
      onClick={handleClick}
      selected={selected}
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      {...rest}
    >
      {children}
    </StyledTab>
  );
};

export const TabPanel: React.FC<{ value: number; index: number }> = props => {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && children}
    </div>
  );
};
