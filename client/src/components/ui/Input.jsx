import { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, error, icon: Icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-surface-200/80">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40 text-lg" />
          )}
          <input
            ref={ref}
            className={`w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm transition-all duration-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 focus:bg-surface-800 ${
              Icon ? 'pl-10' : ''
            } ${error ? 'border-danger/50' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
