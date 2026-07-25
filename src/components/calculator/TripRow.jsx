import { ArrowLeftRight, X } from 'lucide-react'
import Combobox from '../ui/Combobox'
import { formatEUR, formatZoneFormula } from '../../lib/pricing'

/**
 * Una fila de trayecto dentro de la calculadora multi-trayecto:
 * zona de origen, zona de destino, clase de vehículo, y el resultado
 * de ESE trayecto en cuanto se calcula. Se repite tantas veces como
 * trayectos tenga el presupuesto (botón "+ Añadir trayecto").
 */
export default function TripRow({ trip, index, zones, vehicleClasses, onChange, onRemove, canRemove }) {
  function handleSwap() {
    onChange({ origin: trip.destination, destination: trip.origin })
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Trayecto {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar trayecto ${index + 1}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted transition hover:bg-rust/10 hover:text-rust"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <Combobox
          label="Zona de origen"
          icon="plane"
          options={zones}
          value={trip.origin}
          onChange={(v) => onChange({ origin: v })}
          placeholder="Zona 0 · Aeropuerto, Zona 1…"
        />
        <button
          type="button"
          onClick={handleSwap}
          disabled={!trip.origin && !trip.destination}
          aria-label="Invertir origen y destino"
          className="mx-auto flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition hover:border-gold hover:text-gold disabled:opacity-40 sm:mb-0"
        >
          <ArrowLeftRight size={16} />
        </button>
        <Combobox
          label="Zona de destino"
          icon="pin"
          options={zones}
          value={trip.destination}
          onChange={(v) => onChange({ destination: v })}
          placeholder="Zona 0 · Aeropuerto, Zona 1…"
        />
      </div>

      <div className="mt-3">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Clase de vehículo
        </span>
        <select
          value={trip.vehicleClassId ?? ''}
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
            checked={trip.hasExtraHour}
            onChange={(e) => onChange({ hasExtraHour: e.target.checked })}
            className="h-4 w-4 flex-none accent-gold"
          />
          ¿Hubo hora extra en este servicio?
        </label>
        {trip.hasExtraHour && (
          <div className="flex flex-none items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ extraHours: Math.max(1, (trip.extraHours || 1) - 1) })}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold"
              aria-label="Restar una hora extra"
            >
              −
            </button>
            <span className="w-6 text-center font-mono text-sm">{trip.extraHours || 1}</span>
            <button
              type="button"
              onClick={() => onChange({ extraHours: (trip.extraHours || 1) + 1 })}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold"
              aria-label="Sumar una hora extra"
            >
              +
            </button>
          </div>
        )}
      </div>

      {trip.result && (
        <div className="mt-3 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
          {trip.result.ok ? (
            <>
              {formatZoneFormula(trip.result) && (
                <div className="mb-1 flex items-center justify-between gap-2 font-mono text-xs text-ink-muted">
                  <span>Norma aplicada</span>
                  <span>{formatZoneFormula(trip.result)}</span>
                </div>
              )}
              {trip.hasExtraHour &&
                (() => {
                  const extraLeg = trip.result.legs.find((l) => l.label.includes('hora(s) extra'))
                  return extraLeg ? (
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-ink-muted">
                      <span>{extraLeg.label}</span>
                      <span className="font-mono">{formatEUR(extraLeg.price)}</span>
                    </div>
                  ) : null
                })()}
              <div className="flex items-center justify-between border-t border-line/70 pt-1.5">
                <span className="text-ink-muted">Total trayecto (con IVA)</span>
                <span className="font-mono font-semibold text-ink">{formatEUR(trip.result.total)}</span>
              </div>
            </>
          ) : (
            <span className="font-medium text-rust">{trip.result.error}</span>
          )}
        </div>
      )}
    </div>
  )
}
