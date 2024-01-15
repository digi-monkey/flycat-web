import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from 'utils/classnames';

const inputVariants = cva(
  'flex w-full border-solid border border-border-01 hover:border-border-primary focus:border-border-primary bg-input-01 body text-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-placeholder focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-input-disabled disabled:cursor-not-allowed box-border',
  {
    variants: {
      size: {
        default: 'rounded h-8 px-3 py-1',
        large: 'rounded-md h-10 px-3 py-2',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export interface InputProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, ...props }, ref) => {
    return (
      // @ts-ignore
      <input
        type={type}
        className={cn(inputVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
