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
  const [copyLabel, setCopyLabel] = useState('複製')
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
      setError(err instanceof Error ? err.message : '無法生成密碼。')
    }
  }

  async function copyText(value: string, success = '已複製') {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopyLabel(success)
      window.setTimeout(() => setCopyLabel('複製'), 1600)
    } catch {
      setError('剪貼簿存取被瀏覽器封鎖。')
    }
  }

  function saveToVault() {
    setError('')
    if (!title.trim()) {
      setError('請為這個密碼填寫標題，方便以後查找。')
      return
    }
    if (!vaultPassword) {
      setError('儲存前請輸入或生成密碼。')
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
    analysis.label === '非常強'
      ? 'meter-fill very-strong'
      : analysis.label === '強'
        ? 'meter-fill strong'
        : analysis.label === '一般'
          ? 'meter-fill fair'
          : analysis.label === '弱'
            ? 'meter-fill weak'
            : 'meter-fill very-weak'

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">僅本機執行 • 不會上傳任何資料</p>
        <h1>安全密碼產生器與分析器</h1>
        <p className="lede">
          生成高強度密碼、檢查其被破解所需的時間，並將其儲存在本機。即使離線或重啟後，資料也只會留在你的裝置上。
        </p>
      </header>

      <section className="panel" aria-labelledby="generator-title">
        <div className="panel-head">
          <h2 id="generator-title">1. 密碼產生器</h2>
          <span className="badge">加密級隨機</span>
        </div>

        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => toggleOption('uppercase')}
            />
            大寫字母 (A–Z)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => toggleOption('lowercase')}
            />
            小寫字母 (a–z)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => toggleOption('numbers')}
            />
            數字 (0–9)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => toggleOption('symbols')}
            />
            符號 (!@#$)
          </label>
        </div>

        <label className="slider-row">
          <span>長度：{length}</span>
          <input
            type="range"
            min={8}
            max={32}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>

        <div className="output-row">
          <code className="password-out">{generated || '請選擇字元類型以生成密碼'}</code>
          <button type="button" className="primary" onClick={() => copyText(generated)} disabled={!generated}>
            {copyLabel}
          </button>
        </div>

        <div className="actions">
          <button type="button" className="primary" onClick={onGenerate} disabled={!hasCharset}>
            生成密碼
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
            分析此密碼
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="analyzer-title">
        <div className="panel-head">
          <h2 id="analyzer-title">2. 密碼分析器</h2>
          <span className="badge">完全在本機執行</span>
        </div>

        <label className="field">
          要檢查的密碼
          <div className="input-wrap">
            <input
              type={showAnalyze ? 'text' : 'password'}
              value={analyzeInput}
              onChange={(event) => setAnalyzeInput(event.target.value)}
              placeholder="輸入或貼上密碼"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="ghost compact" onClick={() => setShowAnalyze((v) => !v)}>
              {showAnalyze ? '隱藏' : '顯示'}
            </button>
          </div>
        </label>

        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analysis.score}>
          <div className={meterClass} style={{ width: `${analysis.score}%` }} />
        </div>
        <p className="rating">
          強度評級：<strong>{analysis.label}</strong>
          {analysis.entropyBits > 0 ? ` · 約 ${analysis.entropyBits} 位元熵` : ''}
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
          <h2 id="vault-title">3. 本機密碼庫</h2>
          <span className="badge">儲存在本機</span>
        </div>

        <div className="vault-form">
          <label className="field">
            標題
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：工作信箱"
            />
          </label>
          <label className="field">
            密碼
            <input
              type="text"
              value={vaultPassword}
              onChange={(event) => setVaultPassword(event.target.value)}
              placeholder="貼上或生成密碼"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="button" className="primary" onClick={saveToVault}>
            本機儲存
          </button>
        </div>

        <label className="field">
          按標題查找
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋標題"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        {filtered.length === 0 ? (
          <p className="empty">尚無符合該標題的已儲存密碼。</p>
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
                    {revealed[entry.id] ? '隱藏' : '顯示'}
                  </button>
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() => copyText(entry.password, '已複製')}
                  >
                    複製
                  </button>
                  <button type="button" className="danger compact" onClick={() => removeEntry(entry.id)}>
                    刪除
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
