import { useState } from 'react'
import { Clock, Minus, Plus, Car } from 'lucide-react'
import { Button, Spinner } from '../ui/Primitives'
import VehicleClassSelector from './VehicleClassSelector'
import ResultTicket from './ResultTicket'
import { calculateDisposalPrice } from '../../lib/pricing'

const MIN_HOURS = 3
const MAX_HOURS = 24

export default function DisposalCalculator({ vehicleClasses, disposalRateMap, vatRate }) {
  const [vehicleClassId, setVehicleClassId] = useState(vehicleClasses[0]?.id ?? null)
  const [hours, setHours] = useState(3)
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState(null)

  const vehicleClass = vehicleClasses.find((v) => v.id === vehicleClassId)

  function updateHours(next) {
    setHours(Math.min(MAX_HOURS, Math.max(MIN_HOURS, next)))
    setResult(null)
  }

  function handleCalculate() {
    setCalculating(true)
    setResult(null)
    setTimeout(() => {
      const r = calculateDisposalPrice({ vehicleClassId, hours, rateMap: disposalRateMap, vatRate })
      setResult(r)
      setCalculating(false)
    }, 380)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="min-w-0 space-y-6">
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Duración del servicio
          </span>
          <div className="flex items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink/5 text-ink-muted">
              <Clock size={16} />
            </span>
            <button
              type="button"
              onClick={() => updateHours(hours - 1)}
              disabled={hours <= MIN_HOURS}
              aria-label="Restar una hora"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold disabled:opacity-30"
            >
              <Minus size={14} />
            </button>
            <div className="flex-1 text-center">
              <span className="font-mono text-2xl font-semibold text-ink">{hours}</span>
              <span className="ml-1 text-sm text-ink-muted">horas</span>
            </div>
            <button
              type="button"
              onClick={() => updateHours(hours + 1)}
              disabled={hours >= MAX_HOURS}
              aria-label="Sumar una hora"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line text-ink transition hover:border-gold hover:text-gold disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Disposición mínima de 3 horas. A partir de la hora 12 se aplica el precio de hora extra.
          </p>
        </div>

        <VehicleClassSelector
          vehicleClasses={vehicleClasses}
          value={vehicleClassId}
          onChange={(id) => {
            setVehicleClassId(id)
            setResult(null)
          }}
        />

        <Button variant="gold" className="w-full" disabled={!vehicleClassId || calculating} onClick={handleCalculate}>
          {calculating ? <Spinner size={16} className="text-white" /> : <Car size={16} />}
          {calculating ? 'Calculando…' : 'Calcular tarifa'}
        </Button>
      </div>

      <ResultTicket
        title={`Disposición · ${hours} horas`}
        subtitle="Servicio de chófer por horas"
        vehicleClassName={vehicleClass?.name}
        result={result}
        emptyHint="Elige la duración y la clase de vehículo para ver el presupuesto con IVA desglosado."
      />
    </div>
  )
}
