import { Loader2 } from 'lucide-react'

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary: 'bg-ink text-white hover:bg-ink-soft shadow-pop',
    gold: 'bg-gold text-white hover:bg-gold-600 shadow-pop',
    outline: 'border border-line bg-surface text-ink hover:border-ink/30',
    ghost: 'text-ink-muted hover:bg-ink/5 hover:text-ink',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-ink/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            active === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function ZoneBadge({ zone }) {
  return (
    <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold/10 font-mono text-[11px] font-semibold text-gold-700">
      {zone}
    </span>
  )
}
