import { Button, ButtonProps } from '@/components/ui/button';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useResizeObserver from 'use-resize-observer';

type IconWithTextProps = ButtonProps & {
  Icon: React.ReactNode;
  text: string;
  onConfirm?: () => void;
  onShowConfirm?: (on: boolean) => void;
  dismissOnHoverOut?: boolean;
  dismissOnHoverDurationMs?: number;
};

/**
 * Allows for hiding and showing some text next to an IconButton
 * Note that for width transitions to animate in CSS we need to always specify the width (no auto)
 * so there's resize observing and measuring going on here.
 */
export const IconWithConfirmTextButton = ({
  Icon,
  text,
  onConfirm,
  onShowConfirm,
  onClick,
  dismissOnHoverOut,
  dismissOnHoverDurationMs = 1000,
  ...rest
}: IconWithTextProps) => {
  const [showText, setShowTextWithoutCallback] = useState(false);
  const [frame, setFrame] = useState<HTMLElement | null>();
  const frameObserver = useResizeObserver<HTMLElement>();
  const hiddenObserver = useResizeObserver<HTMLElement>();

  const setShowText = useCallback(
    (val: boolean) => {
      setShowTextWithoutCallback(val);
      onShowConfirm?.(val);
    },
    [onShowConfirm],
  );

  const dimensionsRef = useRef({
    frame: 0,
    innerText: 0,
  });
  const dimensions = (() => {
    // once opened, we avoid updating it to prevent constant resize loop
    if (!showText) {
      dimensionsRef.current = {
        frame: frameObserver.width || 0,
        innerText: hiddenObserver.width || 0,
      };
    }
    return dimensionsRef.current;
  })();

  // keyboard action to cancel
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!showText || !frame) {
      return undefined;
    }

    const closeAndPrevent = (e: Event) => {
      setShowText(false);
      e.preventDefault();
      e.stopPropagation();
    };

    const clickHandler = (e: MouseEvent) => {
      const { target } = e;
      const shouldClose = !(target instanceof HTMLElement) || !frame.contains(target);
      if (shouldClose) {
        closeAndPrevent(e);
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAndPrevent(e);
      }
    };

    window.addEventListener('click', clickHandler, { capture: true });
    window.addEventListener('keydown', keyHandler, { capture: true });

    return () => {
      window.removeEventListener('click', clickHandler, { capture: true });
      window.removeEventListener('keydown', keyHandler, { capture: true });
    };
  }, [frame, setShowText, showText]);

  const xPad = showText ? 8 : 0;
  const width = showText ? dimensions.frame + dimensions.innerText + xPad * 2 : 40;
  const mouseLeaveTimeout = useRef<NodeJS.Timeout>();

  return (
    <Button
      variant="ghost"
      ref={node => {
        frameObserver.ref(node);
        setFrame(node);
      }}
      {...rest}
      style={{
        overflow: 'hidden',
        transition: 'width 0.2s ease-in-out',
        width,
        paddingLeft: xPad,
        paddingRight: xPad,
      }}
      // @ts-ignore MouseEvent is valid, its a subset of the two mouse events,
      // even manually typing this all out more specifically it still gets mad about any casting for some reason
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (showText) {
          onConfirm?.();
        } else {
          onClick?.(e);
          setShowText(!showText);
        }
      }}
      {...(dismissOnHoverOut && {
        onMouseLeave() {
          mouseLeaveTimeout.current = setTimeout(() => {
            setShowText(false);
          }, dismissOnHoverDurationMs);
        },
        onMouseEnter() {
          if (mouseLeaveTimeout.current) {
            clearTimeout(mouseLeaveTimeout.current);
          }
        },
      })}
    >
      <div className="w-full h-full flex items-center">
        <div className="m-auto flex items-center justify-center">{Icon}</div>

        {/* this outer div is so we can cut it off but keep the inner text width full-width so we can measure it */}
        <div
          className="overflow-hidden"
          style={{
            transition: 'width 0.2s ease-in-out, max-width 0.2s ease-in-out',
            maxWidth: showText ? dimensions.innerText : 0,
            width: showText ? dimensions.innerText : 0,
            margin: showText ? 'auto' : 0,
            // this negative transform offsets for the shift it does due to being 0 width
            transform: showText ? undefined : `translateX(-8px)`,
            minWidth: showText ? dimensions.innerText : 0,
          }}
        >
          <div className="flex shrink-0 overflow-hidden min-w-min" ref={hiddenObserver.ref}>
            {text}
          </div>
        </div>
      </div>
    </Button>
  );
};
