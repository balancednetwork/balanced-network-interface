import { cn } from '@/lib/utils';
import React from 'react';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'label' | 'body' | 'content' | 'span';

interface TypographyProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TypographyVariant;
}

export const Typography = React.forwardRef<HTMLSpanElement, TypographyProps>((props, ref) => {
  const { variant, className, ...rest } = props;

  const baseClasses = 'text-text'; // Assuming 'text-text' is a custom color class in your Tailwind config

  const variantClasses = {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-bold',
    h4: 'text-xl font-bold',
    p: 'text-base',
    label: 'text-sm',
    body: 'text-sm',
    content: 'text-xs',
    span: 'text-sm',
  };

  const _className = `${baseClasses} ${variantClasses[variant || 'p']}`;

  return <span ref={ref} className={cn(_className, className)} {...rest} />;
});
