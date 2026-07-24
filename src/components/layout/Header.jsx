import { Sparkles, Settings2, Calculator } from 'lucide-react'

export default function Header({ view, onViewChange }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Sparkles size={17} strokeWidth={2.25} />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold tracking-wide">TRANSFER CLASS</p>
            <p className="text-[11px] text-white/50">Calculadora de tarifas · Proveedores 2026</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
          <button
            onClick={() => onViewChange('calculator')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              view === 'calculator' ? 'bg-white text-ink' : 'text-white/60 hover:text-white'
            }`}
          >
            <Calculator size={14} />
            <span className="hidden sm:inline">Calculadora</span>
          </button>
          <button
            onClick={() => onViewChange('admin')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              view === 'admin' ? 'bg-white text-ink' : 'text-white/60 hover:text-white'
            }`}
          >
            <Settings2 size={14} />
            <span className="hidden sm:inline">Gestión</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
