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
  const [copyLabel, setCopyLabel] = useState('复制')
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
      setError(err instanceof Error ? err.message : '无法生成密码。')
    }
  }

  async function copyText(value: string, success = '已复制') {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopyLabel(success)
      window.setTimeout(() => setCopyLabel('复制'), 1600)
    } catch {
      setError('剪贴板访问被浏览器阻止。')
    }
  }

  function saveToVault() {
    setError('')
    if (!title.trim()) {
      setError('请为这个密码填写标题，方便以后查找。')
      return
    }
    if (!vaultPassword) {
      setError('保存前请输入或生成密码。')
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
    analysis.label === '非常强'
      ? 'meter-fill very-strong'
      : analysis.label === '强'
        ? 'meter-fill strong'
        : analysis.label === '一般'
          ? 'meter-fill fair'
          : analysis.label === '弱'
            ? 'meter-fill weak'
            : 'meter-fill very-weak'

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">仅本地运行 • 不会上传任何数据</p>
        <h1>安全密码生成器与分析器</h1>
        <p className="lede">
          生成高强度密码、检查其被破解所需的时间，并将其保存在本机。即使离线或重启后，数据也只会留在你的设备上。
        </p>
      </header>

      <section className="panel" aria-labelledby="generator-title">
        <div className="panel-head">
          <h2 id="generator-title">1. 密码生成器</h2>
          <span className="badge">加密级随机</span>
        </div>

        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => toggleOption('uppercase')}
            />
            大写字母 (A–Z)
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => toggleOption('lowercase')}
            />
            小写字母 (a–z)
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
            符号 (!@#$)
          </label>
        </div>

        <label className="slider-row">
          <span>长度：{length}</span>
          <input
            type="range"
            min={8}
            max={32}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>

        <div className="output-row">
          <code className="password-out">{generated || '请选择字符类型以生成密码'}</code>
          <button type="button" className="primary" onClick={() => copyText(generated)} disabled={!generated}>
            {copyLabel}
          </button>
        </div>

        <div className="actions">
          <button type="button" className="primary" onClick={onGenerate} disabled={!hasCharset}>
            生成密码
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
            分析此密码
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="analyzer-title">
        <div className="panel-head">
          <h2 id="analyzer-title">2. 密码分析器</h2>
          <span className="badge">完全在本机运行</span>
        </div>

        <label className="field">
          要检查的密码
          <div className="input-wrap">
            <input
              type={showAnalyze ? 'text' : 'password'}
              value={analyzeInput}
              onChange={(event) => setAnalyzeInput(event.target.value)}
              placeholder="输入或粘贴密码"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="ghost compact" onClick={() => setShowAnalyze((v) => !v)}>
              {showAnalyze ? '隐藏' : '显示'}
            </button>
          </div>
        </label>

        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analysis.score}>
          <div className={meterClass} style={{ width: `${analysis.score}%` }} />
        </div>
        <p className="rating">
          强度评级：<strong>{analysis.label}</strong>
          {analysis.entropyBits > 0 ? ` · 约 ${analysis.entropyBits} 位熵` : ''}
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
          <h2 id="vault-title">3. 本地密码库</h2>
          <span className="badge">保存在本机</span>
        </div>

        <div className="vault-form">
          <label className="field">
            标题
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：工作邮箱"
            />
          </label>
          <label className="field">
            密码
            <input
              type="text"
              value={vaultPassword}
              onChange={(event) => setVaultPassword(event.target.value)}
              placeholder="粘贴或生成密码"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="button" className="primary" onClick={saveToVault}>
            本地保存
          </button>
        </div>

        <label className="field">
          按标题查找
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        {filtered.length === 0 ? (
          <p className="empty">暂无匹配该标题的已保存密码。</p>
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
                    {revealed[entry.id] ? '隐藏' : '显示'}
                  </button>
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() => copyText(entry.password, '已复制')}
                  >
                    复制
                  </button>
                  <button type="button" className="danger compact" onClick={() => removeEntry(entry.id)}>
                    删除
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
