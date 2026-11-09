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
  const [copyLabel, setCopyLabel] = useState('コピー')
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
      setError(err instanceof Error ? err.message : 'パスワードを生成できませんでした。')
    }
  }

  async function copyText(value: string, success = 'コピーしました') {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopyLabel(success)
      window.setTimeout(() => setCopyLabel('コピー'), 1600)
    } catch {
      setError('ブラウザによりクリップボードへのアクセスがブロックされました。')
    }
  }

  function saveToVault() {
    setError('')
    if (!title.trim()) {
      setError('後で探しやすいように、このパスワードにタイトルを付けてください。')
      return
    }
    if (!vaultPassword) {
      setError('保存する前にパスワードを入力または生成してください。')
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
    analysis.label === '非常に強い'
      ? 'meter-fill very-strong'
      : analysis.label === '強い'
        ? 'meter-fill strong'
        : analysis.label === '普通'
          ? 'meter-fill fair'
          : analysis.label === '弱い'
            ? 'meter-fill weak'
            : 'meter-fill very-weak'

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">完全ローカル動作 • データは一切アップロードしません</p>
        <h1>安全なパスワード生成・分析ツール</h1>
        <p className="lede">
          強力なパスワードを生成し、解読にかかる時間を確認して、この端末に保存できます。オフラインでも再起動後も、データはこの端末内に残ります。
        </p>
      </header>

      <section className="panel" aria-labelledby="generator-title">
        <div className="panel-head">
          <h2 id="generator-title">1. パスワード生成</h2>
          <span className="badge">暗号学的乱数</span>
        </div>

        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => toggleOption('uppercase')}
            />
            大文字 (A–Z)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => toggleOption('lowercase')}
            />
            小文字 (a–z)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => toggleOption('numbers')}
            />
            数字 (0–9)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => toggleOption('symbols')}
            />
            記号 (!@#$)
          </label>
        </div>

        <label className="slider-row">
          <span>長さ：{length}</span>
          <input
            type="range"
            min={8}
            max={32}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>

        <div className="output-row">
          <code className="password-out">{generated || 'パスワードを生成するには文字種を選択してください'}</code>
          <button type="button" className="primary" onClick={() => copyText(generated)} disabled={!generated}>
            {copyLabel}
          </button>
        </div>

        <div className="actions">
          <button type="button" className="primary" onClick={onGenerate} disabled={!hasCharset}>
            パスワードを生成
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
            このパスワードを分析
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="analyzer-title">
        <div className="panel-head">
          <h2 id="analyzer-title">2. パスワード分析</h2>
          <span className="badge">完全にこの端末で動作</span>
        </div>

        <label className="field">
          確認するパスワード
          <div className="input-wrap">
            <input
              type={showAnalyze ? 'text' : 'password'}
              value={analyzeInput}
              onChange={(event) => setAnalyzeInput(event.target.value)}
              placeholder="パスワードを入力または貼り付け"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="ghost compact" onClick={() => setShowAnalyze((v) => !v)}>
              {showAnalyze ? '非表示' : '表示'}
            </button>
          </div>
        </label>

        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analysis.score}>
          <div className={meterClass} style={{ width: `${analysis.score}%` }} />
        </div>
        <p className="rating">
          強度評価：<strong>{analysis.label}</strong>
          {analysis.entropyBits > 0 ? ` · 約 ${analysis.entropyBits} ビットのエントロピー` : ''}
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
          <h2 id="vault-title">3. ローカルパスワード保管庫</h2>
          <span className="badge">この端末に保存</span>
        </div>

        <div className="vault-form">
          <label className="field">
            タイトル
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例：仕事用メール"
            />
          </label>
          <label className="field">
            パスワード
            <input
              type="text"
              value={vaultPassword}
              onChange={(event) => setVaultPassword(event.target.value)}
              placeholder="パスワードを貼り付けまたは生成"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="button" className="primary" onClick={saveToVault}>
            ローカルに保存
          </button>
        </div>

        <label className="field">
          タイトルで検索
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="タイトルを検索"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        {filtered.length === 0 ? (
          <p className="empty">そのタイトルに一致する保存済みパスワードはありません。</p>
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
                    {revealed[entry.id] ? '非表示' : '表示'}
                  </button>
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() => copyText(entry.password, 'コピーしました')}
                  >
                    コピー
                  </button>
                  <button type="button" className="danger compact" onClick={() => removeEntry(entry.id)}>
                    削除
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
