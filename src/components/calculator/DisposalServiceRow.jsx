import { Clock, Minus, Plus, X } from 'lucide-react'
import { formatEUR } from '../../lib/pricing'

const MIN_HOURS = 3
const MAX_HOURS = 24

/**
 * Una fila de servicio de disposición por horas, dentro de la
 * calculadora multi-servicio: duración, clase de vehículo, referencia
 * y opción de hora extra. Se repite tantas veces como servicios haya
 * en el presupuesto (botón "+ Añadir servicio").
 */
export default function DisposalServiceRow({ service, index, vehicleClasses, onChange, onRemove, canRemove }) {
  function updateHours(next) {
    onChange({ hours: Math.min(MAX_HOURS, Math.max(MIN_HOURS, next)) })
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Servicio {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar servicio ${index + 1}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted transition hover:bg-rust/10 hover:text-rust"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mb-3">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Nº de servicio / colaborador
        </span>
        <input
          type="text"
          value={service.serviceRef || ''}
          onChange={(e) => onChange({ serviceRef: e.target.value })}
          placeholder="Ej. 4521 · Nombre del colaborador"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-gold"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Duración del servicio
        </span>
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink/5 text-ink-muted">
            <Clock size={14} />
          </span>
          <button
            type="button"
            onClick={() => updateHours(service.hours - 1)}
            disabled={service.hours <= MIN_HOURS}
            aria-label="Restar una hora"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <Minus size={13} />
          </button>
          <div className="flex-1 text-center">
            <span className="font-mono text-xl font-semibold text-ink">{service.hours}</span>
            <span className="ml-1 text-sm text-ink-muted">horas</span>
          </div>
          <button
            type="button"
            onClick={() => updateHours(service.hours + 1)}
            disabled={service.hours >= MAX_HOURS}
            aria-label="Sumar una hora"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Clase de vehículo
        </span>
        <select
          value={service.vehicleClassId ?? ''}
          onChange={(e) => onChange({ vehicleClassId: e.target.value })}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-gold"
        >
          {vehicleClasses.map((vc) => (
            <option key={vc.id} value={vc.id}>
              {vc.name} · hasta {vc.max_pax} pax
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
        <label className="flex flex-1 items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={service.hasExtraHour}
            onChange={(e) => onChange({ hasExtraHour: e.target.checked })}
            className="h-4 w-4 flex-none accent-gold"
          />
          ¿Hay hora extra a facturar aparte?
        </label>
        {service.hasExtraHour && (
          <div className="flex flex-none items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ extraHours: Math.max(1, (service.extraHours || 1) - 1) })}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold"
              aria-label="Restar una hora extra"
            >
              −
            </button>
            <span className="w-6 text-center font-mono text-sm">{service.extraHours || 1}</span>
            <button
              type="button"
              onClick={() => onChange({ extraHours: (service.extraHours || 1) + 1 })}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold"
              aria-label="Sumar una hora extra"
            >
              +
            </button>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">
        Para horas ya incluidas al superar las 12h no hace falta marcar esto — ya se calculan solas.
      </p>

      {service.result && (
        <div className="mt-3 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
          {service.result.ok ? (
            <>
              {service.hasExtraHour &&
                (() => {
                  const extraLeg = service.result.legs.find((l) => l.label.includes('hora(s) extra'))
                  return extraLeg ? (
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-ink-muted">
                      <span>{extraLeg.label}</span>
                      <span className="font-mono">{formatEUR(extraLeg.price)}</span>
                    </div>
                  ) : null
                })()}
              <div className="flex items-center justify-between border-t border-line/70 pt-1.5">
                <span className="text-ink-muted">Total servicio (con IVA)</span>
                <span className="font-mono font-semibold text-ink">{formatEUR(service.result.total)}</span>
              </div>
            </>
          ) : (
            <span className="font-medium text-rust">{service.result.error}</span>
          )}
        </div>
      )}
    </div>
  )
}
