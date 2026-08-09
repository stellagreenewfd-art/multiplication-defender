// ============ 简易 WebAudio 音效 ============
let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}
export function isMuted() {
  return muted
}

function ac(): AudioContext | null {
  if (muted) return null
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.08) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(vol, c.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start(c.currentTime + start)
  o.stop(c.currentTime + start + dur)
}

export type SoundName = 'correct' | 'wrong' | 'shoot' | 'die' | 'wave' | 'click' | 'gameover' | 'graduate'

export function playSound(name: SoundName) {
  switch (name) {
    case 'correct': // 欢快上行
      tone(523, 0, 0.12, 'square')
      tone(659, 0.09, 0.12, 'square')
      tone(784, 0.18, 0.2, 'square')
      break
    case 'wrong': // 低沉错误音
      tone(196, 0, 0.2, 'sawtooth', 0.06)
      tone(147, 0.12, 0.3, 'sawtooth', 0.06)
      break
    case 'shoot': // 豌豆发射
      tone(880, 0, 0.06, 'square', 0.05)
      tone(1320, 0.04, 0.08, 'square', 0.04)
      break
    case 'die': // 僵尸倒下
      tone(330, 0, 0.1, 'triangle', 0.09)
      tone(220, 0.08, 0.15, 'triangle', 0.09)
      tone(110, 0.18, 0.25, 'triangle', 0.09)
      break
    case 'wave': // 过关号角
      tone(523, 0, 0.15, 'square')
      tone(523, 0.15, 0.15, 'square')
      tone(659, 0.3, 0.15, 'square')
      tone(784, 0.45, 0.35, 'square')
      break
    case 'gameover':
      tone(392, 0, 0.25, 'sawtooth', 0.06)
      tone(330, 0.22, 0.25, 'sawtooth', 0.06)
      tone(262, 0.44, 0.5, 'sawtooth', 0.06)
      break
    case 'graduate': // 错题毕业
      tone(659, 0, 0.1, 'square')
      tone(784, 0.08, 0.1, 'square')
      tone(1047, 0.16, 0.25, 'square')
      break
    case 'click':
      tone(660, 0, 0.05, 'square', 0.04)
      break
  }
}
