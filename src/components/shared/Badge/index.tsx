import { PropsWithChildren } from 'react';
import { cn } from 'utils/classnames';

export type BadgeProps = PropsWithChildren<{
  dot?: boolean;
  className?: string;
}>;

export function Badge(props: BadgeProps) {
  return (
    <div className={cn('relative', props.className)}>
      {props.children}
      {props.dot && (
        <span className="absolute top-0 -right-2 block h-1.5 w-1.5 rounded-full bg-primary-600 border-2 border-white" />
      )}
    </div>
  );
}
