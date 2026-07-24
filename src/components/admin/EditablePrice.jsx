import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

export default function EditablePrice({ value, onSave }) {
  const [draft, setDraft] = useState(String(value))
  const [status, setStatus] = useState('idle') // idle | saving | saved | error

  async function commit() {
    const num = Number(draft.replace(',', '.'))
    if (!Number.isFinite(num) || num < 0) {
      setDraft(String(value))
      return
    }
    if (num === Number(value)) return
    setStatus('saving')
    try {
      await onSave(num)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1200)
    } catch {
      setStatus('error')
      setDraft(String(value))
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center rounded-lg border border-line bg-surface px-2 py-1 focus-within:border-gold">
        <span className="text-xs text-ink-muted">€</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          inputMode="decimal"
          className="w-16 bg-transparent px-1 py-0.5 text-right font-mono text-sm text-ink outline-none"
        />
      </div>
      <span className="w-4 flex-none">
        {status === 'saving' && <Loader2 size={13} className="animate-spin text-ink-muted" />}
        {status === 'saved' && <Check size={13} className="text-pine" />}
      </span>
    </div>
  )
}
