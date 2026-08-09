import { useEffect, useState } from 'react'
import NumberPad from '@/components/game/NumberPad'
import {
  type WrongFact,
  factKey,
  loadWrongFacts,
  meaningText,
  recordMastery,
  recordReviewCorrect,
  recordWrong,
} from '@/game/logic'
import { playSound } from '@/game/sound'

type Mode = 'list' | 'review' | 'done'

/** 错题本：收集答错的口诀，连续答对 3 次即可毕业 */
export default function WrongBook() {
  const [facts, setFacts] = useState<WrongFact[]>(() => loadWrongFacts())
  const [mode, setMode] = useState<Mode>('list')
  const [queue, setQueue] = useState<WrongFact[]>([])
  const [graduated, setGraduated] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'none' | 'ok' | 'bad'>('none')

  const refresh = () => setFacts(loadWrongFacts())

  const startReview = () => {
    playSound('click')
    const q = [...loadWrongFacts()].sort((x, y) => y.count - x.count)
    if (q.length === 0) return
    setQueue(q)
    setGraduated([])
    setInput('')
    setMode('review')
  }

  const current = queue[0]

  const submitReview = () => {
    if (!current) return
    const val = parseInt(input, 10)
    if (Number.isNaN(val)) return
    if (val === current.a * current.b) {
      const out = recordReviewCorrect(current.a, current.b)
      recordMastery(current.a, current.b)
      playSound(out ? 'graduate' : 'correct')
      setFeedback('ok')
      if (out) setGraduated((g) => [...g, `${current.a}×${current.b}`])
      setTimeout(() => {
        setFeedback('none')
        setInput('')
        const rest = queue.slice(1)
        if (rest.length === 0) {
          setMode('done')
          refresh()
        } else {
          setQueue(rest)
        }
      }, 700)
    } else {
      playSound('wrong')
      recordWrong(current.a, current.b)
      setFeedback('bad')
      setInput('')
      setTimeout(() => setFeedback('none'), 900)
      refresh()
    }
  }

  if (mode === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 px-4 pb-10 text-center">
        <div className="text-6xl">🎓</div>
        <h3 className="text-2xl font-black text-green-900">本轮复习完成！</h3>
        {graduated.length > 0 && (
          <p className="font-black text-orange-600">
            🎉 恭喜毕业：{graduated.join('、')}（已连续答对 3 次，移出错题本）
          </p>
        )}
        <button
          onClick={() => {
            playSound('click')
            setMode('list')
          }}
          className="rounded-2xl bg-green-600 text-white font-black px-8 py-3 shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none"
        >
          返回错题本
        </button>
      </div>
    )
  }

  if (mode === 'review' && current) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 pb-10">
        <div className="font-black text-green-900">
          📕 错题复习 · 还剩 {queue.length} 题 · 这句已错 {current.count} 次 · 连对 {current.streak}/3 次毕业
        </div>
        <div
          className={`bg-gradient-to-b from-sky-100 to-green-100 rounded-3xl border-8 p-8 text-center transition-colors ${
            feedback === 'ok' ? 'border-green-500' : feedback === 'bad' ? 'border-red-500' : 'border-amber-700/60'
          }`}
        >
          <div className="flex items-baseline justify-center gap-3 font-black text-green-950">
            <span className="text-7xl">{current.a}</span>
            <span className="text-5xl text-orange-600">×</span>
            <span className="text-7xl">{current.b}</span>
            <span className="text-5xl text-orange-600">=</span>
            <span className="text-7xl text-red-500">?</span>
          </div>
          {feedback === 'bad' && (
            <p className="mt-3 font-black text-red-600 animate-pulse">再想想！提示：{meaningText(current.a, current.b)}</p>
          )}
          {feedback === 'ok' && <p className="mt-3 font-black text-green-600">答对啦！🌟</p>}
        </div>
        <NumberPad value={input} onChange={setInput} onSubmit={submitReview} />
        <ReviewKeys onSubmit={submitReview} setInput={setInput} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-10">
      {facts.length === 0 ? (
        <div className="bg-green-50 rounded-3xl border-8 border-green-300 p-10 text-center max-w-lg">
          <div className="text-6xl mb-3">🌟</div>
          <h3 className="text-2xl font-black text-green-900 mb-2">错题本是空的，太棒了！</h3>
          <p className="text-green-800 font-bold">
            去「保卫草坪」挑战僵尸吧，答错的口诀会自动收集到这里，方便重点复习。
          </p>
        </div>
      ) : (
        <>
          <div className="bg-red-50 rounded-3xl border-8 border-red-300/70 p-6 max-w-2xl w-full">
            <h3 className="text-xl font-black text-red-800 mb-1">📕 需要重点练习的口诀（{facts.length} 句）</h3>
            <p className="text-red-700/80 font-bold text-sm mb-4">复习时连续答对 3 次，这句口诀就「毕业」啦！</p>
            <div className="flex flex-wrap gap-2">
              {[...facts]
                .sort((x, y) => y.count - x.count)
                .map((f) => (
                  <div
                    key={factKey(f.a, f.b)}
                    className="bg-white rounded-2xl border-2 border-red-300 px-4 py-2 text-center shadow-sm"
                  >
                    <div className="font-black text-green-950 text-lg">
                      {f.a}×{f.b}={f.a * f.b}
                    </div>
                    <div className="text-xs font-bold text-red-500">
                      错 {f.count} 次 · 连对 {f.streak}/3
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <button
            onClick={startReview}
            className="rounded-3xl bg-gradient-to-b from-orange-400 to-red-500 text-white text-2xl font-black px-12 py-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none hover:scale-105 transition-transform"
          >
            🧠 开始复习（{facts.length} 题）
          </button>
        </>
      )}
    </div>
  )
}

/** 复习模式的键盘支持 */
function ReviewKeys({
  setInput,
  onSubmit,
}: {
  setInput: React.Dispatch<React.SetStateAction<string>>
  onSubmit: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setInput((v) => (v.length >= 2 ? v : v === '0' ? e.key : v + e.key))
      } else if (e.key === 'Backspace') {
        setInput((v) => v.slice(0, -1))
      } else if (e.key === 'Enter') {
        onSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setInput, onSubmit])
  return null
}
