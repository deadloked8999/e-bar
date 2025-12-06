import React from 'react'

interface DigitALCLogoProps {
  className?: string
  withText?: boolean
}

export const DigitALCLogo: React.FC<DigitALCLogoProps> = ({ 
  className = "", 
  withText = true 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon: Barcode / Data Flow */}
      <svg 
        viewBox="0 0 50 50" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-10 h-10 text-cyan-400"
      >
        <rect x="5" y="10" width="5" height="30" rx="1" fill="currentColor"/>
        <rect x="15" y="15" width="5" height="25" rx="1" fill="currentColor" opacity="0.6"/>
        <rect x="25" y="5" width="5" height="35" rx="1" fill="#2563EB"/>
        <rect x="35" y="12" width="5" height="28" rx="1" fill="currentColor"/>
      </svg>
      
      {/* Text Wordmark */}
      {withText && (
        <span className="font-extrabold tracking-tighter text-white text-2xl leading-none">
          Digit<span className="text-cyan-400">ALC</span>
        </span>
      )}
    </div>
  )
}

