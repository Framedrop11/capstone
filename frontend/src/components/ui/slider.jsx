import React, { useState, useEffect } from 'react';

export const Slider = React.forwardRef(({ 
  className = '', 
  min = 0, 
  max = 100, 
  step = 1,
  value = min,
  onValueChange,
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = useState(value);
  
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };
  
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={internalValue}
      onChange={handleChange}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Slider.displayName = 'Slider';