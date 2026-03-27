import { cn } from '@shared/utils';
import type { SpinnerProps, SpinnerSize } from '@shared/types';

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'spinner-sm',
  md: 'spinner-md',
  lg: 'spinner-lg',
};

export const Spinner = ({ size = 'md', className, label = 'Loading...' }: SpinnerProps) => {
  return (
    <span role="status" aria-label={label} className={cn('spinner', sizeStyles[size], className)}>
      <span className="sr-only">{label}</span>
    </span>
  );
};
