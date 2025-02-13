// Start Generation Here
import { XChainId, xChainMap } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Box, Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';
import { Button } from '../Button';
import { ChainLogo } from '../ChainLogo';

interface XChainFilterProps {
  filterItems: XChainId[];
  filterState: XChainId[];
  onChainClick: (xChainId: XChainId) => void;
}

const FilterContentWrap = styled(Box)<{ $isOpen: boolean }>`
  transition: padding-top 0.3s ease-in-out, padding-bottom 0.3s ease-in-out;
  padding-top: ${({ $isOpen }) => ($isOpen ? '7px' : '0px')};
  padding-bottom: ${({ $isOpen }) => ($isOpen ? '7px' : '0px')};
`;

const FilterButton = styled(Button)`
  padding-left: 12px;
  padding-right: 12px;
`;

const ChainsWrap = styled(Flex)`
  flex-wrap: wrap;
  background-color: ${({ theme }) => theme.colors.bg3};
  padding: 10px;
  border-radius: 10px;
`;

const ChainLogoWrap = styled(Box)`
  padding: 5px 7px;
`;

const ButtonAll = styled(Button)`
  padding-left: 10px;
  padding-right: 10px;
  font-size: 14px;
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

      <FilterContentWrap $isOpen={isOpen}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ChainsWrap>
                <ButtonAll onClick={() => alert('hey')}>All</ButtonAll>
                <AnimatePresence>
                  {filterItems.map(item => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, scale: 0, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 'auto' }}
                      exit={{ opacity: 0, scale: 0, width: 0 }}
                    >
                      <ChainLogoWrap>
                        <ChainLogo chain={xChainMap[item]} size="22px" />
                      </ChainLogoWrap>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </ChainsWrap>
            </motion.div>
          )}
        </AnimatePresence>
      </FilterContentWrap>
    </>
  );
};

export default XChainFilter;
