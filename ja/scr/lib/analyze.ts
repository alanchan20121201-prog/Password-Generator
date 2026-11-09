import { charsetSize, type CharsetOptions } from './generate'

const COMMON = new Set([
  'password',
  'password1',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'qwerty123',
  'letmein',
  'welcome',
  'admin',
  'iloveyou',
  'abc123',
  '111111',
  '000000',
])

export type StrengthLabel = '未入力' | '非常に弱い' | '弱い' | '普通' | '強い' | '非常に強い'

export type Analysis = {
  score: number
  label: StrengthLabel
  crackTime: string
  suggestions: string[]
  entropyBits: number
}

const GUESSES_PER_SECOND = 1e10

function passwordCharset(password: string): CharsetOptions {
  return {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
  }
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 1) {
    return '1 秒未満'
  }

  const units: [string, number][] = [
    ['世紀', 100 * 365.25 * 24 * 3600],
    ['年', 365.25 * 24 * 3600],
    ['月', 30 * 24 * 3600],
    ['日', 24 * 3600],
    ['時間', 3600],
    ['分', 60],
    ['秒', 1],
  ]

  for (const [name, size] of units) {
    if (seconds >= size) {
      const value = Math.floor(seconds / size)
      if (name === '世紀' && value >= 1000) {
        return '10 万年以上'
      }
      if (name === '年' && value >= 1_000_000) {
        return '数百万年'
      }
      return `${value.toLocaleString('zh-CN')} ${name}`
    }
  }

  return '1 秒未満'
}

export function analyzePassword(password: string): Analysis {
  if (!password) {
    return {
      score: 0,
      label: '未入力',
      crackTime: '—',
      suggestions: ['パスワードを入力すると強度を確認できます。'],
      entropyBits: 0,
    }
  }

  const options = passwordCharset(password)
  const pool = Math.max(charsetSize(options), 1)
  let entropy = password.length * Math.log2(pool)

  const lower = password.toLowerCase()
  const suggestions: string[] = []

  if (COMMON.has(lower)) {
    entropy = Math.min(entropy, 12)
    suggestions.push('これはよく使われるパスワードです。より独自性の高いものを選んでください。')
  }

  if (/(.)\1{2,}/.test(password)) {
    entropy *= 0.7
    suggestions.push('同じ文字の繰り返しは避けてください。')
  }

  if (/^(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(password)) {
    entropy *= 0.55
    suggestions.push('連続した文字やキーボード配列の並びは避けてください。')
  }

  if (password.length < 12) {
    suggestions.push('12 文字以上を使用してください。長いほど解読されにくくなります。')
  }
  if (!options.uppercase) suggestions.push('大文字を追加してください。')
  if (!options.lowercase) suggestions.push('小文字を追加してください。')
  if (!options.numbers) suggestions.push('数字を追加してください。')
  if (!options.symbols) suggestions.push('!@#$ などの記号を追加してください。')

  const unique = new Set(password).size
  if (unique < Math.min(6, password.length)) {
    entropy *= 0.75
    suggestions.push('より多様な文字を組み合わせてください。')
  }

  const guesses = Math.pow(2, Math.max(entropy - 1, 0))
  const seconds = guesses / GUESSES_PER_SECOND
  const duration = formatDuration(seconds)
  const crackTime =
    duration === '1 秒未満'
      ? 'このパスワードはほぼ一瞬で解読されます。'
      : duration.startsWith('10 万年') || duration.startsWith('数百万')
        ? `一般的な攻撃者がこのパスワードを解読するには ${duration} かかります。`
        : `一般的な攻撃者がこのパスワードを解読するには約 ${duration} かかります。`

  let score = 0
  if (entropy >= 80) score = 100
  else if (entropy >= 60) score = 80
  else if (entropy >= 45) score = 60
  else if (entropy >= 28) score = 40
  else score = Math.max(12, Math.round((entropy / 28) * 40))

  let label: StrengthLabel = '非常に弱い'
  if (entropy >= 80) label = '非常に強い'
  else if (entropy >= 60) label = '強い'
  else if (entropy >= 45) label = '普通'
  else if (entropy >= 28) label = '弱い'

  if (suggestions.length === 0) {
    suggestions.push('パスワードの強度は良好です。ローカルに保存し、複数のサイトで使い回さないでください。')
  }

  return {
    score,
    label,
    crackTime,
    suggestions,
    entropyBits: Math.round(entropy),
  }
}
