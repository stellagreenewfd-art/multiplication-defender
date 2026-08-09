import { useCallback, useEffect, useRef, useState } from 'react'
import NumberPad from '@/components/game/NumberPad'
import {
  ZOMBIE_SKINS,
  loadStats,
  randomFact,
  recordMastery,
  recordWrong,
  saveStats,
} from '@/game/logic'
import { playSound } from '@/game/sound'

const LANES = 5
const ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9]
const PLANT_BY_WAVE = ['🌱', '🌿', '🌵', '🌻', '🥜']

interface Zombie {
  id: number
  lane: number
  x: number // 0-100，百分位，越小越靠近房子
  a: number
  b: number
  speed: number // %/秒
  skin: string
  dying?: boolean
}

interface Floater {
  id: number
  lane: number
  x: number
  text: string
  color: string
}

interface Pea {
  id: number
  lane: number
  fromX: number
  toX: number
}

type Phase = 'setup' | 'playing' | 'waveClear' | 'gameover' | 'victory'

const WAVES = [
  { count: 6, speed: 2.6, interval: 3400 },
  { count: 8, speed: 3.1, interval: 3000 },
  { count: 10, speed: 3.6, interval: 2600 },
  { count: 12, speed: 4.2, interval: 2200 },
  { count: 14, speed: 4.8, interval: 1900 },
]

let uid = 1

export default function DefenseGame() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [tables, setTables] = useState<number[]>(ALL_TABLES)
  const [wave, setWave] = useState(0)
  const [zombies, setZombies] = useState<Zombie[]>([])
  const [mowers, setMowers] = useState<boolean[]>(Array(LANES).fill(true))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [kills, setKills] = useState(0)
  const [spawned, setSpawned] = useState(0)
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [peas, setPeas] = useState<Pea[]>([])
  const [shake, setShake] = useState(false)
  const [mowerRun, setMowerRun] = useState<number | null>(null)

  const zombiesRef = useRef(zombies)
  zombiesRef.current = zombies
  const inputRef = useRef(input)
  inputRef.current = input
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const spawnedRef = useRef(spawned)
  spawnedRef.current = spawned
  const waveRef = useRef(wave)
  waveRef.current = wave
  const nextSpawnAt = useRef(0)
  const mowerLanes = useRef(mowers)
  mowerLanes.current = mowers
  const tablesRef = useRef(tables)
  tablesRef.current = tables
  const comboRef = useRef(combo)
  comboRef.current = combo

  const addFloater = (lane: number, x: number, text: string, color: string) => {
    const id = uid++
    setFloaters((f) => [...f, { id, lane, x, text, color }])
    setTimeout(() => setFloaters((f) => f.filter((t) => t.id !== id)), 1100)
  }

  const startGame = () => {
    playSound('wave')
    setWave(0)
    setZombies([])
    setMowers(Array(LANES).fill(true))
    setSelectedId(null)
    setInput('')
    setScore(0)
    setCombo(0)
    setKills(0)
    setSpawned(0)
    nextSpawnAt.current = performance.now() + 1200
    setPhase('playing')
    const s = loadStats()
    saveStats({ gamesPlayed: s.gamesPlayed + 1 })
  }

  const startWave = (w: number) => {
    playSound('wave')
    setWave(w)
    setSpawned(0)
    setZombies([])
    nextSpawnAt.current = performance.now() + 1500
    setPhase('playing')
  }

  // ---------- 游戏主循环 ----------
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const w = waveRef.current
      const conf = WAVES[w]

      // 以 ref 为唯一数据源，本帧内先生成、再移动，最后一次性提交
      const list: Zombie[] = [...zombiesRef.current]

      // 生成僵尸
      if (spawnedRef.current < conf.count && now >= nextSpawnAt.current) {
        const usedLanes = list.map((z) => z.lane)
        const free = Array.from({ length: LANES }, (_, i) => i).filter(
          (l) => !usedLanes.includes(l) || Math.random() < 0.3
        )
        const lane = free[Math.floor(Math.random() * free.length)]
        const f = randomFact(tablesRef.current)
        const jitter = 0.85 + Math.random() * 0.3
        list.push({
          id: uid++,
          lane,
          x: 104,
          a: f.a,
          b: f.b,
          speed: conf.speed * jitter,
          skin: ZOMBIE_SKINS[Math.floor(Math.random() * ZOMBIE_SKINS.length)],
        })
        setSpawned((s) => s + 1)
        nextSpawnAt.current = now + conf.interval * (0.7 + Math.random() * 0.6)
      }

      // 移动 + 触发小推车
      let mowerLane = -1
      let gameOver = false
      const moved: Zombie[] = []
      for (const z of list) {
        if (z.dying) {
          moved.push(z)
          continue
        }
        const nx = z.x - z.speed * dt
        if (nx <= 5) {
          if (mowerLanes.current[z.lane]) mowerLane = z.lane
          else gameOver = true
          break
        }
        moved.push({ ...z, x: nx })
      }

      let next: Zombie[]
      if (gameOver) {
        next = moved
        setPhase('gameover')
        phaseRef.current = 'gameover'
        playSound('gameover')
      } else if (mowerLane >= 0) {
        // 小推车出动！碾平这一行所有僵尸
        const killCount = list.filter((z) => z.lane === mowerLane && !z.dying).length
        next = moved.filter((z) => z.lane !== mowerLane)
        setMowers((m) => m.map((v, i) => (i === mowerLane ? false : v)))
        setMowerRun(mowerLane)
        playSound('die')
        setTimeout(() => setMowerRun(null), 900)
        setKills((k) => k + killCount)
        addFloater(mowerLane, 50, '💥 小推车出击！', '#f97316')
      } else {
        next = moved
      }
      zombiesRef.current = next
      setZombies(next)

      // 过关判定
      if (
        spawnedRef.current >= conf.count &&
        zombiesRef.current.length === 0 &&
        phaseRef.current === 'playing'
      ) {
        if (waveRef.current >= WAVES.length - 1) {
          setPhase('victory')
          phaseRef.current = 'victory'
          playSound('wave')
        } else {
          setPhase('waveClear')
          phaseRef.current = 'waveClear'
          playSound('wave')
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // ---------- 提交答案 ----------
  const submit = useCallback(() => {
    const val = parseInt(inputRef.current, 10)
    if (Number.isNaN(val)) return
    const zs = zombiesRef.current.filter((z) => !z.dying)
    if (zs.length === 0) {
      setInput('')
      return
    }
    // 目标：选中的，或最靠左（最危险）的
    const target =
      zs.find((z) => z.id === selectedRef.current) ??
      zs.reduce((m, z) => (z.x < m.x ? z : m), zs[0])

    if (val === target.a * target.b) {
      // 答对！发射豌豆
      playSound('shoot')
      const peaId = uid++
      setPeas((p) => [...p, { id: peaId, lane: target.lane, fromX: 9, toX: target.x }])
      setTimeout(() => {
        setPeas((p) => p.filter((x) => x.id !== peaId))
        playSound('die')
        setZombies((cur) => {
          const remain = cur.filter((z) => z.id !== target.id)
          zombiesRef.current = remain
          return remain
        })
        const newCombo = comboRef.current + 1
        setCombo(newCombo)
        const gained = newCombo >= 5 ? 20 : 10
        setScore((s) => {
          const ns = s + gained
          const st = loadStats()
          saveStats({ totalScore: st.totalScore + gained, bestCombo: Math.max(st.bestCombo, newCombo) })
          return ns
        })
        setKills((k) => k + 1)
        recordMastery(target.a, target.b)
        addFloater(target.lane, target.x, newCombo >= 5 ? `+${gained} 🔥${newCombo}连击!` : `+${gained}`, '#22c55e')
      }, 420)
      setSelectedId(null)
    } else {
      // 答错：僵尸加速前进
      playSound('wrong')
      recordWrong(target.a, target.b)
      setCombo(0)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setZombies((cur) => cur.map((z) => (z.id === target.id ? { ...z, x: z.x - 6 } : z)))
      addFloater(target.lane, target.x, '😈 答错了，僵尸加速！', '#ef4444')
    }
    setInput('')
  }, [])

  // ---------- 键盘 ----------
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setInput((v) => (v.length >= 2 ? v : v === '0' ? e.key : v + e.key))
      } else if (e.key === 'Backspace') {
        setInput((v) => v.slice(0, -1))
      } else if (e.key === 'Enter') {
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, submit])

  // ---------- 设置界面 ----------
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pb-10">
        <div className="bg-amber-50 rounded-3xl border-8 border-amber-700/50 p-6 max-w-2xl w-full shadow-xl">
          <h3 className="text-2xl font-black text-green-900 text-center mb-2">🧟 僵尸来袭，用乘法保卫草坪！</h3>
          <p className="text-green-800 font-bold text-center mb-4">
            僵尸举着乘法算式从右边进攻 👉 算出答案，豌豆射手就会发射豌豆打败它！
            <br />
            答错僵尸会加速冲过来，别让它们走进房子 🏡（每行有 1 辆小推车救急）
          </p>
          <div className="text-center font-black text-amber-900 mb-2">选择练习范围（可多选）：</div>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {ALL_TABLES.map((t) => {
              const on = tables.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => {
                    playSound('click')
                    setTables((cur) => {
                      const next = on ? cur.filter((x) => x !== t) : [...cur, t].sort()
                      return next.length === 0 ? cur : next
                    })
                  }}
                  className={`rounded-full px-4 py-2 font-black border-4 transition-all ${
                    on
                      ? 'bg-green-600 text-white border-green-800'
                      : 'bg-white text-green-800 border-green-300'
                  }`}
                >
                  {t} 的乘法
                </button>
              )
            })}
          </div>
          <div className="text-center">
            <button
              onClick={startGame}
              className="rounded-3xl bg-gradient-to-b from-orange-400 to-red-500 text-white text-2xl font-black px-12 py-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none hover:scale-105 transition-transform"
            >
              🌻 开始防守（共 5 波）
            </button>
          </div>
        </div>
      </div>
    )
  }

  const conf = WAVES[wave]

  return (
    <div className="flex flex-col items-center gap-3 px-3 pb-8 select-none">
      {/* 状态栏 */}
      <div className="flex flex-wrap justify-center gap-3 font-black text-green-950">
        <span className="bg-yellow-300 rounded-full px-4 py-1 border-2 border-yellow-500">☀️ 阳光 {score}</span>
        <span className={`rounded-full px-4 py-1 border-2 ${combo >= 5 ? 'bg-red-500 text-white border-red-700 animate-pulse' : 'bg-white border-orange-300'}`}>
          🔥 连击 {combo}
        </span>
        <span className="bg-lime-200 rounded-full px-4 py-1 border-2 border-lime-500">
          🌊 第 {wave + 1}/5 波 · 还剩 {conf.count - spawned + zombies.filter((z) => !z.dying).length} 只
        </span>
        <span className="bg-white rounded-full px-4 py-1 border-2 border-green-300">🧟 击败 {kills}</span>
      </div>

      {/* 草坪战场 */}
      <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden border-8 border-amber-800/60 shadow-2xl">
        {/* 天空 */}
        <div className="h-10 bg-gradient-to-b from-sky-300 to-sky-200 flex items-center px-4 gap-2">
          <span className="text-2xl animate-spin-slow">☀️</span>
          <span className="font-black text-sky-900 text-sm">乘法草坪 · 第 {wave + 1} 波</span>
        </div>
        {/* 五行草坪 */}
        <div className="relative">
          {Array.from({ length: LANES }).map((_, lane) => (
            <div
              key={lane}
              className={`relative h-[72px] flex items-center ${lane % 2 ? 'bg-lime-500/80' : 'bg-lime-400/80'}`}
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 40px, transparent 40px 80px)',
              }}
            >
              {/* 房子 */}
              <span className="absolute left-1 text-3xl z-10">🏡</span>
              {/* 小推车 */}
              {mowers[lane] && <span className="absolute left-[5%] text-2xl z-10">🚜</span>}
              {mowerRun === lane && (
                <span className="absolute left-[5%] text-2xl z-20 animate-mower">🚜💨</span>
              )}
              {/* 豌豆射手 */}
              <span className="absolute left-[8.5%] text-3xl z-10 animate-sway">{PLANT_BY_WAVE[wave]}</span>
            </div>
          ))}

          {/* 僵尸层 */}
          {zombies.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                playSound('click')
                setSelectedId(z.id === selectedId ? null : z.id)
              }}
              className="absolute z-20 -translate-x-1/2 focus:outline-none"
              style={{ left: `${z.x}%`, top: `calc(${z.lane} * 72px + 40px + 4px)` }}
            >
              <div
                className={`flex flex-col items-center transition-transform ${
                  selectedId === z.id ? 'scale-110' : ''
                }`}
              >
                <span
                  className={`font-black text-sm rounded-lg px-2 py-0.5 border-2 shadow ${
                    selectedId === z.id
                      ? 'bg-yellow-300 text-red-700 border-yellow-500 animate-pulse'
                      : 'bg-white/95 text-green-950 border-amber-400'
                  }`}
                >
                  {z.a}×{z.b}=?
                </span>
                <span className={`text-4xl animate-walk ${selectedId === z.id ? 'drop-shadow-[0_0_8px_rgba(250,200,0,0.9)]' : ''}`}>
                  {z.skin}
                </span>
              </div>
            </button>
          ))}

          {/* 豌豆 */}
          {peas.map((p) => (
            <span
              key={p.id}
              className="absolute text-2xl z-30 animate-pea"
              style={
                {
                  top: `calc(${p.lane} * 72px + 40px + 22px)`,
                  '--from': `${p.fromX}%`,
                  '--to': `${p.toX}%`,
                } as React.CSSProperties
              }
            >
              🫛
            </span>
          ))}

          {/* 飘字 */}
          {floaters.map((f) => (
            <span
              key={f.id}
              className="absolute z-40 font-black text-lg animate-float pointer-events-none"
              style={{ left: `${f.x}%`, top: `calc(${f.lane} * 72px + 40px)`, color: f.color }}
            >
              {f.text}
            </span>
          ))}

          {/* 覆盖层 */}
          {phase === 'waveClear' && (
            <Overlay>
              <div className="text-5xl mb-2">🎉</div>
              <div className="text-3xl font-black text-white mb-1">第 {wave + 1} 波守住了！</div>
              <div className="text-yellow-300 font-black mb-4">植物升级：{PLANT_BY_WAVE[wave]} ➜ {PLANT_BY_WAVE[wave + 1]}</div>
              <OverlayButton onClick={() => startWave(wave + 1)}>迎战第 {wave + 2} 波 🧟</OverlayButton>
            </Overlay>
          )}
          {phase === 'gameover' && (
            <Overlay>
              <div className="text-5xl mb-2">🧠</div>
              <div className="text-3xl font-black text-white mb-1">僵尸吃掉了你的脑子！</div>
              <div className="text-yellow-300 font-black mb-4">本次击败 {kills} 只僵尸 · 阳光 {score}</div>
              <OverlayButton onClick={() => setPhase('setup')}>🌻 再守一次</OverlayButton>
            </Overlay>
          )}
          {phase === 'victory' && (
            <Overlay>
              <div className="text-5xl mb-2">🏆</div>
              <div className="text-3xl font-black text-white mb-1">五波全部守住，草坪安全啦！</div>
              <div className="text-yellow-300 font-black mb-1">
                {'⭐'.repeat(Math.max(1, mowers.filter(Boolean).length))}
              </div>
              <div className="text-white font-black mb-4">
                击败 {kills} 只僵尸 · 阳光 {score} · 最高连击 {combo}
              </div>
              <OverlayButton onClick={() => setPhase('setup')}>🌻 再来一局</OverlayButton>
            </Overlay>
          )}
        </div>
      </div>

      {/* 答题区 */}
      <div className={shake ? 'animate-shake' : ''}>
        {phase === 'playing' ? (
          <>
            <div className="text-center font-black text-green-900 mb-1 text-sm">
              {selectedId
                ? '🎯 已锁定僵尸，输入答案后点 ✔（或直接按回车）'
                : '💡 点击僵尸可锁定目标；不选则自动攻击最靠近房子的僵尸'}
            </div>
            <NumberPad value={input} onChange={setInput} onSubmit={submit} />
          </>
        ) : (
          <div className="h-8" />
        )}
      </div>
    </div>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/70 flex flex-col items-center justify-center text-center p-6">
      {children}
    </div>
  )
}

function OverlayButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl bg-gradient-to-b from-orange-400 to-red-500 text-white text-xl font-black px-10 py-3 shadow-[0_5px_0_rgba(0,0,0,0.35)] active:translate-y-1 active:shadow-none hover:scale-105 transition-transform"
    >
      {children}
    </button>
  )
}
