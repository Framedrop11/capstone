import React from 'react';

export const Select = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`input-minimal appearance-none bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';