export type VaultEntry = {
  id: string
  title: string
  password: string
  createdAt: number
}

const STORAGE_KEY = 'power-app.vault.v1'

function canUseStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function loadVault(): VaultEntry[] {
  if (!canUseStorage()) return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as VaultEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.password === 'string',
    )
  } catch {
    return []
  }
}

export function saveVault(entries: VaultEntry[]): void {
  if (!canUseStorage()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function createEntry(title: string, password: string): VaultEntry {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    password,
    createdAt: Date.now(),
  }
}
