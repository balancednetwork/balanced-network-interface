import React, { useCallback, useState } from 'react';

import { Placement } from '@popperjs/core';
import { Portal } from '@reach/portal';
import { usePopper } from 'react-popper';

import useInterval from '@/hooks/useInterval';
import { cn } from '@/lib/utils';

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
      <div ref={setReferenceElement as any} style={refStyle}>
        {children}
      </div>
      <Portal>
        <div
          className={cn(
            `z-${zIndex || 'auto'}`,
            show ? 'visible opacity-100' : 'invisible opacity-0',
            'transition-opacity duration-150',
          )}
          ref={setPopperElement as any}
          style={{ ...style, ...styles.popper }}
          {...attributes.popper}
        >
          {/* content */}
          <div className="bg-background border-[1px] border-border rounded-lg overflow-hidden">{content}</div>
          {/* arrow */}
          <div
            className={`absolute w-3 h-3 z-[-1] ${attributes.popper?.['data-popper-placement']?.startsWith('top') ? 'bottom-[-6px]' : ''} ${attributes.popper?.['data-popper-placement']?.startsWith('bottom') ? 'top-[-6px]' : ''} ${attributes.popper?.['data-popper-placement']?.startsWith('left') ? 'right-[-6px]' : ''} ${attributes.popper?.['data-popper-placement']?.startsWith('right') ? 'left-[-6px]' : ''}`}
            ref={setArrowElement as any}
            style={styles.arrow}
            {...attributes.arrow}
          >
            <div className="absolute w-3 h-3 z-[-1] transform rotate-45 bg-background border-[1px] border-border"></div>
          </div>
        </div>
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
  zIndex?: number;
  forcePlacement?: boolean;
  strategy?: 'fixed' | 'absolute';
  offset?: OffsetModifier;
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
  strategy,
  forcePlacement,
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
      { name: 'flip', options: { fallbackPlacements: forcePlacement ? [] : [placement] } },
    ],
    [arrowElement, offset, forcePlacement, placement],
  );

  const { styles, update, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    strategy: strategy ?? 'fixed',
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

  if (customArrowStyle && styles.arrow) {
    styles.arrow = { ...styles.arrow, ...customArrowStyle };
  }

  return (
    <Portal>
      <div
        className={cn(
          `z-${zIndex || 'auto'}`,
          show ? 'visible opacity-100' : 'invisible opacity-0',
          'transition-opacity duration-150',
        )}
        ref={setPopperElement as any}
        style={styles.popper}
        {...attributes.popper}
      >
        <div className="bg-background border-[1px] border-border rounded-lg overflow-hidden">{children}</div>
        <div
          className={`absolute w-3 h-3 z-[-1] ${attributes.popper?.['data-popper-placement']?.startsWith('top') ? 'bottom-[-6px]' : ''} ${attributes.popper?.['data-popper-placement']?.startsWith('bottom') ? 'top-[-6px]' : ''} ${attributes.popper?.['data-popper-placement']?.startsWith('left') ? 'right-[-6px]' : ''} ${attributes.popper?.['data-popper-placement']?.startsWith('right') ? 'left-[-6px]' : ''}`}
          ref={setArrowElement as any}
          style={styles.arrow}
          {...attributes.arrow}
        >
          <div className="absolute w-3 h-3 z-[-1] transform rotate-45 border-[1px] border-border bg-background"></div>
        </div>
      </div>
    </Portal>
  );
}
