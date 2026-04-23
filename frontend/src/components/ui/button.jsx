import React from 'react';

export const Button = React.forwardRef(({ 
  className = '', 
  variant = 'default',
  children, 
  ...props 
}, ref) => {
  const variants = {
    default: "btn-minimal",
    secondary: "btn-minimal-secondary",
    ghost: "btn-minimal-ghost",
  };
  
  return (
    <button
      ref={ref}
      className={`${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';