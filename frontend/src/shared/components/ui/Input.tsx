import { forwardRef } from 'react';

import { cn } from '@shared/utils';
import type { InputProps } from '@shared/types';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = Boolean(error);

    return (
      <div className="input-wrapper">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required && <span className="input-required" aria-hidden="true">*</span>}
          </label>
        )}
        <div className={cn('input-container', hasError && 'input-container--error')}>
          {leftAddon && <span className="input-addon input-addon--left">{leftAddon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-field',
              leftAddon && 'input-field--has-left',
              rightAddon && 'input-field--has-right',
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightAddon && <span className="input-addon input-addon--right">{rightAddon}</span>}
        </div>
        {hasError && (
          <p id={`${inputId}-error`} className="input-error" role="alert">
            {error}
          </p>
        )}
        {!hasError && hint && (
          <p id={`${inputId}-hint`} className="input-hint">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
