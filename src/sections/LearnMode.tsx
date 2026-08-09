import { useMemo, useState } from 'react'
import DotArray from '@/components/game/DotArray'
import { chantText, meaningText, recordMastery } from '@/game/logic'
import { playSound } from '@/game/sound'

const TABLES = [2, 3, 4, 5, 6, 7, 8, 9]

/** 学习模式：逐句理解乘法口诀的意义 */
export default function LearnMode() {
  const [table, setTable] = useState(3)
  const [idx, setIdx] = useState(0) // 0..8 对应 ×1..×9
  const [hideAnswer, setHideAnswer] = useState(false)
  const [revealed, setRevealed] = useState(true)

  const b = idx + 1
  const product = table * b
  const showAnswer = !hideAnswer || revealed

  const steps = useMemo(() => Array.from({ length: 9 }, (_, i) => i + 1), [])

  const go = (next: number) => {
    playSound('click')
    setIdx(Math.max(0, Math.min(8, next)))
    setRevealed(!hideAnswer)
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-10">
      {/* 选表 */}
      <div className="flex flex-wrap justify-center gap-2">
        {TABLES.map((t) => (
          <button
            key={t}
            onClick={() => {
              playSound('click')
              setTable(t)
              setIdx(0)
              setRevealed(!hideAnswer)
            }}
            className={`rounded-full px-4 py-2 font-black text-lg border-4 transition-all shadow-[0_3px_0_rgba(0,0,0,0.25)] active:translate-y-0.5 active:shadow-none ${
              table === t
                ? 'bg-orange-500 text-white border-orange-700 scale-110'
                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
            }`}
          >
            {t} 的乘法
          </button>
        ))}
      </div>

      {/* 步骤圆点 */}
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => go(i)}
            className={`w-8 h-8 rounded-full font-black text-sm border-2 ${
              i === idx ? 'bg-green-600 text-white border-green-800 scale-125' : 'bg-white/70 text-green-900 border-green-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 主卡片 */}
      <div className="w-full max-w-3xl bg-gradient-to-b from-sky-100 to-green-100 rounded-3xl border-8 border-amber-700/60 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-3 font-black text-green-950">
              <span className="text-7xl">{table}</span>
              <span className="text-5xl text-orange-600">×</span>
              <span className="text-7xl">{b}</span>
              <span className="text-5xl text-orange-600">=</span>
              {showAnswer ? (
                <span className="text-7xl text-red-600">{product}</span>
              ) : (
                <button
                  onClick={() => {
                    playSound('correct')
                    setRevealed(true)
                    recordMastery(table, b)
                  }}
                  className="text-7xl text-white bg-red-500 rounded-2xl px-4 animate-pulse"
                >
                  ?
                </button>
              )}
            </div>
            <div className="mt-3 inline-block bg-yellow-300 text-yellow-900 font-black text-xl rounded-full px-5 py-1 border-2 border-yellow-500">
              🌻 口诀：{chantText(table, b)}
            </div>
            <p className="mt-3 text-green-900 font-bold text-lg">{meaningText(table, b)}</p>
            <p className="mt-1 text-green-700 text-sm font-bold">
              🤝 交换位置也一样：{b} × {table} = {product}
            </p>
          </div>
          <DotArray a={table} b={b} />
        </div>
      </div>

      {/* 控制区 */}
      <div className="flex flex-wrap justify-center items-center gap-3">
        <button
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
          className="rounded-2xl bg-sky-500 text-white font-black px-6 py-3 text-lg shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          ⬅ 上一句
        </button>
        <button
          onClick={() => {
            playSound('click')
            setHideAnswer(!hideAnswer)
            setRevealed(hideAnswer)
          }}
          className={`rounded-2xl font-black px-6 py-3 text-lg shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none ${
            hideAnswer ? 'bg-purple-500 text-white' : 'bg-white text-purple-700 border-2 border-purple-300'
          }`}
        >
          {hideAnswer ? '🙈 自测中：点 ? 揭晓' : '🙉 开启自测模式'}
        </button>
        <button
          onClick={() => go(idx + 1)}
          disabled={idx === 8}
          className="rounded-2xl bg-sky-500 text-white font-black px-6 py-3 text-lg shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          下一句 ➡
        </button>
      </div>

      <p className="text-green-800/70 font-bold text-sm text-center max-w-xl">
        💡 小提示：乘法是「相同的数重复相加」的 shortcut！看懂左边的豌豆点阵，就明白 {table}×{b} 为什么是{' '}
        {b} 个 {table} 相加啦。学完后去「保卫草坪」实战吧！
      </p>
    </div>
  )
}
