import React, { useState, useRef, useEffect } from 'react';

import arrowIcon from 'btp/src/assets/images/arrow-icon.svg';
import checkedIcon from 'btp/src/assets/images/white-check-icon.svg';
import { Loader } from 'btp/src/components/Loader';
import { colors } from 'btp/src/components/Styles/Colors';
import { Text } from 'btp/src/components/Typography';
import { useOnClickOutside } from 'btp/src/hooks/useOnClickOutside';
import PropTypes from 'prop-types';
import styled from 'styled-components/macro';

const { brandSecondaryBase, grayLine, grayBG } = colors;

const Wrapper = styled.button`
  display: flex;
  align-items: center;
  position: relative;
  z-index: ${({ isOpenSelect }) => (isOpenSelect ? 100 : 1)};

  cursor: pointer;
  padding: 10px 16px;
  border-radius: 4px;
  background-color: ${({ isOpenSelect }) => (isOpenSelect ? brandSecondaryBase : '#01002A')};
  border: 1px solid #2ca9b7;

  &:after {
    content: '';
    display: inline-block;
    width: 12px;
    height: 10px;
    background: transparent center / 100% no-repeat url('${arrowIcon}');
    margin-left: 7.67px;

    ${({ customeArrow }) =>
      customeArrow
        ? `
            background-image: url('${customeArrow}');
            width: 17px;
            height: 15px;
          `
        : ''}
  }

  &:hover {
    background-color: ${brandSecondaryBase};
  }

  ul {
    width: max-content;
    position: absolute;
    right: 0;
    top: calc(100% - 10px);

    border: 1px solid ${grayLine};
    border-radius: 4px;
    box-shadow: 0px 4px 8px rgba(40, 38, 47, 0.8);

    background-color: ${grayBG};
    padding: 4px 0;

    li {
      padding: 10px 16px;
      text-align: left;
      ${({ showCheck }) => (showCheck ? 'padding-left: 40.5px' : '')};

      &:hover {
        background-color: ${brandSecondaryBase};
      }

      &.active {
        background-color: ${brandSecondaryBase};
        display: flex;
        align-items: center;
        padding-left: ${({ showCheck }) => (showCheck ? '10px' : '16px')};

        &:before {
          content: '';
          background: transparent center / contain no-repeat url('${checkedIcon}');
          display: ${({ showCheck }) => (showCheck ? 'inline-block' : 'none')};
          width: 21px;
          height: 15px;
          margin-right: 9.5px;
        }
      }
    }
  }
`;

const Select = ({ options = [], customeArrow, showCheck, loading, onChange = () => {}, name: fieldName, ...ots }) => {
  const ref = useRef();
  const [isOpenSelect, setIsOpenSelect] = useState(false);
  const [selectedValue, setSelectedValue] = useState(options[0] || {});

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!loading) {
      setSelectedValue(options[0] || {});
      onChange({
        target: { value: options[0] ? options[0].value : '', name: fieldName, type: 'input' },
      });
    }
  }, [loading, options.length]);

  const onToggleSelect = () => {
    setIsOpenSelect(!isOpenSelect);
  };
  useOnClickOutside(ref, () => setIsOpenSelect(false));

  return (
    <Wrapper
      ref={ref}
      onClick={() => {
        if (!loading && options.length > 0) onToggleSelect();
      }}
      type="button"
      isOpenSelect={isOpenSelect}
      customeArrow={customeArrow}
      showCheck={showCheck}
      {...ots}
    >
      {loading ? (
        <Loader size="25px" borderSize="3px" />
      ) : selectedValue.renderLabel ? (
        selectedValue.renderLabel()
      ) : (
        <Text className="md">{selectedValue.label || selectedValue.name || 'No options'}</Text>
      )}

      {isOpenSelect && (
        <ul>
          {options.map((opt, idx) => {
            const { label, name, value, renderItem } = opt;
            return (
              <li
                key={idx}
                onClick={() => {
                  setSelectedValue(opt);
                  onChange({ target: { value, name: fieldName, type: 'input' } });
                }}
                className={`${
                  (selectedValue.label && selectedValue.label === label) ||
                  (selectedValue.name && selectedValue.name === name)
                    ? 'active'
                    : ''
                }`}
              >
                {renderItem ? renderItem() : <Text className="sm">{label || name}</Text>}
              </li>
            );
          })}
        </ul>
      )}
    </Wrapper>
  );
};

Select.propTypes = {
  /** Display a available icon */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      /** Display label */
      label: PropTypes.string,
      /** Same as label */
      name: PropTypes.string,
      /** Value */
      value: PropTypes.string,
      /** Custome label */
      renderItem: PropTypes.func,
    }),
  ),
  /** Custom Arrow with Image resource */
  customeArrow: PropTypes.string,
  /** Display check for selected option */
  showCheck: PropTypes.bool,
  /** Is loading */
  loading: PropTypes.bool,
  /** Handle onChange */
  onChange: PropTypes.func,
  /** Field name */
  name: PropTypes.string,
};

export default Select;
