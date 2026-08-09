interface Props {
  a: number
  b: number
  size?: 'sm' | 'lg'
}

/** 用点阵直观展示 a×b：b 行 a 列（b 个 a 相加） */
export default function DotArray({ a, b, size = 'lg' }: Props) {
  const dot = size === 'lg' ? 'w-6 h-6 text-sm' : 'w-4 h-4 text-[8px]'
  return (
    <div className="inline-flex flex-col items-center gap-2 bg-white/80 rounded-2xl p-4 border-4 border-green-700/30">
      <div className="text-green-900 font-bold text-sm">
        {b} 行 × {a} 列 = {b} 个 {a}
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: b }).map((_, r) => (
          <div key={r} className="flex gap-1 items-center">
            {Array.from({ length: a }).map((_, c) => (
              <span
                key={c}
                className={`${dot} rounded-full bg-gradient-to-br from-lime-400 to-green-600 border border-green-800/40 flex items-center justify-center shadow-sm`}
              >
                🫛
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
