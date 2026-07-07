import React from 'react';

interface UnDFLogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export function UnDFLogo({ className = "", showText = true, textColor = "text-undf-black" }: UnDFLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 160 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[12rem]"
      >
        {/* D1 (Left) */}
        <polygon points="40,0 80,40 40,80 0,40" fill="#2062AF" />
        
        {/* D2 (Middle) */}
        <polygon points="80,0 120,40 80,80 40,40" fill="#4495D1" />
        
        {/* D3 (Right) */}
        <polygon points="120,0 160,40 120,80 80,40" fill="#90CEF1" />
        
        {/* Intersection D1 & D2 */}
        <polygon points="60,20 80,40 60,60 40,40" fill="#27306E" />
        
        {/* Intersection D2 & D3 */}
        <polygon points="100,20 120,40 100,60 80,40" fill="#2062AF" />
      </svg>
      {showText && (
        <div className={`mt-2 text-center ${textColor}`}>
          <h1 className="text-4xl font-light tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <span className="font-medium">Un</span>DF
          </h1>
        </div>
      )}
    </div>
  );
}
