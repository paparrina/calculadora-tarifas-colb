import { useState } from 'react'
import { Plus, Car } from 'lucide-react'
import { Button, Spinner } from '../ui/Primitives'
import DisposalServiceRow from './DisposalServiceRow'
import MultiDisposalTicket from './MultiDisposalTicket'
import { calculateDisposalPrice, getExtraHourRate, addExtraHourCharge, summarizeTrips } from '../../lib/pricing'

let serviceCounter = 0
function newServiceId() {
  serviceCounter += 1
  return `disp-${Date.now()}-${serviceCounter}`
}

function emptyService(defaultVehicleClassId) {
  return {
    id: newServiceId(),
    hours: 3,
    vehicleClassId: defaultVehicleClassId,
    serviceRef: '',
    hasExtraHour: false,
    extraHours: 1,
    result: null,
  }
}

export default function DisposalCalculator({ vehicleClasses, disposalRateMap, vatRate }) {
  const defaultVehicleClassId = vehicleClasses[0]?.id ?? null
  const [services, setServices] = useState(() => [emptyService(defaultVehicleClassId)])
  const [calculating, setCalculating] = useState(false)

  function updateService(id, patch) {
    setServices((rows) => rows.map((s) => (s.id === id ? { ...s, ...patch, result: null } : s)))
  }

  function addService() {
    const last = services[services.length - 1]
    setServices((rows) => [...rows, emptyService(last?.vehicleClassId ?? defaultVehicleClassId)])
  }

  function removeService(id) {
    setServices((rows) => rows.filter((s) => s.id !== id))
  }

  function handleCalculateAll() {
    setCalculating(true)
    setTimeout(() => {
      setServices((rows) =>
        rows.map((s) => {
          const base = calculateDisposalPrice({
            vehicleClassId: s.vehicleClassId,
            hours: s.hours,
            rateMap: disposalRateMap,
            vatRate,
          })
          const extraRate = getExtraHourRate(disposalRateMap, s.vehicleClassId)
          const result = s.hasExtraHour ? addExtraHourCharge(base, s.extraHours, extraRate, vatRate) : base
          return { ...s, result }
        })
      )
      setCalculating(false)
    }, 380)
  }

  const summary = summarizeTrips(
    services.map((s) => s.result),
    vatRate
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="min-w-0 space-y-4">
        {services.map((service, i) => (
          <DisposalServiceRow
            key={service.id}
            service={service}
            index={i}
            vehicleClasses={vehicleClasses}
            canRemove={services.length > 1}
            onChange={(patch) => updateService(service.id, patch)}
            onRemove={() => removeService(service.id)}
          />
        ))}

        <button
          type="button"
          onClick={addService}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-semibold text-ink-muted transition hover:border-gold hover:text-gold"
        >
          <Plus size={16} />
          Añadir servicio
        </button>

        <Button variant="gold" className="w-full" disabled={calculating} onClick={handleCalculateAll}>
          {calculating ? <Spinner size={16} className="text-white" /> : <Car size={16} />}
          {calculating ? 'Calculando…' : services.length > 1 ? 'Calcular todos' : 'Calcular tarifa'}
        </Button>
      </div>

      <MultiDisposalTicket services={services} summary={summary} />
    </div>
  )
}
