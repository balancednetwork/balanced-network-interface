import React, { useCallback, useState } from 'react';

import { Placement } from '@popperjs/core';
import Portal from '@reach/portal';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import useInterval from 'hooks/useInterval';

const PopoverContainer = styled.div<{ show: boolean; zIndex?: number }>`
  z-index: ${({ zIndex, theme }) => zIndex || theme.zIndices.tooltip};
  visibility: ${props => (props.show ? 'visible' : 'hidden')};
  opacity: ${props => (props.show ? 1 : 0)};
  transition: visibility 150ms linear, opacity 150ms linear;
`;

const SelectorPopoverWrapper = styled.div`
  background: ${({ theme }) => theme.colors.bg4};
  color: ${({ theme }) => theme.colors.text1};
  border-radius: 0px 0px 10px 10px;
  overflow: hidden;
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

  ::before {
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

const skidding = {
  'top-end': 8,
};

export interface PopoverProps {
  content: React.ReactNode;
  show: boolean;
  children: React.ReactNode;
  placement?: Placement;
  forcePlacement?: boolean;
  style?: React.CSSProperties;
  refStyle?: React.CSSProperties;
  zIndex?: number;
  fallbackPlacements?: Placement[];
  strategy?: 'fixed' | 'absolute';
  offset?: [number, number];
}

export default function Popover({
  style = {},
  refStyle = {},
  content,
  show,
  children,
  placement = 'auto',
  forcePlacement,
  zIndex,
  fallbackPlacements,
  strategy,
  offset,
}: PopoverProps) {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const { styles, update, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: strategy ? strategy : 'fixed',
    modifiers: [
      { name: 'offset', options: { offset: offset || [skidding[placement] || 0, 12] } },
      { name: 'arrow', options: { element: arrowElement } },
      { name: 'flip', options: { fallbackPlacements: forcePlacement ? [] : fallbackPlacements } },
    ],
  });
  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);

  return (
    <>
      <ReferenceElement ref={setReferenceElement as any} style={refStyle}>
        {children}
      </ReferenceElement>
      <Portal>
        <PopoverContainer
          show={show}
          ref={setPopperElement as any}
          style={{ ...style, ...styles.popper }}
          zIndex={zIndex}
          {...attributes.popper}
        >
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
  customArrowStyle?: React.CSSProperties;
  containerOffset?: number;
  show: boolean;
  children: React.ReactNode;
  placement?: Placement;
  offset?: OffsetModifier;
}

export function PopperWithoutArrow({ show, children, placement = 'auto', anchorEl, offset }: PopperProps) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, update, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    strategy: 'absolute',
    modifiers: [{ name: 'offset', options: { offset: offset } }],
  });

  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);

  return (
    <Portal>
      <PopoverContainer show={show} ref={setPopperElement as any} style={{ ...styles.popper }} {...attributes.popper}>
        <ContentWrapper>{children}</ContentWrapper>
      </PopoverContainer>
    </Portal>
  );
}

export function DropdownPopper({
  show,
  children,
  placement = 'auto',
  anchorEl,
  arrowEl,
  customArrowStyle,
  containerOffset,
  offset,
  zIndex,
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
    styles.arrow.transform = `translate3d(${arrowX - containerOffset + 6}px,0,0)`;
  }

  if (customArrowStyle && styles.arrow) {
    styles.arrow = { ...styles.arrow, ...customArrowStyle };
  }

  return (
    <Portal>
      <PopoverContainer
        show={show}
        ref={setPopperElement as any}
        zIndex={zIndex}
        style={styles.popper}
        {...attributes.popper}
      >
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

export interface PopperProps {
  anchorEl: HTMLElement | null;
  show: boolean;
  children: React.ReactNode;
  placement?: Placement;
  zIndex?: number;
}

export function SelectorPopover({ show, children, placement = 'auto', anchorEl }: PopperProps) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, update, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    strategy: 'absolute',
    modifiers: [{ name: 'offset', options: { offset: [0, 1] } }],
  });
  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);
  return (
    <Portal>
      <PopoverContainer show={show} ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
        <SelectorPopoverWrapper>{children}</SelectorPopoverWrapper>
      </PopoverContainer>
    </Portal>
  );
}
export interface Props {
  show: boolean;
  children: React.ReactNode;
  placement?: Placement;
  content: React.ReactNode;
  zIndex?: number;
}

export function PopperWithoutArrowAndBorder({ content, show, children, zIndex, placement = 'auto' }: Props) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);

  const { styles, update, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: [0, 12] } }],
  });
  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);

  return (
    <>
      <ReferenceElement ref={setReferenceElement as any}>{children}</ReferenceElement>
      <Portal>
        <PopoverContainer
          show={show}
          ref={setPopperElement as any}
          style={styles.popper}
          {...attributes.popper}
          zIndex={zIndex}
        >
          <ContentWrapper style={{ border: 'none' }}>{content}</ContentWrapper>
        </PopoverContainer>
      </Portal>
    </>
  );
}
