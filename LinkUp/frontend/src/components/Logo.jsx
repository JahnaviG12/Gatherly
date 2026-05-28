import React from 'react';

const Logo = ({ size = 40, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ minWidth: size, minHeight: size }}
    >
      {/* Left Person Head */}
      <circle cx="30" cy="25" r="12" fill="var(--accent-primary)" />
      
      {/* Right Person Head */}
      <circle cx="70" cy="25" r="12" fill="var(--text-secondary)" />
      
      {/* Infinity Path connecting them */}
      <path 
        d="M 30 45 
           C 5 45, 5 85, 30 85 
           C 55 85, 45 45, 70 45 
           C 95 45, 95 85, 70 85 
           C 45 85, 55 45, 30 45 Z" 
        stroke="url(#logoGradient)" 
        strokeWidth="14" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <defs>
        <linearGradient id="logoGradient" x1="5" y1="45" x2="95" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent-primary)" />
          <stop offset="1" stopColor="var(--text-secondary)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
