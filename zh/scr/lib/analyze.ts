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

export type StrengthLabel = '空' | '非常弱' | '弱' | '一般' | '强' | '非常强'

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
    return '不到 1 秒'
  }

  const units: [string, number][] = [
    ['世纪', 100 * 365.25 * 24 * 3600],
    ['年', 365.25 * 24 * 3600],
    ['月', 30 * 24 * 3600],
    ['天', 24 * 3600],
    ['小时', 3600],
    ['分钟', 60],
    ['秒', 1],
  ]

  for (const [name, size] of units) {
    if (seconds >= size) {
      const value = Math.floor(seconds / size)
      if (name === '世纪' && value >= 1000) {
        return '超过 10 万年'
      }
      if (name === '年' && value >= 1_000_000) {
        return '数百万年'
      }
      return `${value.toLocaleString('zh-CN')} ${name}`
    }
  }

  return '不到 1 秒'
}

export function analyzePassword(password: string): Analysis {
  if (!password) {
    return {
      score: 0,
      label: '空',
      crackTime: '—',
      suggestions: ['输入密码以查看其强度。'],
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
    suggestions.push('这是常见密码，请选择更独特的密码。')
  }

  if (/(.)\1{2,}/.test(password)) {
    entropy *= 0.7
    suggestions.push('避免多次重复使用相同的字符。')
  }

  if (/^(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(password)) {
    entropy *= 0.55
    suggestions.push('避免使用连续或键盘排列的字符。')
  }

  if (password.length < 12) {
    suggestions.push('请使用至少 12 个字符，越长的密码越难被破解。')
  }
  if (!options.uppercase) suggestions.push('添加大写字母。')
  if (!options.lowercase) suggestions.push('添加小写字母。')
  if (!options.numbers) suggestions.push('添加数字。')
  if (!options.symbols) suggestions.push('添加特殊符号，例如 !@#$。')

  const unique = new Set(password).size
  if (unique < Math.min(6, password.length)) {
    entropy *= 0.75
    suggestions.push('使用更多样的独特字符组合。')
  }

  const guesses = Math.pow(2, Math.max(entropy - 1, 0))
  const seconds = guesses / GUESSES_PER_SECOND
  const duration = formatDuration(seconds)
  const crackTime =
    duration === '不到 1 秒'
      ? '此密码几乎可被瞬间破解。'
      : duration.startsWith('超过') || duration.startsWith('数百万')
        ? `一般攻击者需要 ${duration} 才能破解此密码。`
        : `一般攻击者大约需要 ${duration} 才能破解此密码。`

  let score = 0
  if (entropy >= 80) score = 100
  else if (entropy >= 60) score = 80
  else if (entropy >= 45) score = 60
  else if (entropy >= 28) score = 40
  else score = Math.max(12, Math.round((entropy / 28) * 40))

  let label: StrengthLabel = '非常弱'
  if (entropy >= 80) label = '非常强'
  else if (entropy >= 60) label = '强'
  else if (entropy >= 45) label = '一般'
  else if (entropy >= 28) label = '弱'

  if (suggestions.length === 0) {
    suggestions.push('密码强度良好。请将其保存在本地，切勿在多个网站重复使用。')
  }

  return {
    score,
    label,
    crackTime,
    suggestions,
    entropyBits: Math.round(entropy),
  }
}
