import React from 'react';

export const Label = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={`block text-sm font-normal text-neutral-600 mb-1.5 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';