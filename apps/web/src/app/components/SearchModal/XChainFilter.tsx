// Start Generation Here
import { XChainId, xChainMap } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Box, Flex } from 'rebass';
import styled, { css, useTheme } from 'styled-components';
import { Button } from '../Button';
import { ChainLogo } from '../ChainLogo';
import { MouseoverTooltip } from '../Tooltip';

interface XChainFilterProps {
  filterItems: XChainId[];
  filterState: XChainId[];
  onChainClick: (xChainId?: XChainId) => void;
}

const FilterContentWrap = styled(Box)<{ $isOpen: boolean }>`
  transition: padding-top 0.3s ease-in-out, padding-bottom 0.3s ease-in-out;
  padding-top: ${({ $isOpen }) => ($isOpen ? '7px' : '0px')};
  padding-bottom: ${({ $isOpen }) => ($isOpen ? '7px' : '0px')};
`;

const FilterButton = styled(Button)<{ $isOpen: boolean }>`
  padding-left: 5px;
  padding-right: 5px;
  text-align: center; 
  width: 40px;
  background-color: ${({ theme }) => theme.colors.bg3};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      background-color: ${({ theme }) => theme.colors.primary};
    `}
`;

const ChainsWrap = styled(Flex)`
  flex-wrap: wrap;
  background-color: ${({ theme }) => theme.colors.bg3};
  padding: 10px;
  border-radius: 10px;
  position: relative;

  @keyframes moveArrowUp {
    from {
      top: 0;
    }
    to {
      top: -10px;
    }
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    right: 10px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid ${({ theme }) => theme.colors.bg3};
    animation: moveArrowUp 0.3s ease-in-out forwards;
  }
`;

const ChainLogoWrap = styled(Box)<{ $isActive: boolean }>`
  opacity: 0.25;
  padding: 5px 7px;
  cursor: pointer;
  transition: opacity 0.2s ease;

  ${({ $isActive }) =>
    $isActive
      ? css`
      opacity: 1;
    `
      : css`
      &:hover {
        opacity: 0.6;
      }
    `}
`;

const ButtonAll = styled(Button)<{ $isActive: boolean }>`
  padding-left: 10px;
  padding-right: 10px;
  font-size: 14px;
  background-color: ${({ theme }) => theme.colors.bg3};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  ${({ $isActive }) =>
    $isActive &&
    css`
      background-color: ${({ theme }) => theme.colors.primary}; 
    `}
`;

const XChainFilter: React.FC<XChainFilterProps> = props => {
  const { filterItems, filterState, onChainClick } = props;
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const theme = useTheme();

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const buttonText = filterState.length > 0 ? '...' : 'All';

  return (
    <>
      <FilterButton onClick={handleToggle} $isOpen={isOpen}>
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
                <ButtonAll onClick={() => onChainClick()} $isActive={filterState.length === 0}>
                  All
                </ButtonAll>
                <AnimatePresence>
                  {filterItems.map(item => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, scale: 0, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 'auto' }}
                      exit={{ opacity: 0, scale: 0, width: 0 }}
                    >
                      <MouseoverTooltip text={`${xChainMap[item].name}`} autoWidth placement="top">
                        <ChainLogoWrap
                          onClick={() => onChainClick(item)}
                          $isActive={filterState.length === 0 || filterState.includes(item)}
                        >
                          <ChainLogo chain={xChainMap[item]} size="22px" />
                        </ChainLogoWrap>
                      </MouseoverTooltip>
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
