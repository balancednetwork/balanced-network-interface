// Start Generation Here
import { XChainId, xChainMap } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { isMobile } from 'react-device-detect';
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
  padding-top: ${({ $isOpen }) => ($isOpen ? '17px' : '0px')};
  padding-bottom: ${({ $isOpen }) => ($isOpen ? '7px' : '0px')};
`;

const FilterButton = styled(Button)<{ $isOpen: boolean }>`
  padding-left: 5px;
  padding-right: 5px;
  font-size: 14px;
  width: 40px;
  background-color: ${({ theme }) => theme.colors.bg3};
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

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

const InvertibleChainLogo = styled(Box)<{ $isInverted: boolean }>`
  ${({ $isInverted }) =>
    $isInverted &&
    css`
      filter: brightness(0) invert(1);
    `}
`;

const INVERTED_LOGOS_XCHAIN_IDS: XChainId[] = ['0x1.icon'];

const XChainFilter: React.FC<XChainFilterProps> = props => {
  const { filterItems, filterState, onChainClick } = props;
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const allSelected =
    filterState.length === filterItems.length && filterItems.every(item => filterState.includes(item));

  const ButtonContent = () => {
    if (filterState.length === 0 || allSelected) {
      return 'All';
    }

    if (filterState.length > 1) {
      return filterState.length;
    }

    if (filterState.length === 1) {
      return (
        <InvertibleChainLogo $isInverted={INVERTED_LOGOS_XCHAIN_IDS.includes(filterState[0])}>
          <ChainLogo chain={xChainMap[filterState[0]]} size="20px" />
        </InvertibleChainLogo>
      );
    }

    return '...';
  };

  return (
    <>
      <FilterButton onClick={handleToggle} $isOpen={isOpen}>
        <ButtonContent />
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
                <ButtonAll onClick={() => onChainClick()} $isActive={filterState.length === 0 || allSelected}>
                  All
                </ButtonAll>
                <AnimatePresence>
                  {filterItems.map(item => (
                    <motion.div
                      key={item}
                      initial={{ scale: 0, width: 0, opacity: 0 }}
                      animate={{
                        scale: 1,
                        width: 'auto',
                        opacity: 1,
                        transition: {
                          scale: { duration: 0.2 },
                          width: { duration: 0.2 },
                          opacity: { duration: 0.2, delay: 0.1 },
                        },
                      }}
                      exit={{
                        scale: 0,
                        width: 0,
                        opacity: 0,
                        transition: {
                          opacity: { duration: 0.1 },
                          scale: { duration: 0.2, delay: 0.1 },
                          width: { duration: 0.2, delay: 0.1 },
                        },
                      }}
                    >
                      <MouseoverTooltip
                        text={`${xChainMap[item].name}`}
                        autoWidth
                        placement="bottom"
                        closeAfterDelay={isMobile ? 1000 : undefined}
                      >
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
