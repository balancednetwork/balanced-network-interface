import React, { useState } from 'react';

import { ImageProps } from 'rebass';

import DefaultImg from '@/assets/images/default.png';

const BAD_SRCS: { [tokenAddress: string]: true } = {};

interface FallbackImageProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[];
}

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function FallbackImage({ srcs, alt, ...rest }: FallbackImageProps) {
  const [, refresh] = useState<number>(0);

  const src: string | undefined = srcs?.find(src => !BAD_SRCS[src]);

  if (src) {
    return (
      <img
        {...rest}
        alt={alt}
        src={src}
        onError={() => {
          if (src) BAD_SRCS[src] = true;
          refresh(i => i + 1);
        }}
      />
    );
  }

  return <img src={DefaultImg} alt="" {...rest} />;
}
