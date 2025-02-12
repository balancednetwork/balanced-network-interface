// Start Generation Here
import { XChainId } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Box } from 'rebass';
import styled, { useTheme } from 'styled-components';
import { Button } from '../Button';

interface XChainFilterProps {
  filterItems: XChainId[];
  filterState: XChainId[];
  onChainClick: (xChainId: XChainId) => void;
}

const FilterContentWrap = styled(Box)``;

const FilterButton = styled(Button)`
  padding-left: 12px;
  padding-right: 12px;
`;

const XChainFilter: React.FC<XChainFilterProps> = props => {
  const { filterItems, filterState, onChainClick } = props;
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const theme = useTheme();

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const buttonText = filterState.length > 0 ? '...' : 'All';
  const buttonStyle = { backgroundColor: isOpen ? theme.colors.primary : theme.colors.bg3 };

  return (
    <>
      <FilterButton style={buttonStyle} onClick={handleToggle}>
        {buttonText}
      </FilterButton>

      <FilterContentWrap>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {filterItems.map(item => (
                <div key={item}>{item}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </FilterContentWrap>
    </>
  );
};

export default XChainFilter;
