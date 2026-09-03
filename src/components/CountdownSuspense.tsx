import { useState, useEffect, useRef } from 'react'
import { soundManager } from '@/lib/soundEffects'
import { VivaTecLogo } from '@/components/VivaTecLogo'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react'

interface CountdownSuspenseProps {
  onComplete: () => void
  onMuteToggle?: (muted: boolean) => void
}

export function CountdownSuspense({ onComplete, onMuteToggle }: CountdownSuspenseProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(10)
  const [isAudioActive, setIsAudioActive] = useState<boolean>(() => soundManager.isAudioRunning())
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getIsMuted())
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Inicializar o rufar dos tambores e a contagem
  useEffect(() => {
    // Tenta destravar áudio automaticamente se o contexto já estiver disponível
    soundManager.unlockAudio().then((active) => {
      setIsAudioActive(active)
      if (active && !soundManager.getIsMuted()) {
        soundManager.startDrumRoll(10)
      }
    })

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Rufar finalizado, agora é hora do pódio
          soundManager.stopDrumRoll()
          setTimeout(() => {
            onCompleteRef.current()
          }, 350)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(interval)
      soundManager.stopDrumRoll()
    }
  }, [])

  const handleEnableAudio = async () => {
    const success = await soundManager.unlockAudio()
    setIsAudioActive(success)
    if (success && !isMuted) {
      soundManager.startDrumRoll(Math.max(1, secondsLeft))
    }
  }

  const handleToggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    soundManager.setMuted(nextMuted)
    if (onMuteToggle) {
      onMuteToggle(nextMuted)
    }
    if (!nextMuted && isAudioActive && secondsLeft > 0) {
      soundManager.startDrumRoll(secondsLeft)
    }
  }

  // Título dinâmico de suspense a cada faixa de segundos
  const getSuspenseText = (sec: number) => {
    if (sec > 7) return 'A comissão Senac & Sesc homologou o resultado...'
    if (sec > 4) return 'Consolidando as notas e pareceres da banca...'
    if (sec > 2) return 'Atenção aos telões do ginásio...'
    if (sec === 2) return 'Quem será o grande campeão?!'
    if (sec === 1) return 'É AGORA!'
    return 'REVELANDO O PÓDIO!'
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0D0510] via-[#1A0A1F] to-[#2B0E2B] text-white overflow-hidden p-6 select-none animate-in fade-in duration-500">
      {/* Background dramático: partículas de luz e anéis pulsantes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glow central vibrante */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#E11D74]/25 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#701A75]/35 blur-[80px]" />
        {/* Grid sutil */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E11D74_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Topo: Logo Viva Tec + Tagline + Botão de Mute/Ativar Som */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <VivaTecLogo iconSize="md" showTagline={false} onlyIcon={true} />
          <div>
            <span className="text-xs uppercase tracking-widest text-[#E11D74] font-black block">
              Festival de Heróis Fictícios
            </span>
            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
              Viva Tec • Próxima parada: Ensino Médio
            </span>
          </div>
        </div>

        {/* Controles de Som */}
        <div className="flex items-center gap-2">
          {!isAudioActive && (
            <Button
              onClick={handleEnableAudio}
              variant="outline"
              size="sm"
              className="bg-[#E11D74] hover:bg-[#C2185B] text-white border-none rounded-full px-4 h-9 font-bold text-xs shadow-lg shadow-pink-500/25 animate-bounce"
            >
              <Volume2 className="w-4 h-4 mr-1.5" />
              Ativar som do anúncio 🔊
            </Button>
          )}

          <Button
            onClick={handleToggleMute}
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-300 hover:text-white hover:bg-white/10 w-9 h-9"
            title={isMuted ? 'Desmutar som' : 'Mutar som'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-pink-300" />
            )}
          </Button>
        </div>
      </div>

      {/* Centro: O Grande Contador de 10 Segundos */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        {/* Badge superior dramática */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E11D74]/20 border border-[#E11D74]/50 text-pink-300 text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg">
          <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
          <span>Momento Decisivo Viva Tec</span>
          <Trophy className="w-4 h-4 text-amber-300" />
        </div>

        {/* Número da contagem regressiva com animação keyframe por segundo */}
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80">
          {/* Anéis decorativos pulsantes em rotação */}
          <div
            className="absolute inset-0 rounded-full border-4 border-dashed border-[#E11D74]/30 animate-spin"
            style={{ animationDuration: '14s' }}
          />
          <div
            className="absolute inset-4 rounded-full border-2 border-[#701A75]/50 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-[#E11D74]/20 to-[#701A75]/20 backdrop-blur-sm border border-white/10" />

          {/* O número em si com key dinâmico para reiniciar a animação de pulso/escala a cada segundo */}
          <div
            key={secondsLeft}
            className="relative z-10 flex flex-col items-center justify-center"
            style={{
              animation: 'countdown-scale-pulse 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <span
              className="text-8xl sm:text-9xl md:text-[140px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-100 to-[#E11D74] drop-shadow-[0_10px_35px_rgba(225,29,116,0.6)]"
              style={{
                textShadow: '0 0 40px rgba(225, 29, 116, 0.6), 0 0 80px rgba(112, 26, 117, 0.4)',
              }}
            >
              {secondsLeft}
            </span>
            <span className="text-xs sm:text-sm font-extrabold tracking-[0.3em] uppercase text-pink-300/80 -mt-2">
              {secondsLeft === 1 ? 'SEGUNDO' : 'SEGUNDOS'}
            </span>
          </div>
        </div>

        {/* Texto de suspense */}
        <div className="mt-8 space-y-2 max-w-lg px-4 min-h-[4rem] flex flex-col items-center justify-center">
          <p
            key={`txt-${secondsLeft}`}
            className="text-lg sm:text-2xl font-black text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {getSuspenseText(secondsLeft)}
          </p>
          <p className="text-xs sm:text-sm text-pink-200/70 font-medium">
            Rufem os tambores... O pódio dos heróis será anunciado a seguir!
          </p>
        </div>
      </div>

      {/* Rodapé: Barra de progresso dos 10 segundos + aviso */}
      <div className="relative z-10 w-full max-w-xl pb-4 flex flex-col items-center gap-3">
        {/* Barra de progresso decrescente */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#701A75] via-[#E11D74] to-pink-300 transition-all duration-1000 ease-linear rounded-full shadow-[0_0_12px_rgba(225,29,116,0.8)]"
            style={{ width: `${(secondsLeft / 10) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[11px] text-slate-400 font-bold px-1">
          <span>APURAÇÃO OFICIAL</span>
          <span className="text-[#E11D74] animate-pulse">● TRANSMISSÃO AO VIVO</span>
          <span>VIVA TEC 2026</span>
        </div>
      </div>

      {/* Estilo local para o pulso de escala a cada segundo */}
      <style>{`
        @keyframes countdown-scale-pulse {
          0% {
            transform: scale(1.45);
            opacity: 0.3;
            filter: blur(4px);
          }
          40% {
            transform: scale(0.95);
            opacity: 1;
            filter: blur(0);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
export default CountdownSuspense
