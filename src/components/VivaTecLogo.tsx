import officialLogoImg from '@/assets/logo-viva-tec-v-cfca4.png'

interface VivaTecLogoProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  inverted?: boolean
  onlyIcon?: boolean
}

/**
 * Logotipo oficial Viva Tec:
 * Ícone oficial com a imagem fornecida pelo usuário (V estilizado em gradiente magenta/roxo),
 * acompanhado da tipografia "VIVA TEC" em caixa alta e da tagline "Próxima parada: Ensino Médio".
 */
export function VivaTecLogo({
  className = '',
  iconSize = 'md',
  showTagline = false,
  inverted = false,
  onlyIcon = false,
}: VivaTecLogoProps) {
  const sizeMap = {
    sm: {
      box: 'w-8 h-8 min-w-[2rem]',
      imgClass: 'w-6 h-6',
      text: 'text-base',
      sub: 'text-[9px]',
    },
    md: {
      box: 'w-10 h-10 min-w-[2.5rem]',
      imgClass: 'w-8 h-8',
      text: 'text-xl',
      sub: 'text-[10px]',
    },
    lg: {
      box: 'w-12 h-12 min-w-[3rem]',
      imgClass: 'w-10 h-10',
      text: 'text-2xl',
      sub: 'text-xs',
    },
    xl: {
      box: 'w-16 h-16 min-w-[4rem]',
      imgClass: 'w-13 h-13',
      text: 'text-3xl',
      sub: 'text-sm',
    },
  }

  const s = sizeMap[iconSize]

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Imagem do logotipo oficial Viva Tec com moldura elegante em degradê magenta/roxo */}
      <div
        className={`${s.box} rounded-2xl p-[2px] bg-gradient-to-br from-[#701A75] via-[#A21CAF] to-[#E11D74] shadow-sm flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform`}
      >
        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
          <img
            src={officialLogoImg}
            alt="Logotipo Viva Tec"
            className={`${s.imgClass} object-contain`}
            loading="eager"
          />
        </div>
      </div>

      {/* Tipografia VIVA TEC e Tagline */}
      {!onlyIcon && (
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
      )}
    </div>
  )
}
