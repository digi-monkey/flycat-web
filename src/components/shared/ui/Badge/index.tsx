import { forwardRef } from 'react';
import { cn } from 'utils/classnames';

const Badge = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{ className?: string }>
>(({ className, children }, ref) => (
  <div ref={ref} className={cn('relative', className)}>
    {children}
  </div>
));
Badge.displayName = 'BadgeRoot';

const BadgeDot = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <span
      ref={ref}
      className={cn(
        'absolute top-0 -right-2 block h-1.5 w-1.5 rounded-full bg-primary-600 border-2 border-white',
        className,
      )}
    />
  ),
);
BadgeDot.displayName = 'BadgeDot';

export { Badge, BadgeDot };
