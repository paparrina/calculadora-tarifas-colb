import { useState } from 'react'
import { Plus, Car } from 'lucide-react'
import { Button, Spinner } from '../ui/Primitives'
import TripRow from './TripRow'
import MultiTripTicket from './MultiTripTicket'
import { calculateZonePrice, summarizeTrips, getExtraHourRate, addExtraHourCharge } from '../../lib/pricing'

let tripCounter = 0
function newTripId() {
  tripCounter += 1
  return `trip-${Date.now()}-${tripCounter}`
}

function emptyTrip(defaultVehicleClassId) {
  return {
    id: newTripId(),
    origin: null,
    destination: null,
    vehicleClassId: defaultVehicleClassId,
    serviceRef: '',
    hasExtraHour: false,
    extraHours: 1,
    result: null,
  }
}

function toZoneRef(location) {
  if (!location) return null
  // El precio se busca por zone_id (location.zone_id), pero el nombre
  // que se muestra es el de la localidad concreta que ha buscado el
  // usuario (ej. "Deià"), no el nombre genérico de la zona.
  return { id: location.zone_id, name: location.name, zone_number: location.zone_number, is_airport: location.is_airport }
}

export default function TransferCalculator({ locations, vehicleClasses, zoneRateMap, disposalRateMap, vatRate }) {
  const defaultVehicleClassId = vehicleClasses[0]?.id ?? null
  const [trips, setTrips] = useState(() => [emptyTrip(defaultVehicleClassId)])
  const [calculating, setCalculating] = useState(false)

  const canCalculate = trips.every((t) => t.origin && t.destination && t.vehicleClassId)

  function updateTrip(id, patch) {
    setTrips((rows) => rows.map((t) => (t.id === id ? { ...t, ...patch, result: null } : t)))
  }

  function addTrip() {
    const last = trips[trips.length - 1]
    setTrips((rows) => [...rows, emptyTrip(last?.vehicleClassId ?? defaultVehicleClassId)])
  }

  function removeTrip(id) {
    setTrips((rows) => rows.filter((t) => t.id !== id))
  }

  function handleCalculateAll() {
    setCalculating(true)
    // Pequeña latencia deliberada: da feedback de "trabajo" real al
    // pulsar calcular, aunque la operación en sí sea instantánea.
    setTimeout(() => {
      setTrips((rows) =>
        rows.map((t) => {
          const base = calculateZonePrice({
            zoneA: toZoneRef(t.origin),
            zoneB: toZoneRef(t.destination),
            vehicleClassId: t.vehicleClassId,
            rateMap: zoneRateMap,
            vatRate,
          })
          const extraRate = getExtraHourRate(disposalRateMap, t.vehicleClassId)
          const result = t.hasExtraHour ? addExtraHourCharge(base, t.extraHours, extraRate, vatRate) : base
          return { ...t, result }
        })
      )
      setCalculating(false)
    }, 380)
  }

  const summary = summarizeTrips(
    trips.map((t) => t.result),
    vatRate
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="min-w-0 space-y-4">
        {trips.map((trip, i) => (
          <TripRow
            key={trip.id}
            trip={trip}
            index={i}
            locations={locations}
            vehicleClasses={vehicleClasses}
            canRemove={trips.length > 1}
            onChange={(patch) => updateTrip(trip.id, patch)}
            onRemove={() => removeTrip(trip.id)}
          />
        ))}

        <button
          type="button"
          onClick={addTrip}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-semibold text-ink-muted transition hover:border-gold hover:text-gold"
        >
          <Plus size={16} />
          Añadir servicio
        </button>

        <Button variant="gold" className="w-full" disabled={!canCalculate || calculating} onClick={handleCalculateAll}>
          {calculating ? <Spinner size={16} className="text-white" /> : <Car size={16} />}
          {calculating ? 'Calculando…' : trips.length > 1 ? 'Calcular todos' : 'Calcular tarifa'}
        </Button>
        {!canCalculate && (
          <p className="text-xs text-ink-muted">Completa origen, destino y vehículo en todos los trayectos.</p>
        )}
      </div>

      <MultiTripTicket trips={trips} summary={summary} />
    </div>
  )
}
