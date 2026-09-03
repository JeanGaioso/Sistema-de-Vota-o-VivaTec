/**
 * Utilitário de confetes em Canvas nativo para o Viva Tec.
 * Implementa os canhões laterais inferiores (esquerdo e direito) disparando em direção ao topo/centro
 * (onde fica o card do 1º colocado no pódio), com as cores oficiais:
 * Magenta Viva Tec (#E11D74, #FF2E93), Roxo (#701A75, #9D174D), Dourado/Ouro (#F59E0B, #FBBF24) e Branco (#FFFFFF).
 */

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  opacity: number
  wobble: number
  wobbleSpeed: number
  shape: 'rect' | 'circle' | 'star'
}

const BRAND_COLORS = [
  '#E11D74', // Magenta Viva Tec
  '#FF2E93', // Magenta claro
  '#701A75', // Roxo escuro
  '#9D174D', // Vinho/Roxo
  '#F59E0B', // Ouro / Campeão
  '#FBBF24', // Amarelo Dourado
  '#FFFFFF', // Branco destaque
  '#FCE7F3', // Rosa suave
]

let activeCanvas: HTMLCanvasElement | null = null
let animationFrameId: number | null = null

/**
 * Dispara confetes com canhões inferiores laterais apontados para o 1º colocado no centro/topo.
 * @param durationMs Duração total do efeito contínuo de canhões (padrão 4.5 segundos)
 */
export function firePodiumConfetti(durationMs: number = 4500) {
  if (typeof window === 'undefined') return

  // Se já houver um canvas ativo, reaproveita ou limpa
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (!activeCanvas || !activeCanvas.parentElement) {
    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.inset = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    canvas.style.zIndex = '99999'
    canvas.style.pointerEvents = 'none'
    document.body.appendChild(canvas)
    activeCanvas = canvas
  }

  const canvas = activeCanvas
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
  resize()

  const particles: ConfettiParticle[] = []
  const startTime = Date.now()
  const endTime = startTime + durationMs

  const spawnBurst = (isLeft: boolean, count: number = 24) => {
    const originX = isLeft ? window.innerWidth * 0.05 : window.innerWidth * 0.95
    const originY = window.innerHeight * 0.95

    // Mirar em direção ao topo/centro onde está o 1º colocado (x: 45%-55%, y: 15%-25%)
    const targetX = window.innerWidth * (0.42 + Math.random() * 0.16)
    const targetY = window.innerHeight * (0.15 + Math.random() * 0.18)

    const dx = targetX - originX
    const dy = targetY - originY
    const baseAngle = Math.atan2(dy, dx)

    for (let i = 0; i < count; i++) {
      // Pequeno espalhamento cônico de +- 18 graus
      const angle = baseAngle + (Math.random() - 0.5) * 0.45
      // Velocidade forte para subir bem até o topo
      const speed = (window.innerHeight / 50) * (0.85 + Math.random() * 0.4)

      const shapes: ('rect' | 'circle' | 'star')[] = ['rect', 'rect', 'circle', 'star']
      const shape = shapes[Math.floor(Math.random() * shapes.length)]

      particles.push({
        x: originX + (Math.random() - 0.5) * 30,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 7 + Math.random() * 8,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        opacity: 1,
        wobble: Math.random() * 10,
        wobbleSpeed: 0.08 + Math.random() * 0.08,
        shape,
      })
    }
  }

  // Disparo inicial robusto em ambos os lados
  spawnBurst(true, 45)
  spawnBurst(false, 45)

  let lastBurstTime = Date.now()
  const gravity = 0.32
  const drag = 0.985

  const frame = () => {
    const now = Date.now()
    const elapsed = now - startTime

    // Canhões disparam rajadas adicionais nos primeiros durationMs
    if (now < endTime) {
      if (now - lastBurstTime > 160) {
        lastBurstTime = now
        spawnBurst(true, 14)
        spawnBurst(false, 14)
      }
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]

      // Física
      p.vx *= drag
      p.vy *= drag
      p.vy += gravity
      p.x += p.vx + Math.sin(p.wobble) * 1.5
      p.y += p.vy
      p.wobble += p.wobbleSpeed
      p.rotation += p.rotationSpeed

      // Fade out progressivo quando cai muito ou após tempo
      if (elapsed > durationMs - 1000) {
        p.opacity -= 0.015
      }

      if (p.y > window.innerHeight + 50 || p.opacity <= 0) {
        particles.splice(i, 1)
        continue
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.fillStyle = p.color

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6)
      } else if (p.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Estrela de 4 pontas rápida
        ctx.beginPath()
        const s = p.size / 2
        ctx.moveTo(0, -s)
        ctx.lineTo(s * 0.3, -s * 0.3)
        ctx.lineTo(s, 0)
        ctx.lineTo(s * 0.3, s * 0.3)
        ctx.lineTo(0, s)
        ctx.lineTo(-s * 0.3, s * 0.3)
        ctx.lineTo(-s, 0)
        ctx.lineTo(-s * 0.3, -s * 0.3)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }

    if (particles.length > 0 || now < endTime) {
      animationFrameId = requestAnimationFrame(frame)
    } else {
      // Limpeza final do canvas
      if (activeCanvas && activeCanvas.parentElement) {
        activeCanvas.parentElement.removeChild(activeCanvas)
        activeCanvas = null
      }
      animationFrameId = null
    }
  }

  animationFrameId = requestAnimationFrame(frame)
}
