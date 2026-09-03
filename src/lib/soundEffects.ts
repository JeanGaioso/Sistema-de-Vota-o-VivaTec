/**
 * Módulo de síntese procedural de efeitos sonoros para o evento Viva Tec
 * Utiliza a Web Audio API pura, sem dependências externas nem arquivos de áudio baixados.
 *
 * Sons suportados:
 * 1. Drum Roll (rufar de tambores): cadência rítmica acelerando com tons graves e ruído de esteira filtrado.
 * 2. Fogos de Artifício (fireworks): silvo ascendente (whistle) seguido de explosão com ruído ressonante e reverb natural.
 * 3. Aplausos & Vibração (crowd cheer): camadas aleatórias de palmas filtradas, swell de entusiasmo e vibração do público.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false
  private activeDrumRollStop: (() => void) | null = null
  private masterGain: GainNode | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass()
      }
    }
    return this.ctx
  }

  /**
   * Tenta inicializar ou retomar o AudioContext após um gesto do usuário.
   * Retorna true se estiver 'running'.
   */
  public async unlockAudio(): Promise<boolean> {
    const ctx = this.getContext()
    if (!ctx) return false
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch (e) {
        console.warn('AudioContext resume falhou:', e)
      }
    }
    return ctx.state === 'running'
  }

  public isAudioRunning(): boolean {
    const ctx = this.getContext()
    return !!ctx && ctx.state === 'running'
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime)
    }
    if (muted) {
      this.stopDrumRoll()
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted
  }

  private getMasterGain(): GainNode | null {
    const ctx = this.getContext()
    if (!ctx) return null
    if (!this.masterGain) {
      this.masterGain = ctx.createGain()
      this.masterGain.gain.value = this.isMuted ? 0 : 1
      this.masterGain.connect(ctx.destination)
    }
    return this.masterGain
  }

  /**
   * Gera um buffer de ruído branco para envelopes de percussão e aplausos.
   */
  private createNoiseBuffer(durationSeconds: number): AudioBuffer | null {
    const ctx = this.getContext()
    if (!ctx) return null
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSeconds))
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  /**
   * Toca um único golpe de tambor/caixa (snare/tom hit)
   */
  private playDrumHit(time: number, intensity: number = 0.5) {
    const ctx = this.getContext()
    const master = this.getMasterGain()
    if (!ctx || !master || this.isMuted) return

    // 1. Corpo tonal do tambor (senóide descendente)
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    const hitDuration = 0.08

    osc.type = 'triangle'
    const startFreq = 140 + intensity * 60
    const endFreq = 65
    osc.frequency.setValueAtTime(startFreq, time)
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + hitDuration)

    const oscVol = Math.min(0.8, 0.15 + intensity * 0.45)
    oscGain.gain.setValueAtTime(oscVol, time)
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + hitDuration)

    osc.connect(oscGain)
    oscGain.connect(master)
    osc.start(time)
    osc.stop(time + hitDuration)

    // 2. Ruído da esteira da caixa (snare rattle)
    const noiseBuffer = this.createNoiseBuffer(0.06)
    if (noiseBuffer) {
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1600 + intensity * 800, time)
      filter.Q.setValueAtTime(2.5, time)

      const noiseGain = ctx.createGain()
      const noiseVol = Math.min(0.6, 0.08 + intensity * 0.3)
      noiseGain.gain.setValueAtTime(noiseVol, time)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(master)
      noise.start(time)
      noise.stop(time + 0.06)
    }
  }

  /**
   * Toca o rufar de tambores progressivo com duração determinada (ex: 10 segundos).
   * Começa num ritmo cadenciado e vai acelerando e crescendo em volume até o clímax.
   */
  public startDrumRoll(durationSeconds: number = 10): () => void {
    this.stopDrumRoll()
    const ctx = this.getContext()
    if (!ctx) return () => {}

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    let isCancelled = false
    const startTime = ctx.currentTime + 0.05
    const endTime = startTime + durationSeconds

    // Programar os pulsos de tambor ao longo da duração
    let scheduledTime = startTime
    let currentInterval = 0.18 // começa mais espaçado (~5.5 hits/seg)
    const minInterval = 0.035 // termina em rufar contínuo (~28 hits/seg)

    while (scheduledTime < endTime && !isCancelled) {
      const progress = (scheduledTime - startTime) / durationSeconds // 0 a 1
      const intensity = 0.25 + Math.pow(progress, 1.6) * 0.75 // curva de tensão exponencial

      this.playDrumHit(scheduledTime, intensity)

      // Próximo intervalo vai encurtando
      currentInterval = 0.18 - progress * (0.18 - minInterval)
      // Pequena variação humana natural
      const jitter = (Math.random() - 0.5) * 0.008
      scheduledTime += Math.max(minInterval, currentInterval + jitter)
    }

    const stop = () => {
      isCancelled = true
      this.activeDrumRollStop = null
    }

    this.activeDrumRollStop = stop

    // Desliga automaticamente após a duração
    setTimeout(
      () => {
        if (this.activeDrumRollStop === stop) {
          this.activeDrumRollStop = null
        }
      },
      durationSeconds * 1000 + 200,
    )

    return stop
  }

  public stopDrumRoll() {
    if (this.activeDrumRollStop) {
      this.activeDrumRollStop()
      this.activeDrumRollStop = null
    }
  }

  /**
   * Toca um único efeito de fogos de artifício (subida + detonação)
   */
  private playSingleFirework(time: number, pitchOffset: number = 0) {
    const ctx = this.getContext()
    const master = this.getMasterGain()
    if (!ctx || !master || this.isMuted) return

    // 1. Silvo ascendente (whistle da subida do morteiro)
    const whistle = ctx.createOscillator()
    const whistleGain = ctx.createGain()
    const whistleDuration = 0.45

    whistle.type = 'sawtooth'
    whistle.frequency.setValueAtTime(250 + pitchOffset, time)
    whistle.frequency.exponentialRampToValueAtTime(1400 + pitchOffset, time + whistleDuration)

    whistleGain.gain.setValueAtTime(0.01, time)
    whistleGain.gain.linearRampToValueAtTime(0.12, time + whistleDuration * 0.7)
    whistleGain.gain.exponentialRampToValueAtTime(0.001, time + whistleDuration)

    // Filtro para suavizar o dente de serra
    const whistleFilter = ctx.createBiquadFilter()
    whistleFilter.type = 'lowpass'
    whistleFilter.frequency.setValueAtTime(2000, time)

    whistle.connect(whistleFilter)
    whistleFilter.connect(whistleGain)
    whistleGain.connect(master)

    whistle.start(time)
    whistle.stop(time + whistleDuration)

    // 2. O Grande Estouro (boom + crackle)
    const burstTime = time + whistleDuration
    const noiseBuffer = this.createNoiseBuffer(1.4)
    if (noiseBuffer) {
      // Impacto grave (boom profundo)
      const boomOsc = ctx.createOscillator()
      const boomGain = ctx.createGain()
      boomOsc.type = 'sine'
      boomOsc.frequency.setValueAtTime(120 + (pitchOffset % 40), burstTime)
      boomOsc.frequency.exponentialRampToValueAtTime(30, burstTime + 0.5)

      boomGain.gain.setValueAtTime(0.7, burstTime)
      boomGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.6)

      boomOsc.connect(boomGain)
      boomGain.connect(master)
      boomOsc.start(burstTime)
      boomOsc.stop(burstTime + 0.6)

      // Ruído estilhaçado (crackle da explosão colorida)
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(900 + pitchOffset, burstTime)
      noiseFilter.Q.setValueAtTime(1.2, burstTime)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.65, burstTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 1.2)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(master)

      noise.start(burstTime)
      noise.stop(burstTime + 1.3)
    }
  }

  /**
   * Dispara sequência de fogos de artifício espalhados no tempo (2 a 3 segundos de espetáculo)
   */
  public playFireworksSequence() {
    const ctx = this.getContext()
    if (!ctx || this.isMuted) return

    const now = ctx.currentTime
    const delays = [0.0, 0.35, 0.75, 1.15, 1.5, 1.9, 2.3]
    const offsets = [0, 80, -50, 120, -30, 60, -90]

    delays.forEach((delay, idx) => {
      this.playSingleFirework(now + delay, offsets[idx % offsets.length])
    })
  }

  /**
   * Toca o som de aplausos e vibração da plateia (cheer).
   * Combina múltiplos pulsos aleatórios simulando dezenas de palmas com ruído ressonante
   * e um envelope swell de aplausos prolongados (~4 a 5 segundos).
   */
  public playApplauseAndCheer(durationSeconds: number = 6) {
    const ctx = this.getContext()
    const master = this.getMasterGain()
    if (!ctx || !master || this.isMuted) return

    const now = ctx.currentTime
    const cheerBuffer = this.createNoiseBuffer(durationSeconds)
    if (!cheerBuffer) return

    // 1. Camada de fundo contínua (estrada sonora de grito e entusiasmo da plateia)
    const crowdNoise = ctx.createBufferSource()
    crowdNoise.buffer = cheerBuffer

    const crowdFilter = ctx.createBiquadFilter()
    crowdFilter.type = 'bandpass'
    crowdFilter.frequency.setValueAtTime(900, now)
    crowdFilter.frequency.linearRampToValueAtTime(1400, now + 1.5) // aumento do entusiasmo
    crowdFilter.frequency.linearRampToValueAtTime(800, now + durationSeconds)
    crowdFilter.Q.setValueAtTime(1.8, now)

    const crowdGain = ctx.createGain()
    crowdGain.gain.setValueAtTime(0.01, now)
    crowdGain.gain.linearRampToValueAtTime(0.45, now + 0.8) // swell rápido
    crowdGain.gain.setValueAtTime(0.45, now + durationSeconds - 2)
    crowdGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds) // fade out suave

    crowdNoise.connect(crowdFilter)
    crowdFilter.connect(crowdGain)
    crowdGain.connect(master)

    crowdNoise.start(now)
    crowdNoise.stop(now + durationSeconds)

    // 2. Camada de palmas percussivas individuais (bursts rápidos)
    // Gerar palmas distribuídas aleatoriamente
    const clapCount = 55
    for (let i = 0; i < clapCount; i++) {
      const clapTime = now + 0.1 + Math.random() * (durationSeconds - 0.8)
      const clapBuffer = this.createNoiseBuffer(0.04)
      if (!clapBuffer) continue

      const clapNode = ctx.createBufferSource()
      clapNode.buffer = clapBuffer

      const clapFilter = ctx.createBiquadFilter()
      clapFilter.type = 'bandpass'
      clapFilter.frequency.setValueAtTime(1200 + Math.random() * 800, clapTime)
      clapFilter.Q.setValueAtTime(3.0, clapTime)

      const clapGain = ctx.createGain()
      const vol = 0.08 + Math.random() * 0.15
      clapGain.gain.setValueAtTime(vol, clapTime)
      clapGain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.04)

      clapNode.connect(clapFilter)
      clapFilter.connect(clapGain)
      clapGain.connect(master)

      clapNode.start(clapTime)
      clapNode.stop(clapTime + 0.05)
    }

    // 3. Efeito de vibração "Whooo!" com oscilador modulado
    const whooCount = 4
    for (let w = 0; w < whooCount; w++) {
      const whooTime = now + 0.4 + w * 0.9
      const whooOsc = ctx.createOscillator()
      const whooGain = ctx.createGain()
      const whooDuration = 0.8

      whooOsc.type = 'triangle'
      const baseFreq = 380 + Math.random() * 150
      whooOsc.frequency.setValueAtTime(baseFreq, whooTime)
      whooOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, whooTime + 0.3)
      whooOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, whooTime + whooDuration)

      whooGain.gain.setValueAtTime(0.001, whooTime)
      whooGain.gain.linearRampToValueAtTime(0.07, whooTime + 0.2)
      whooGain.gain.exponentialRampToValueAtTime(0.001, whooTime + whooDuration)

      whooOsc.connect(whooGain)
      whooGain.connect(master)

      whooOsc.start(whooTime)
      whooOsc.stop(whooTime + whooDuration)
    }
  }

  /**
   * Toca o conjunto comemorativo final: fogos + aplausos/vibração
   */
  public playCelebrationSound() {
    this.stopDrumRoll()
    this.playFireworksSequence()
    this.playApplauseAndCheer(6.5)
  }
}

export const soundManager = new SoundEffectsManager()
export default soundManager
