import { useState } from 'react'
import { ShieldAlert, RefreshCcw } from 'lucide-react'
import { useAdminRates } from '../../hooks/useAdminRates'
import { Card, Spinner, Tabs, ZoneBadge } from '../ui/Primitives'
import EditablePrice from './EditablePrice'

export default function RatesAdmin() {
  const { zoneRows, disposalRows, loading, error, reload, updateZonePrice, updateDisposalPrice } = useAdminRates()
  const [table, setTable] = useState('zones')

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
