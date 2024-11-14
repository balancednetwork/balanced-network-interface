import { ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';
import useResizeObserver from 'use-resize-observer';

type AnimateButtonProps = ButtonProps & {
  Icon: React.ReactNode;
  text: string;
  showText: boolean;
};

const ICON_SIZE = 24;
const GAP_SIZE = 8;

export function AnimateButton(props: AnimateButtonProps) {
  const { Icon, showText, text, ...rest } = props;
  const hiddenObserver = useResizeObserver<HTMLElement>();
  const frameObserver = useResizeObserver<HTMLElement>();

  const dimensionsRef = useRef({
    frame: 0,
    innerText: 0,
  });
  const dimensions = (() => {
    // once opened, we avoid updating it to prevent constant resize loop
    dimensionsRef.current = {
      frame: frameObserver.width || 0,
      innerText: hiddenObserver.width || 0,
    };
    return dimensionsRef.current;
  })();

  const xPad = showText ? 12 : 0;
  const width = showText ? ICON_SIZE + dimensions.innerText + xPad * 2 + GAP_SIZE : 48;

  return (
    <button
      type="button"
      className={cn(
        'h-12 rounded-[64px] flex items-center hover:bg-white/80 overflow-hidden',
        showText ? 'bg-white' : 'bg-white/60',
      )}
      style={{
        overflow: 'hidden',
        transition: 'width 0.2s ease-in-out',
        width,
        paddingLeft: xPad,
        paddingRight: xPad,
      }}
      {...rest}
    >
      <div className="w-full h-full flex items-center">
        <div className="m-auto flex items-center justify-center">{Icon}</div>
        <div
          className={cn('text-[#695682] text-sm font-bold overflow-hidden')}
          style={{
            transition: 'width 0.2s ease-in-out, max-width 0.2s ease-in-out',
            maxWidth: showText ? dimensions.innerText : 0,
            width: showText ? dimensions.innerText : 0,
            margin: showText ? 'auto' : 0,
            // this negative transform offsets for the shift it does due to being 0 width
            //   transform: showText ? undefined : `translateX(-8px)`,
            minWidth: showText ? dimensions.innerText : 0,
          }}
        >
          <div className="flex shrink-0 overflow-hidden min-w-min" ref={hiddenObserver.ref}>
            {text}
          </div>
        </div>
      </div>
    </button>
  );
}
