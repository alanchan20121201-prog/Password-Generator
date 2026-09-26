const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?'

export type CharsetOptions = {
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

export function charsetSize(options: CharsetOptions): number {
  let size = 0
  if (options.uppercase) size += UPPER.length
  if (options.lowercase) size += LOWER.length
  if (options.numbers) size += DIGITS.length
  if (options.symbols) size += SYMBOLS.length
  return size
}

export function buildPool(options: CharsetOptions): string {
  let pool = ''
  if (options.uppercase) pool += UPPER
  if (options.lowercase) pool += LOWER
  if (options.numbers) pool += DIGITS
  if (options.symbols) pool += SYMBOLS
  return pool
}

function randomIndex(max: number): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] % max
}

function shuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars
}

export function generatePassword(length: number, options: CharsetOptions): string {
  const required: string[] = []
  if (options.uppercase) required.push(UPPER)
  if (options.lowercase) required.push(LOWER)
  if (options.numbers) required.push(DIGITS)
  if (options.symbols) required.push(SYMBOLS)

  if (required.length === 0) {
    throw new Error('Select at least one character type.')
  }

  const pool = required.join('')
  const chars: string[] = []

  for (const set of required) {
    chars.push(set[randomIndex(set.length)])
  }

  while (chars.length < length) {
    chars.push(pool[randomIndex(pool.length)])
  }

  return shuffle(chars).slice(0, length).join('')
}
