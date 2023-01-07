import React from 'react';

import { DialogOverlay, DialogContent } from '@reach/dialog';
import { transparentize } from 'polished';
import { isMobile } from 'react-device-detect';
import { animated, useTransition, useSpring } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import styled, { css } from 'styled-components';

import '@reach/dialog/styles.css';
import { MODAL_FADE_DURATION } from 'constants/index';

const AnimatedDialogOverlay = animated(DialogOverlay);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledDialogOverlay = styled(AnimatedDialogOverlay)`
  &[data-reach-dialog-overlay] {
    z-index: 6000;
    background-color: transparent;
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: ${({ theme }) => theme.colors.modalBG};
  }
`;

const AnimatedDialogContent = animated(DialogContent);
// destructure to not pass custom props to Dialog DOM element
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledDialogContent = styled(({ minHeight, maxHeight, maxWidth, mobile, isOpen, fullscreen, ...rest }) => (
  <AnimatedDialogContent {...rest} />
)).attrs({
  'aria-label': 'dialog',
})`
  overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};

  &[data-reach-dialog-content] {
    margin: 0 0 2rem 0;
    background-color: ${({ theme }) => theme.colors.bg4};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadow1)};
    padding: 0px;
    width: 85vw;
    overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};
    overflow-x: hidden;

    align-self: ${({ mobile }) => (mobile ? 'flex-end' : 'center')};

    ${({ maxWidth }) =>
      maxWidth &&
      css`
        max-width: ${maxWidth}px;
      `}
    ${({ maxHeight }) =>
      maxHeight &&
      css`
        max-height: ${maxHeight}vh;
      `}
    ${({ minHeight }) =>
      minHeight &&
      css`
        min-height: ${minHeight}vh;
      `}
    display: flex;
    border-radius: 10px;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    ${({ mobile }) =>
      mobile &&
      css`
        width: 100vw;
        border-radius: 20px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        margin: 0;
      `}

    ${({ theme, mobile }) => theme.mediaWidth.upSmall`
      width: 65vw;
      margin: 0;
    `}

    ${({ theme }) => theme.mediaWidth.upMedium`
      width: 50vw;
      margin: 0;
    `}

    ${({ theme, fullscreen }) =>
      fullscreen &&
      theme.mediaWidth.up360`
        width: calc(100vw - 40px);
        max-width: calc(100vw - 40px);
        height: calc(100vh - 180px);
        max-height: calc(100vh - 180px);
      `}

      ${({ theme, fullscreen }) =>
      fullscreen &&
      theme.mediaWidth.upMedium`
        width: calc(100vw - 80px);
        max-width: calc(100vw - 80px);
        height: calc(100vh - 80px);
        max-height: calc(100vh - 80px);
      `}
  }
`;

export interface ModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  minHeight?: number | false;
  maxHeight?: number;
  maxWidth?: number;
  initialFocusRef?: React.RefObject<any>;
  children?: React.ReactNode;
  className?: string;
  fullscreen?: boolean;
}

export default function Modal({
  isOpen,
  onDismiss,
  minHeight = false,
  maxHeight = 90,
  maxWidth = 420,
  initialFocusRef,
  children,
  className,
  fullscreen,
}: ModalProps) {
  const fadeTransition = useTransition(isOpen, null, {
    config: { duration: MODAL_FADE_DURATION },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  const [{ y }, set] = useSpring(() => ({ y: 0, config: { mass: 1, tension: 210, friction: 20 } }));
  const bind = useGesture({
    onDrag: state => {
      set({
        y: state.down ? state.movement[1] : 0,
      });
      if (state.movement[1] > 300 || (state.velocity > 3 && state.direction[1] > 0)) {
        onDismiss();
      }
    },
  });

  return (
    <>
      {fadeTransition.map(
        ({ item, key, props }) =>
          item && (
            <StyledDialogOverlay key={key} style={props} onDismiss={onDismiss} initialFocusRef={initialFocusRef}>
              <StyledDialogContent
                {...(isMobile
                  ? {
                      ...bind(),
                      style: { transform: y.interpolate((y: any) => `translateY(${y > 0 ? y : 0}px)`) },
                    }
                  : {})}
                aria-label="dialog content"
                minHeight={minHeight}
                maxHeight={maxHeight}
                maxWidth={maxWidth}
                mobile={isMobile}
                className={className}
                fullscreen={fullscreen}
              >
                {/* prevents the automatic focusing of inputs on mobile by the reach dialog */}
                {!initialFocusRef && isMobile ? <div tabIndex={1} /> : null}
                {children}
              </StyledDialogContent>
            </StyledDialogOverlay>
          ),
      )}
    </>
  );
}
