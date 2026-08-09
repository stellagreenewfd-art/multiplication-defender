import { useState } from 'react'
import DotArray from '@/components/game/DotArray'
import { chantText, factKey, loadMastery, loadWrongFacts, meaningText } from '@/game/logic'
import { playSound } from '@/game/sound'

/** 九九乘法表总览：颜色标记掌握情况，点击任意格子查看意义 */
export default function TableGrid() {
  const [selected, setSelected] = useState<{ a: number; b: number } | null>(null)
  const mastery = loadMastery()
  const wrongKeys = new Set(loadWrongFacts().map((f) => factKey(f.a, f.b)))

  const cellStyle = (a: number, b: number) => {
    const k = factKey(a, b)
    if (wrongKeys.has(k)) return 'bg-red-200 text-red-900 border-red-400 hover:bg-red-300'
    const m = mastery[k] || 0
    if (m >= 5) return 'bg-green-500 text-white border-green-700 hover:bg-green-400'
    if (m >= 2) return 'bg-green-200 text-green-900 border-green-400 hover:bg-green-300'
    if (m >= 1) return 'bg-lime-100 text-green-900 border-lime-300 hover:bg-lime-200'
    return 'bg-white/80 text-green-950 border-amber-200 hover:bg-amber-100'
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-10">
      <div className="flex flex-wrap justify-center gap-3 text-sm font-black">
        <span className="bg-green-500 text-white rounded-full px-3 py-1">🌟 熟练掌握</span>
        <span className="bg-green-200 text-green-900 rounded-full px-3 py-1">🌱 练习中</span>
        <span className="bg-red-200 text-red-900 rounded-full px-3 py-1">📕 错题本里</span>
        <span className="bg-white text-green-950 rounded-full px-3 py-1 border border-amber-300">⬜ 还没练过</span>
      </div>

      <div className="bg-gradient-to-b from-amber-50 to-yellow-100 rounded-3xl border-8 border-amber-700/50 p-4 shadow-xl overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {Array.from({ length: 9 }).map((_, i) => {
              const b = i + 1
              return (
                <tr key={b}>
                  {Array.from({ length: 9 }).map((_, j) => {
                    const a = j + 1
                    return (
                      <td key={a} className="p-0.5">
                        <button
                          onClick={() => {
                            playSound('click')
                            setSelected({ a, b })
                          }}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 font-black text-sm md:text-base transition-all hover:scale-110 ${cellStyle(a, b)} ${
                            selected?.a === a && selected?.b === b ? 'ring-4 ring-orange-400 scale-110' : ''
                          }`}
                        >
                          <div className="leading-tight">
                            <div className="text-[10px] opacity-70">
                              {a}×{b}
                            </div>
                            {a * b}
                          </div>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="w-full max-w-2xl bg-gradient-to-b from-sky-100 to-green-100 rounded-3xl border-8 border-amber-700/60 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-2 font-black text-green-950">
                <span className="text-6xl">{selected.a}</span>
                <span className="text-4xl text-orange-600">×</span>
                <span className="text-6xl">{selected.b}</span>
                <span className="text-4xl text-orange-600">=</span>
                <span className="text-6xl text-red-600">{selected.a * selected.b}</span>
              </div>
              <div className="mt-2 inline-block bg-yellow-300 text-yellow-900 font-black rounded-full px-4 py-1 border-2 border-yellow-500">
                🌻 {chantText(selected.a, selected.b)}
              </div>
              <p className="mt-2 text-green-900 font-bold">{meaningText(selected.a, selected.b)}</p>
            </div>
            <DotArray a={selected.a} b={selected.b} size="sm" />
          </div>
        </div>
      )}
      {!selected && (
        <p className="text-green-800/70 font-bold text-sm">👆 点击任意格子，查看这句口诀的意义和豌豆点阵</p>
      )}
    </div>
  )
}
