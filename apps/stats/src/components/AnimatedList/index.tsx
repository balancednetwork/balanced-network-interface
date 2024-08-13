import React, { useState, useEffect, useLayoutEffect } from 'react';

import usePrevious from '@/hooks/usePrevious';

const calculateBoundingBoxes = children => {
  const boundingBoxes = {};

  React.Children.forEach(children, child => {
    const domNode = child.ref.current;
    const nodeBoundingBox = domNode.getBoundingClientRect();

    boundingBoxes[child.key] = nodeBoundingBox;
  });

  return boundingBoxes;
};

const getShouldAnimate = (layoutA, layoutB): boolean => {
  let isLayoutChanged = false;

  if (!layoutA.length || !layoutB.length || layoutA.length !== layoutB.length) {
    return false;
  }

  layoutA.map((key, index) => {
    if (key !== layoutB[index]) {
      isLayoutChanged = true;
    }
    return key;
  });

  return isLayoutChanged;
};

const AnimateList = ({ children }) => {
  const [boundingBox, setBoundingBox] = useState({});
  const [prevBoundingBox, setPrevBoundingBox] = useState({});
  const prevChildren = usePrevious(children);
  const shouldAnimate = getShouldAnimate(Object.keys(boundingBox), Object.keys(prevBoundingBox));

  useLayoutEffect(() => {
    const newBoundingBox = calculateBoundingBoxes(children);
    setBoundingBox(newBoundingBox);
  }, [children]);

  useLayoutEffect(() => {
    const prevBoundingBox = calculateBoundingBoxes(prevChildren);
    setPrevBoundingBox(prevBoundingBox);
  }, [prevChildren]);

  useEffect(() => {
    const hasPrevBoundingBox = Object.keys(prevBoundingBox).length;

    if (shouldAnimate && hasPrevBoundingBox) {
      React.Children.forEach(children, child => {
        const domNode = child.ref.current;
        const firstBox = prevBoundingBox[child.key];
        const lastBox = boundingBox[child.key];
        const changeInY = firstBox.top - lastBox.top;

        if (changeInY) {
          requestAnimationFrame(() => {
            // Before the DOM paints, invert child to old position
            domNode.style.transform = `translate3d(0, ${changeInY}px, 0)`;
            domNode.style.transition = 'transform 0s';

            requestAnimationFrame(() => {
              // After the previous frame, remove
              // the transistion to play the animation
              domNode.style.transform = `translate3d(0, 0, 0)`;
              domNode.style.transition = 'transform 500ms';
            });
          });
        }
      });
    }
  }, [boundingBox, prevBoundingBox, children, shouldAnimate]);

  return children;
};

export default AnimateList;
