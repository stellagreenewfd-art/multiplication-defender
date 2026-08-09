import { useState } from 'react'
import DefenseGame from '@/sections/DefenseGame'
import LearnMode from '@/sections/LearnMode'
import TableGrid from '@/sections/TableGrid'
import WrongBook from '@/sections/WrongBook'
import { loadStats, loadWrongFacts } from '@/game/logic'
import { isMuted, playSound, setMuted } from '@/game/sound'
import '@/game/game.css'

type Tab = 'home' | 'learn' | 'defense' | 'wrong' | 'table'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'learn', label: '乘法课堂', icon: '🎓' },
  { key: 'defense', label: '保卫草坪', icon: '⚔️' },
  { key: 'wrong', label: '错题本', icon: '📕' },
  { key: 'table', label: '九九乘法表', icon: '📊' },
]

export default function Home() {
  const [tab, setTab] = useState<Tab>('home')
  const [muted, setMutedState] = useState(isMuted())
  const stats = loadStats()
  const wrongCount = loadWrongFacts().length

  const switchTab = (t: Tab) => {
    playSound('click')
    setTab(t)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 font-sans">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-green-800 via-green-700 to-green-800 shadow-lg border-b-4 border-amber-900/40">
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <button onClick={() => switchTab('home')} className="flex items-center gap-2 text-left">
            <span className="text-3xl animate-sway inline-block">🌻</span>
            <div>
              <div className="text-yellow-300 font-black text-lg leading-tight drop-shadow">乘法保卫战</div>
              <div className="text-green-200 text-xs font-bold">植物大战僵尸 · 九九乘法表</div>
            </div>
          </button>
          <nav className="flex flex-wrap justify-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`rounded-full px-3 py-1.5 font-black text-sm transition-all ${
                  tab === t.key
                    ? 'bg-yellow-300 text-green-900 scale-105 shadow'
                    : 'text-green-100 hover:bg-green-600/60'
                }`}
              >
                {t.icon} {t.label}
                {t.key === 'wrong' && wrongCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{wrongCount}</span>
                )}
              </button>
            ))}
          </nav>
          <button
            onClick={() => {
              const m = !muted
              setMuted(m)
              setMutedState(m)
            }}
            className="text-2xl bg-green-600/60 rounded-full w-10 h-10 flex items-center justify-center hover:bg-green-600"
            title={muted ? '打开音效' : '关闭音效'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-5">
        {tab === 'home' && <HomeLanding go={switchTab} totalScore={stats.totalScore} bestCombo={stats.bestCombo} />}
        {tab === 'learn' && <LearnMode />}
        {tab === 'defense' && <DefenseGame />}
        {tab === 'wrong' && <WrongBook />}
        {tab === 'table' && <TableGrid />}
      </main>
    </div>
  )
}

function HomeLanding({
  go,
  totalScore,
  bestCombo,
}: {
  go: (t: Tab) => void
  totalScore: number
  bestCombo: number
}) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 pb-10">
      {/* 主视觉 */}
      <div className="w-full max-w-3xl bg-gradient-to-b from-sky-100 to-green-100 rounded-3xl border-8 border-amber-700/60 p-8 shadow-xl text-center relative overflow-hidden">
        <div className="text-6xl mb-1">🌻🫛🧟</div>
        <h1 className="text-4xl font-black text-green-900 mb-2">乘法保卫战</h1>
        <p className="text-green-800 font-bold text-lg mb-4">
          僵尸大军来袭！只有算对乘法题，豌豆射手才能保卫草坪！
          <br />
          边玩边学，轻松背熟九九乘法表 🌟
        </p>
        {(totalScore > 0 || bestCombo > 0) && (
          <div className="flex justify-center gap-3 mb-4 font-black">
            <span className="bg-yellow-300 text-yellow-900 rounded-full px-4 py-1 border-2 border-yellow-500">
              ☀️ 累计阳光 {totalScore}
            </span>
            <span className="bg-red-100 text-red-700 rounded-full px-4 py-1 border-2 border-red-300">
              🔥 最佳连击 {bestCombo}
            </span>
          </div>
        )}
        <button
          onClick={() => go('defense')}
          className="rounded-3xl bg-gradient-to-b from-orange-400 to-red-500 text-white text-3xl font-black px-14 py-5 shadow-[0_8px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none hover:scale-105 transition-transform animate-pulse-slow"
        >
          ⚔️ 开始战斗
        </button>
      </div>

      {/* 四大玩法卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        <MenuCard
          icon="🎓"
          title="乘法课堂"
          desc="先看懂再背！用豌豆点阵理解「乘法是重复相加」，逐句学会 2-9 的口诀"
          onClick={() => go('learn')}
          color="from-sky-400 to-sky-600"
        />
        <MenuCard
          icon="⚔️"
          title="保卫草坪"
          desc="闯关实战！5 波僵尸举着算式进攻，答对发射豌豆，答错僵尸加速冲过来"
          onClick={() => go('defense')}
          color="from-orange-400 to-red-500"
        />
        <MenuCard
          icon="📕"
          title="错题本"
          desc="答错的口诀自动收集在这里，连续答对 3 次就能「毕业」，薄弱点逐个击破"
          onClick={() => go('wrong')}
          color="from-rose-400 to-rose-600"
        />
        <MenuCard
          icon="📊"
          title="九九乘法表"
          desc="45 句口诀全景地图，点任意格子看意义，颜色标记你的掌握进度"
          onClick={() => go('table')}
          color="from-green-400 to-green-600"
        />
      </div>

      {/* 给家长的话 */}
      <div className="w-full max-w-3xl bg-white/70 rounded-2xl border-2 border-green-300 p-4 text-sm text-green-900 font-bold">
        <span className="font-black">👨‍👩‍👧 给家长：</span>
        建议的学习路径——先在「乘法课堂」理解意义 → 去「保卫草坪」实战（可选只练某几句口诀）→
        定期清「错题本」→ 在「九九乘法表」检查掌握度。游戏记录了每一句口诀的练习数据，全部保存在本机。
      </div>
    </div>
  )
}

function MenuCard({
  icon,
  title,
  desc,
  onClick,
  color,
}: {
  icon: string
  title: string
  desc: string
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-3xl bg-gradient-to-br ${color} p-5 text-white shadow-[0_5px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none hover:scale-[1.03] transition-transform`}
    >
      <div className="text-4xl mb-1">{icon}</div>
      <div className="font-black text-xl mb-1">{title}</div>
      <div className="text-white/90 text-sm font-bold leading-snug">{desc}</div>
    </button>
  )
}
