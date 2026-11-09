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

export type StrengthLabel = '空' | '非常弱' | '弱' | '一般' | '強' | '非常強'

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
    ['世紀', 100 * 365.25 * 24 * 3600],
    ['年', 365.25 * 24 * 3600],
    ['月', 30 * 24 * 3600],
    ['天', 24 * 3600],
    ['小時', 3600],
    ['分鐘', 60],
    ['秒', 1],
  ]

  for (const [name, size] of units) {
    if (seconds >= size) {
      const value = Math.floor(seconds / size)
      if (name === '世紀' && value >= 1000) {
        return '超過 10 萬年'
      }
      if (name === '年' && value >= 1_000_000) {
        return '數百萬年'
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
      suggestions: ['輸入密碼以查看其強度。'],
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
    suggestions.push('這是常見密碼，請選擇更獨特的密碼。')
  }

  if (/(.)\1{2,}/.test(password)) {
    entropy *= 0.7
    suggestions.push('避免多次重複使用相同的字元。')
  }

  if (/^(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(password)) {
    entropy *= 0.55
    suggestions.push('避免使用連續或鍵盤排列的字元。')
  }

  if (password.length < 12) {
    suggestions.push('請使用至少 12 個字元，越長的密碼越難被破解。')
  }
  if (!options.uppercase) suggestions.push('新增大寫字母。')
  if (!options.lowercase) suggestions.push('新增小寫字母。')
  if (!options.numbers) suggestions.push('新增數字。')
  if (!options.symbols) suggestions.push('新增特殊符號，例如 !@#$。')

  const unique = new Set(password).size
  if (unique < Math.min(6, password.length)) {
    entropy *= 0.75
    suggestions.push('使用更多樣的獨特字元組合。')
  }

  const guesses = Math.pow(2, Math.max(entropy - 1, 0))
  const seconds = guesses / GUESSES_PER_SECOND
  const duration = formatDuration(seconds)
  const crackTime =
    duration === '不到 1 秒'
      ? '此密碼幾乎可被瞬間破解。'
      : duration.startsWith('超過') || duration.startsWith('數百萬')
        ? `一般攻擊者需要 ${duration} 才能破解此密碼。`
        : `一般攻擊者大約需要 ${duration} 才能破解此密碼。`

  let score = 0
  if (entropy >= 80) score = 100
  else if (entropy >= 60) score = 80
  else if (entropy >= 45) score = 60
  else if (entropy >= 28) score = 40
  else score = Math.max(12, Math.round((entropy / 28) * 40))

  let label: StrengthLabel = '非常弱'
  if (entropy >= 80) label = '非常強'
  else if (entropy >= 60) label = '強'
  else if (entropy >= 45) label = '一般'
  else if (entropy >= 28) label = '弱'

  if (suggestions.length === 0) {
    suggestions.push('密碼強度良好。請將其儲存在本機，切勿在多個網站重複使用。')
  }

  return {
    score,
    label,
    crackTime,
    suggestions,
    entropyBits: Math.round(entropy),
  }
}
