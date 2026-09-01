import React from 'react'

interface VivaTecLogoProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  inverted?: boolean
}

/**
 * Logotipo oficial Viva Tec:
 * Ícone em formato de "V" estilizado com linhas duplas,
 * acompanhado da tipografia "VIVA TEC" em caixa alta, negrito e cor preta (#1A1A1A / branca se invertido).
 */
export function VivaTecLogo({
  className = '',
  iconSize = 'md',
  showTagline = false,
  inverted = false,
}: VivaTecLogoProps) {
  const sizeMap = {
    sm: { box: 'w-8 h-8', vWidth: 20, vHeight: 20, text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', vWidth: 26, vHeight: 26, text: 'text-xl', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', vWidth: 32, vHeight: 32, text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-16 h-16', vWidth: 42, vHeight: 42, text: 'text-3xl', sub: 'text-sm' },
  }

  const s = sizeMap[iconSize]

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Ícone V estilizado com linhas duplas */}
      <div
        className={`${s.box} rounded-2xl bg-gradient-to-br from-[#E11D74] to-[#BE185D] p-1.5 flex items-center justify-center shadow-md flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Linha externa do V */}
          <path
            d="M5 8L16 26L27 8"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Linha interna do V (linhas duplas estilizadas) */}
          <path
            d="M10 9L16 20L22 9"
            stroke="#FFE4F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Tipografia VIVA TEC */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${s.text} ${
              inverted ? 'text-white' : 'text-[#1A1A1A]'
            }`}
          >
            VIVA <span className="text-[#E11D74]">TEC</span>
          </span>
        </div>
        {showTagline && (
          <span
            className={`font-semibold tracking-wide uppercase mt-0.5 ${s.sub} ${
              inverted ? 'text-pink-200' : 'text-[#E11D74]'
            }`}
          >
            Próxima parada: Ensino Médio
          </span>
        )}
      </div>
    </div>
  )
}
