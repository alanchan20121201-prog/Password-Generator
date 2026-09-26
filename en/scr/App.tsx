import { useEffect, useMemo, useState } from 'react'
import { analyzePassword } from './lib/analyze'
import { generatePassword, type CharsetOptions } from './lib/generate'
import { createEntry, loadVault, saveVault, type VaultEntry } from './lib/vault'
import './App.css'

const DEFAULT_OPTIONS: CharsetOptions = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
}

function App() {
  const [options, setOptions] = useState<CharsetOptions>(DEFAULT_OPTIONS)
  const [length, setLength] = useState(16)
  const [generated, setGenerated] = useState('')
  const [copyLabel, setCopyLabel] = useState('Copy')
  const [analyzeInput, setAnalyzeInput] = useState('')
  const [showAnalyze, setShowAnalyze] = useState(false)
  const [title, setTitle] = useState('')
  const [vaultPassword, setVaultPassword] = useState('')
  const [vault, setVault] = useState<VaultEntry[]>(() => loadVault())
  const [query, setQuery] = useState('')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  const analysis = useMemo(() => analyzePassword(analyzeInput), [analyzeInput])
  const hasCharset = Object.values(options).some(Boolean)

  useEffect(() => {
    saveVault(vault)
  }, [vault])

  useEffect(() => {
    try {
      setGenerated(generatePassword(length, options))
    } catch {
      setGenerated('')
    }
  }, [])

  function toggleOption(key: keyof CharsetOptions) {
    setOptions((current) => ({ ...current, [key]: !current[key] }))
  }

  function onGenerate() {
    setError('')
    try {
      const next = generatePassword(length, options)
      setGenerated(next)
      setVaultPassword(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate password.')
    }
  }

  async function copyText(value: string, success = 'Copied') {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopyLabel(success)
      window.setTimeout(() => setCopyLabel('Copy'), 1600)
    } catch {
      setError('Clipboard access was blocked by the browser.')
    }
  }

  function saveToVault() {
    setError('')
    if (!title.trim()) {
      setError('Give this password a title so you can find it later.')
      return
    }
    if (!vaultPassword) {
      setError('Enter or generate a password before saving.')
      return
    }
    setVault((current) => [createEntry(title, vaultPassword), ...current])
    setTitle('')
    setVaultPassword('')
  }

  function removeEntry(id: string) {
    setVault((current) => current.filter((entry) => entry.id !== id))
  }

  const filtered = vault.filter((entry) =>
    entry.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const meterClass =
    analysis.label === 'Very Strong'
      ? 'meter-fill very-strong'
      : analysis.label === 'Strong'
        ? 'meter-fill strong'
        : analysis.label === 'Fair'
          ? 'meter-fill fair'
          : analysis.label === 'Weak'
            ? 'meter-fill weak'
            : 'meter-fill very-weak'

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Local-only • Nothing is uploaded</p>
        <h1>Secure Password Generator & Analyzer</h1>
        <p className="lede">
          Create strong passwords, check how long they would take to crack, and store them on this
          device. Data stays in your browser even after you go offline or restart.
        </p>
      </header>

      <section className="panel" aria-labelledby="generator-title">
        <div className="panel-head">
          <h2 id="generator-title">1. Generator</h2>
          <span className="badge">Cryptographically random</span>
        </div>

        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => toggleOption('uppercase')}
            />
            Uppercase (A–Z)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => toggleOption('lowercase')}
            />
            Lowercase (a–z)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => toggleOption('numbers')}
            />
            Numbers (0–9)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => toggleOption('symbols')}
            />
            Symbols (!@#$)
          </label>
        </div>

        <label className="slider-row">
          <span>Length: {length}</span>
          <input
            type="range"
            min={8}
            max={32}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>

        <div className="output-row">
          <code className="password-out">{generated || 'Select a character type to generate'}</code>
          <button type="button" className="primary" onClick={() => copyText(generated)} disabled={!generated}>
            {copyLabel}
          </button>
        </div>

        <div className="actions">
          <button type="button" className="primary" onClick={onGenerate} disabled={!hasCharset}>
            Generate password
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setAnalyzeInput(generated)
              setShowAnalyze(true)
            }}
            disabled={!generated}
          >
            Analyze this password
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="analyzer-title">
        <div className="panel-head">
          <h2 id="analyzer-title">2. Analyzer</h2>
          <span className="badge">Runs entirely on this device</span>
        </div>

        <label className="field">
          Password to check
          <div className="input-wrap">
            <input
              type={showAnalyze ? 'text' : 'password'}
              value={analyzeInput}
              onChange={(event) => setAnalyzeInput(event.target.value)}
              placeholder="Type or paste a password"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="ghost compact" onClick={() => setShowAnalyze((v) => !v)}>
              {showAnalyze ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analysis.score}>
          <div className={meterClass} style={{ width: `${analysis.score}%` }} />
        </div>
        <p className="rating">
          Rating: <strong>{analysis.label}</strong>
          {analysis.entropyBits > 0 ? ` · ~${analysis.entropyBits} bits of entropy` : ''}
        </p>
        <p className="crack">{analysis.crackTime}</p>
        <ul className="tips">
          {analysis.suggestions.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="vault-title">
        <div className="panel-head">
          <h2 id="vault-title">3. Local vault</h2>
          <span className="badge">Saved in this browser</span>
        </div>

        <div className="vault-form">
          <label className="field">
            Title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Work email"
            />
          </label>
          <label className="field">
            Password
            <input
              type="text"
              value={vaultPassword}
              onChange={(event) => setVaultPassword(event.target.value)}
              placeholder="Paste or generate a password"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="button" className="primary" onClick={saveToVault}>
            Save locally
          </button>
        </div>

        <label className="field">
          Find by title
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        {filtered.length === 0 ? (
          <p className="empty">No saved passwords match that title yet.</p>
        ) : (
          <ul className="vault-list">
            {filtered.map((entry) => (
              <li key={entry.id} className="vault-item">
                <div>
                  <p className="vault-title">{entry.title}</p>
                  <code>{revealed[entry.id] ? entry.password : '••••••••••••'}</code>
                </div>
                <div className="vault-actions">
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() =>
                      setRevealed((current) => ({ ...current, [entry.id]: !current[entry.id] }))
                    }
                  >
                    {revealed[entry.id] ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() => copyText(entry.password, 'Copied')}
                  >
                    Copy
                  </button>
                  <button type="button" className="danger compact" onClick={() => removeEntry(entry.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App
