// ─────────────────────────────────────────────────────────
// SankalpHub — Founder Console Exclusive Sound
// "Still pond ripple" — peaceful, meditative, unique to super_admin
// Never play this for regular users
// ─────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playFounderRipple(): void {
  try {
    const ctx = getAudioContext()

    // Three ripples — G4, C5, E5
    // Each fades in gently then decays like a water ripple
    const ripples: [number, number, number][] = [
      [392, 0,   1.2],
      [523, 0.3, 1.0],
      [659, 0.6, 0.8],
    ]

    ripples.forEach(([freq, startTime, duration]) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type            = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0.0,  ctx.currentTime + startTime)
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + startTime + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)

      osc.start(ctx.currentTime + startTime)
      osc.stop(ctx.currentTime  + startTime + duration)
    })
  } catch (err) {
    console.warn('[FounderSound] Ripple playback failed:', err)
  }
}
