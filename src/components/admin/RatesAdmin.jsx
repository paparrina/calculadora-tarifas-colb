import { useState } from 'react'
import { ShieldAlert, RefreshCcw, Lock } from 'lucide-react'
import { useAdminRates } from '../../hooks/useAdminRates'
import { Card, Spinner, Tabs, ZoneBadge } from '../ui/Primitives'
import EditablePrice from './EditablePrice'

const ADMIN_PASSWORD = '2026'

export default function RatesAdmin() {
  const { zoneRows, disposalRows, loading, error, reload, updateZonePrice, updateDisposalPrice } = useAdminRates()
  const [table, setTable] = useState('zones')
  const [unlocked, setUnlocked] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  function handleUnlock(e) {
    e.preventDefault()
    if (pwInput === ADMIN_PASSWORD) {
      setUnlocked(true)
      setPwError(false)
      setPwInput('')
    } else {
      setPwError(true)
    }
  }

  // El candado protege TODO el panel de Gestión (Zonas y Disposición),
  // antes incluso de mostrar las pestañas. Solo es una barrera de
  // interfaz: la seguridad real de escritura la da la política RLS de
  // Supabase (auth.role() = 'authenticated'), no esta contraseña.
  if (!unlocked) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <Lock size={18} />
        </div>
        <p className="text-sm font-medium text-ink">La Gestión de tarifas está protegida.</p>
        <p className="max-w-[320px] text-xs text-ink-muted">Introduce la contraseña para acceder.</p>
        <form onSubmit={handleUnlock} className="mt-1 flex w-full max-w-[260px] flex-col gap-2">
          <input
            type="password"
            value={pwInput}
            onChange={(e) => {
              setPwInput(e.target.value)
              setPwError(false)
            }}
            placeholder="Contraseña"
            autoFocus
            className={`rounded-xl border px-3 py-2.5 text-center text-sm outline-none transition ${
              pwError ? 'border-rust focus:border-rust' : 'border-line focus:border-gold'
            }`}
          />
          {pwError && <p className="text-xs font-medium text-rust">Contraseña incorrecta.</p>}
          <button
            type="submit"
            className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gold-600"
          >
            Desbloquear
          </button>
        </form>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gold/30 bg-gold-50 px-4 py-3 text-sm text-gold-700">
        <div className="flex items-start gap-2.5">
          <ShieldAlert size={16} className="mt-0.5 flex-none" />
          <p>
            Los cambios se guardan directamente en Supabase al salir del campo (o pulsando Enter). Todas las zonas,
            incluida la <strong>Zona 0 (Aeropuerto)</strong>, se editan exactamente igual: la fórmula "tramo más caro
            + 50% del más barato" se aplica siempre entre las dos zonas elegidas, sin excepciones. En producción,
            restringe el acceso a esta vista con Supabase Auth (ver <code className="font-mono">01_schema.sql</code>
            ).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { id: 'zones', label: 'Tarifas por zona' },
            { id: 'disposal', label: 'Disposición por horas' },
          ]}
          active={table}
          onChange={setTable}
        />
        <button
          onClick={reload}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-muted transition hover:border-ink/30 hover:text-ink"
        >
          <RefreshCcw size={13} /> Recargar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-ink-muted">
          <Spinner /> Cargando tarifas…
        </div>
      ) : error ? (
        <p className="text-sm font-medium text-rust">{error}</p>
      ) : table === 'zones' ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-ink-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-left font-semibold">Zona</th>
                <th className="px-4 py-2.5 text-left font-semibold">Vehículo</th>
                <th className="px-4 py-2.5 text-right font-semibold">Precio base (sin IVA)</th>
              </tr>
            </thead>
            <tbody>
              {zoneRows.map((row) => (
                <tr key={row.id} className="border-b border-line/70 last:border-0 hover:bg-ink/[0.02]">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <ZoneBadge zone={row.zone?.zone_number} />
                      <span className="font-medium text-ink">
                        Zona {row.zone?.zone_number} · {row.zone?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{row.vehicle_class?.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end">
                      <EditablePrice value={row.price_base} onSave={(v) => updateZonePrice(row.id, v)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-ink-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-left font-semibold">Franja</th>
                <th className="px-4 py-2.5 text-left font-semibold">Vehículo</th>
                <th className="px-4 py-2.5 text-right font-semibold">Precio (sin IVA)</th>
              </tr>
            </thead>
            <tbody>
              {disposalRows.map((row) => (
                <tr key={row.id} className="border-b border-line/70 last:border-0 hover:bg-ink/[0.02]">
                  <td className="px-4 py-2 font-medium text-ink">
                    {row.is_extra_hour ? 'Hora extra' : `${row.hours} horas`}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{row.vehicle_class?.name}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end">
                      <EditablePrice value={row.price_base} onSave={(v) => updateDisposalPrice(row.id, v)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
