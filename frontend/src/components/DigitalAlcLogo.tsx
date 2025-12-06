import clsx from 'clsx'

interface DigitalAlcLogoProps {
  size?: number
  className?: string
}

export default function DigitalAlcLogo({ size = 48, className }: DigitalAlcLogoProps) {
  // Размер шрифта
  const fontSize = size * 0.6
  // Небольшой отступ сверху и снизу для строчных букв (особенно g)
  const verticalPadding = size * 0.08
  // Высота контейнера = размер шрифта + отступы сверху и снизу
  const height = fontSize + verticalPadding * 2
  const width = size * 3.5
  const borderRadius = size * 0.15
  const borderWidth = 2

  return (
    <div
      className={clsx('flex items-center justify-center', className)}
      style={{
        width: `${width}px`,
        height: `${height + borderWidth * 2}px`, // Добавляем высоту border сверху и снизу
      }}
    >
      <div
        className="flex items-center justify-center border-2 border-cyan-400"
        style={{
          width: `${width}px`,
          height: `${height}px`, // Высота без учета border
          borderRadius: `${borderRadius}px`,
          padding: `${verticalPadding}px ${size * 0.25}px`, // Небольшой вертикальный padding для строчных букв
          background: 'transparent', // Прозрачный фон - виден фон страницы
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <span
          className="text-white font-bold"
          style={{
            fontFamily: '"Agency FB", "AgencyFB", sans-serif',
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize}px`, // Высота строки = размеру шрифта
            letterSpacing: '0.08em',
            display: 'inline-block',
            verticalAlign: 'middle',
            margin: '0',
            padding: '0',
            overflow: 'visible',
          }}
        >
          DigitALC
        </span>
      </div>
    </div>
  )
}

