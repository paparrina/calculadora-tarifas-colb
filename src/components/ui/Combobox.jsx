import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronsUpDown, Search, X, MapPin, Plane } from 'lucide-react'

/**
 * Combobox / Select con búsqueda predictiva para elegir una LOCALIDAD
 * de origen o destino por su nombre real (ej. "Deià", "Sóller"...).
 * Cada localidad lleva su zona vinculada (usada para el precio); la
 * Zona 0 es siempre el Aeropuerto.
 *
 * Componente accesible y ligero (sin dependencias externas). Soporta:
 *  - Filtrado en vivo por nombre de localidad o número de zona.
 *  - Navegación con teclado (flechas, Enter, Escape).
 *  - Excluir una opción concreta (para evitar origen == destino).
 */
export default function Combobox({
  label,
  icon = 'pin', // 'pin' | 'plane'
  options,
  value,
  onChange,
  excludeId,
  placeholder = 'Buscar localidad…',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = options.filter((o) => o.id !== excludeId)
    if (!q) return base
    return base.filter((o) => o.name.toLowerCase().includes(q) || `zona ${o.zone_number}`.includes(q))
  }, [options, query, excludeId])

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  function selectOption(opt) {
    onChange(opt)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) selectOption(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  const Icon = icon === 'plane' ? Plane : MapPin

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-left shadow-sm transition hover:border-ink/20 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
            value ? 'bg-pine/10 text-pine' : 'bg-ink/5 text-ink-muted'
          }`}
        >
          <Icon size={16} strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          {value ? (
            <>
              <span className="block truncate font-medium text-ink">{value.name}</span>
              <span className="block truncate text-xs text-ink-muted">
                {value.is_airport ? 'Punto de referencia' : `Zona ${value.zone_number} · ${value.zone_name}`}
              </span>
            </>
          ) : (
            <span className="text-ink-muted">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown size={16} className="flex-none text-ink-muted" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <Search size={15} className="flex-none text-ink-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe el nombre de una localidad…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
                <X size={14} className="text-ink-muted hover:text-ink" />
              </button>
            )}
          </div>

          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">No se ha encontrado ninguna localidad.</li>
            )}
            {filtered.map((opt, idx) => (
              <li
                key={opt.id}
                role="option"
                aria-selected={value?.id === opt.id}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectOption(opt)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm transition ${
                  idx === activeIndex ? 'bg-gold-50' : ''
                } ${value?.id === opt.id ? 'font-semibold text-pine' : 'text-ink'}`}
              >
                <span className="truncate">{opt.name}</span>
                {opt.is_airport ? (
                  <span className="flex-none rounded-full bg-pine/10 px-2 py-0.5 text-[11px] text-pine">PMI</span>
                ) : (
                  <span className="flex-none rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                    Zona {opt.zone_number}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
