import { playSound } from '@/game/sound'

interface Props {
  value: string
  onChange: React.Dispatch<React.SetStateAction<string>>
  onSubmit: () => void
  disabled?: boolean
}

/** 儿童友好的大号数字键盘 */
export default function NumberPad({ value, onChange, onSubmit, disabled }: Props) {
  const press = (d: string) => {
    if (disabled) return
    playSound('click')
    // 函数式更新，连续快速点击也不会丢失数字（九九乘法积最大 81，两位足够）
    onChange((prev) => {
      if (prev.length >= 2) return prev
      if (prev === '0') return d
      return prev + d
    })
  }
  const backspace = () => {
    if (disabled) return
    playSound('click')
    onChange((prev) => prev.slice(0, -1))
  }

  const btn =
    'rounded-2xl text-2xl font-black py-3 shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none transition-all select-none'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3 bg-amber-900/80 rounded-2xl px-5 py-2 min-w-[180px] justify-center border-4 border-amber-950">
        <span className="text-amber-200 text-xl font-bold">答案：</span>
        <span className="text-white text-4xl font-black tracking-widest min-w-[3ch] text-center">
          {value || '？'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)} className={`${btn} bg-lime-500 text-white hover:bg-lime-400`}>
            {d}
          </button>
        ))}
        <button onClick={backspace} className={`${btn} bg-orange-400 text-white text-xl hover:bg-orange-300`}>
          ⌫
        </button>
        <button onClick={() => press('0')} className={`${btn} bg-lime-500 text-white hover:bg-lime-400`}>
          0
        </button>
        <button onClick={disabled ? undefined : onSubmit} className={`${btn} bg-emerald-600 text-white text-xl hover:bg-emerald-500`}>
          ✔
        </button>
      </div>
    </div>
  )
}
