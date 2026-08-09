// ============ 九九乘法表游戏核心逻辑 ============

export interface Fact {
  a: number // 乘数 2-9
  b: number // 乘数 1-9
}

export interface WrongFact extends Fact {
  count: number // 累计答错次数
  streak: number // 连续答对次数（复习时，满3次毕业）
}

export interface GameStats {
  totalScore: number
  bestCombo: number
  gamesPlayed: number
}

const WRONG_KEY = 'mm_wrong_facts'
const MASTERY_KEY = 'mm_mastery'
const STATS_KEY = 'mm_stats'

export const factKey = (a: number, b: number) => `${Math.min(a, b)}_${Math.max(a, b)}`

// ---------- 错题本 ----------
export function loadWrongFacts(): WrongFact[] {
  try {
    return JSON.parse(localStorage.getItem(WRONG_KEY) || '[]')
  } catch {
    return []
  }
}

function saveWrongFacts(list: WrongFact[]) {
  localStorage.setItem(WRONG_KEY, JSON.stringify(list))
}

export function recordWrong(a: number, b: number) {
  const list = loadWrongFacts()
  const k = factKey(a, b)
  const found = list.find((f) => factKey(f.a, f.b) === k)
  if (found) {
    found.count += 1
    found.streak = 0
  } else {
    list.push({ a, b, count: 1, streak: 0 })
  }
  saveWrongFacts(list)
}

/** 复习时答对：streak+1，满 3 次从错题本毕业，返回是否毕业 */
export function recordReviewCorrect(a: number, b: number): boolean {
  const list = loadWrongFacts()
  const k = factKey(a, b)
  const idx = list.findIndex((f) => factKey(f.a, f.b) === k)
  if (idx === -1) return false
  list[idx].streak += 1
  if (list[idx].streak >= 3) {
    list.splice(idx, 1)
    saveWrongFacts(list)
    return true
  }
  saveWrongFacts(list)
  return false
}

// ---------- 熟练度（每句口诀答对次数） ----------
export function loadMastery(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(MASTERY_KEY) || '{}')
  } catch {
    return {}
  }
}

export function recordMastery(a: number, b: number) {
  const m = loadMastery()
  const k = factKey(a, b)
  m[k] = (m[k] || 0) + 1
  localStorage.setItem(MASTERY_KEY, JSON.stringify(m))
}

// ---------- 总战绩 ----------
export function loadStats(): GameStats {
  try {
    return { totalScore: 0, bestCombo: 0, gamesPlayed: 0, ...JSON.parse(localStorage.getItem(STATS_KEY) || '{}') }
  } catch {
    return { totalScore: 0, bestCombo: 0, gamesPlayed: 0 }
  }
}

export function saveStats(patch: Partial<GameStats>) {
  const s = { ...loadStats(), ...patch }
  localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

// ---------- 出题 ----------
/** 从选中的口诀表中随机出一道题（乘数顺序随机，帮助理解交换律） */
export function randomFact(tables: number[]): Fact {
  const t = tables[Math.floor(Math.random() * tables.length)]
  const b = 1 + Math.floor(Math.random() * 9)
  // 一半概率交换顺序，例如 3×7 与 7×3 都算 3 的乘法表
  return Math.random() < 0.5 ? { a: t, b } : { a: b, b: t }
}

/** 乘法的意义：a×b 表示 b 个 a 相加 */
export function meaningText(a: number, b: number): string {
  const sum = Array(b).fill(a).join(' + ')
  return `${b} 个 ${a} 相加：${sum} = ${a * b}`
}

/** 九九乘法口诀（中文读法） */
export function chantText(a: number, b: number): string {
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  const product = a * b
  const x = Math.min(a, b)
  const y = Math.max(a, b)
  let p: string
  if (product < 10) p = digits[product]
  else if (product < 20) p = '一十' + (product % 10 ? digits[product % 10] : '')
  else {
    const tens = Math.floor(product / 10)
    const ones = product % 10
    p = digits[tens] + '十' + (ones ? digits[ones] : '')
  }
  return `${digits[x]}${digits[y]}${product < 10 ? '得' : ''}${p}`
}

// ---------- 僵尸皮肤 ----------
export const ZOMBIE_SKINS = ['🧟', '🧟‍♂️', '🧟‍♀️']
export const ZOMBIE_NAMES = ['普通僵尸', '路障僵尸', '撑杆僵尸']
