import { AccordionItem, AccordionButton, AccordionPanel } from '@reach/accordion';
import styled from 'styled-components';

export const StyledAccordionItem = styled(AccordionItem)<{ border?: boolean }>`
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
  transition: border-bottom ease-in-out 50ms 480ms;
`;

export const StyledAccordionButton = styled(AccordionButton)`
  background-color: transparent;
  width: 100%;
  border: none;
  position: relative;

  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid #144a68;
    position: absolute;
    transition: all ease-in-out 200ms;
    transform: translate3d(0, 20px, 0);
    opacity: 0;
    pointer-events: none;
    bottom: 0;
    left: 30px;
  }

  & > div {
    p,
    & > div {
      transition: all ease-in-out 200ms;
      path {
        transition: all ease-in-out 200ms;
      }
    }
  }

  &:hover {
    & > div {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary};
        path {
          stroke: ${({ theme }) => theme.colors.primary} !important;
        }
      }
    }
  }
  &[aria-expanded='true'] {
    &:before {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    & > div {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary};
        & > svg {
          transform: rotateX(180deg);

          path {
            stroke: ${({ theme }) => theme.colors.primary} !important;
          }
        }
      }
    }
  }
`;

export const StyledAccordionPanel = styled(AccordionPanel)`
  overflow: hidden;
  max-height: 0;
  transition: all ease-in-out 0.5s;
  &[data-state='open'] {
    max-height: 800px;
    ${({ theme }) => theme.mediaWidth.upSmall`
      max-height: 400px;
    `}
  }
`;
