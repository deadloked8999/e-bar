interface B2BarLogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export default function B2BarLogo({ size = 40, className = '', showText = true }: B2BarLogoProps) {
  const logoSize = size
  const textSize = size * 0.6
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo - стилизованная буква b со стрелкой из изображения */}
      <img
        src="/logo-icon.png"
        alt="B2Bar Logo"
        width={logoSize}
        height={logoSize}
        className="drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]"
        style={{
          filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.8))',
          objectFit: 'contain'
        }}
      />
      
      {/* Текст b2bar из изображения */}
      {showText && (
        <img
          src="/logo-text.png"
          alt="b2bar"
          height={textSize}
          className="drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))',
            objectFit: 'contain',
            height: `${textSize}px`,
            width: 'auto'
          }}
        />
      )}
    </div>
  )
}

