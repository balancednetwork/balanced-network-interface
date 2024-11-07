import React, { useCallback, useState } from 'react';

import { Placement } from '@popperjs/core';
import { Portal } from '@reach/portal';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import useInterval from '@/hooks/useInterval';

const PopoverContainer = styled.div<{ show: boolean }>`
  z-index: ${({ theme }) => theme.zIndices.tooltip};
  visibility: ${props => (props.show ? 'visible' : 'hidden')};
  opacity: ${props => (props.show ? 1 : 0)};
  transition: visibility 150ms linear, opacity 150ms linear;
  max-width: 100vw;
`;

const ContentWrapper = styled.div`
  background: ${({ theme }) => theme.colors.bg4};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text1};
  border-radius: 8px;
  overflow: hidden;
`;

const ReferenceElement = styled.div`
  display: inline-block;
  line-height: 0;
`;

const Arrow = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  z-index: -1;

  &::before {
    position: absolute;
    width: 12px;
    height: 12px;
    z-index: -1;

    content: '';
    transform: rotate(45deg);
    background: ${({ theme }) => theme.colors.primary};
  }

  &.arrow-top,
  &.arrow-top-start,
  &.arrow-top-end {
    bottom: -6px;
  }

  &.arrow-bottom,
  &.arrow-bottom-start,
  &.arrow-bottom-end {
    top: -6px;
  }

  &.arrow-left,
  &.arrow-left-start,
  &.arrow-left-end {
    right: -6px;
  }

  &.arrow-right,
  &.arrow-right-start,
  &.arrow-right-end {
    left: -6px;
  }
`;

export interface PopoverProps {
  content: React.ReactNode;
  show: boolean;
  children: React.ReactNode;
  placement?: Placement;
}

export default function Popover({ content, show, children, placement = 'auto' }: PopoverProps) {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const { styles, update, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: 'absolute',
    modifiers: [
      { name: 'offset', options: { offset: [0, 12] } },
      { name: 'arrow', options: { element: arrowElement } },
    ],
  });
  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);

  return (
    <>
      <span style={{ maxWidth: '100vw', overflow: 'hidden' }}>
        <ReferenceElement ref={setReferenceElement as any}>{children}</ReferenceElement>
      </span>
      <Portal>
        <PopoverContainer show={show} ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
          <ContentWrapper>{content}</ContentWrapper>
          <Arrow
            className={`arrow-${attributes.popper?.['data-popper-placement'] ?? ''}`}
            ref={setArrowElement as any}
            style={styles.arrow}
            {...attributes.arrow}
          />
        </PopoverContainer>
      </Portal>
    </>
  );
}

type OffsetModifier = [number, number];

export interface PopperProps {
  anchorEl: HTMLElement | null;
  arrowEl?: HTMLElement | null;
  containerOffset?: number;
  show: boolean;
  children: React.ReactNode;
  placement?: Placement;
  offset?: OffsetModifier;
}

export function PopperWithoutArrow({ show, children, placement = 'auto', anchorEl }: PopperProps) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, update, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: [0, 2] } }],
  });

  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);

  return (
    <Portal>
      <PopoverContainer show={show} ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
        <ContentWrapper>{children}</ContentWrapper>
      </PopoverContainer>
    </Portal>
  );
}

export function DropdownPopper({
  show,
  children,
  arrowEl,
  containerOffset,
  offset,
  placement = 'auto',
  anchorEl,
}: PopperProps) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);

  const customModifier = React.useMemo(
    () => [
      { name: 'offset', options: { offset: offset ? offset : [20, 12] } },
      {
        name: 'arrow',
        options: {
          element: arrowElement,
        },
      },
    ],
    [arrowElement, offset],
  );

  const { styles, update, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    strategy: 'fixed',
    modifiers: customModifier,
  });
  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);

  if (containerOffset && styles.arrow) {
    const arrowX = arrowEl?.getBoundingClientRect().x || 0;
    styles.arrow = {
      ...styles.arrow,
      transform: `translate3d(${arrowX - containerOffset + 6}px,0,0)`,
    };
  }

  return (
    <Portal>
      <PopoverContainer show={show} ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
        <ContentWrapper>{children}</ContentWrapper>
        <Arrow
          className={`arrow-${attributes.popper?.['data-popper-placement'] ?? ''}`}
          ref={setArrowElement as any}
          style={styles.arrow}
          {...attributes.arrow}
        />
      </PopoverContainer>
    </Portal>
  );
}
