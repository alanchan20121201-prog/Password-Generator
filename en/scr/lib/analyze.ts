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

export type StrengthLabel = 'Empty' | 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong'

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
    return 'less than 1 second'
  }

  const units: [string, number][] = [
    ['century', 100 * 365.25 * 24 * 3600],
    ['year', 365.25 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ]

  for (const [name, size] of units) {
    if (seconds >= size) {
      const value = Math.floor(seconds / size)
      const plural = value === 1 ? name : `${name}s`
      if (name === 'century' && value >= 1000) {
        return 'more than 100,000 years'
      }
      if (name === 'year' && value >= 1_000_000) {
        return 'millions of years'
      }
      return `${value.toLocaleString('en-US')} ${plural}`
    }
  }

  return 'less than 1 second'
}

export function analyzePassword(password: string): Analysis {
  if (!password) {
    return {
      score: 0,
      label: 'Empty',
      crackTime: '—',
      suggestions: ['Enter a password to see its strength.'],
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
    suggestions.push('This is a commonly used password. Choose something unique.')
  }

  if (/(.)\1{2,}/.test(password)) {
    entropy *= 0.7
    suggestions.push('Avoid repeating the same character several times.')
  }

  if (/^(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(password)) {
    entropy *= 0.55
    suggestions.push('Avoid sequential or keyboard patterns.')
  }

  if (password.length < 12) {
    suggestions.push('Use at least 12 characters. Longer passwords are much harder to crack.')
  }
  if (!options.uppercase) suggestions.push('Add uppercase letters.')
  if (!options.lowercase) suggestions.push('Add lowercase letters.')
  if (!options.numbers) suggestions.push('Add numbers.')
  if (!options.symbols) suggestions.push('Add special symbols such as !@#$.')

  const unique = new Set(password).size
  if (unique < Math.min(6, password.length)) {
    entropy *= 0.75
    suggestions.push('Use a wider mix of unique characters.')
  }

  const guesses = Math.pow(2, Math.max(entropy - 1, 0))
  const seconds = guesses / GUESSES_PER_SECOND
  const duration = formatDuration(seconds)
  const crackTime =
    duration === 'less than 1 second'
      ? 'This password could be cracked almost instantly.'
      : duration.startsWith('more than') || duration.startsWith('millions')
        ? `A typical attacker would need ${duration} to crack this password.`
        : `A typical attacker would need about ${duration} to crack this password.`

  let score = 0
  if (entropy >= 80) score = 100
  else if (entropy >= 60) score = 80
  else if (entropy >= 45) score = 60
  else if (entropy >= 28) score = 40
  else score = Math.max(12, Math.round((entropy / 28) * 40))

  let label: StrengthLabel = 'Very Weak'
  if (entropy >= 80) label = 'Very Strong'
  else if (entropy >= 60) label = 'Strong'
  else if (entropy >= 45) label = 'Fair'
  else if (entropy >= 28) label = 'Weak'

  if (suggestions.length === 0) {
    suggestions.push('Solid password. Store it locally and never reuse it across sites.')
  }

  return {
    score,
    label,
    crackTime,
    suggestions,
    entropyBits: Math.round(entropy),
  }
}
