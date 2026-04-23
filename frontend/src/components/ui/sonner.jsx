import React from 'react';

export const Toaster = () => {
  return null; // Simplified - you can add actual toast implementation later
};

export const toast = {
  success: (message) => {
    console.log('✅', message);
    // You can replace with actual toast library later
    alert('✅ ' + message);
  },
  error: (message) => {
    console.error('❌', message);
    alert('❌ ' + message);
  },
  info: (message) => {
    console.log('ℹ️', message);
    alert('ℹ️ ' + message);
  },
  warning: (message) => {
    console.warn('⚠️', message);
    alert('⚠️ ' + message);
  }
};