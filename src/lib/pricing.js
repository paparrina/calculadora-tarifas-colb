/**
 * lib/pricing.js
 * ------------------------------------------------------------------
 * Lógica de negocio pura (sin dependencias de React ni de Supabase)
 * para calcular precios de traslados por ZONA y de disposición por
 * horas. Todas las funciones son puras: reciben los datos ya
 * cargados desde Supabase y devuelven un objeto de resultado con el
 * desglose completo. Fáciles de testear y de reutilizar.
 * ------------------------------------------------------------------
 */

/** Construye un mapa `zoneId:vehicleClassId -> price_base` a partir
 *  de las filas devueltas por la tabla zone_rates. */
export function buildZoneRateMap(zoneRates) {
  const map = new Map()
  for (const r of zoneRates) {
    map.set(`${r.zone_id}:${r.vehicle_class_id}`, Number(r.price_base))
  }
  return map
}

/** Construye un mapa de tarifas de disposición:
 *  `vehicleClassId:hours:isExtra -> price_base`. */
export function buildDisposalRateMap(disposalRates) {
  const map = new Map()
  for (const r of disposalRates) {
    map.set(`${r.vehicle_class_id}:${r.hours}:${r.is_extra_hour}`, Number(r.price_base))
  }
  return map
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Calcula el precio de un TRASLADO entre dos ZONAS.
 *
 * Modelo de zonas numéricas: la Zona 0 es el Aeropuerto y tiene su
 * propio precio base real, exactamente igual que cualquier otra zona
 * (1, 2, 3…) — no hay ningún valor especial ni de referencia.
 *
 * Una única fórmula, sin excepciones — ni para la Zona 0, ni para el
 * caso en que origen y destino sean la MISMA zona:
 *
 *        Precio Base = tramo_más_caro + 50% · tramo_más_barato
 *
 * donde cada "tramo" es el precio base de cada zona implicada. Si
 * origen y destino son la misma zona, ambos tramos valen lo mismo, así
 * que la propia fórmula da automáticamente 1,5× esa tarifa (el tramo
 * completo + el 50% del otro tramo, que es idéntico) — no hace falta
 * ninguna regla aparte, es la misma fórmula general aplicada tal cual.
 *
 * @param {Object} params
 * @param {Object} params.zoneA        - zona de origen {id, name, zone_number, is_airport}
 * @param {Object} params.zoneB        - zona de destino {id, name, zone_number, is_airport}
 * @param {string} params.vehicleClassId
 * @param {Map}    params.rateMap      - mapa generado por buildZoneRateMap
 * @param {number} params.vatRate      - porcentaje de IVA (p.ej. 10)
 */
export function calculateZonePrice({ zoneA, zoneB, vehicleClassId, rateMap, vatRate }) {
  if (!zoneA || !zoneB) {
    return { ok: false, error: 'Selecciona una zona de origen y una zona de destino.' }
  }
  if (!vehicleClassId) {
    return { ok: false, error: 'Selecciona una clase de vehículo.' }
  }

  const priceA = rateMap.get(`${zoneA.id}:${vehicleClassId}`)
  const priceB = rateMap.get(`${zoneB.id}:${vehicleClassId}`)

  if (priceA === undefined || priceB === undefined) {
    return { ok: false, error: 'No existe tarifa registrada para una de las zonas con esta clase de vehículo.' }
  }

  const zoneLabel = (z) => `Zona ${z.zone_number} · ${z.name}`

  const higher = Math.max(priceA, priceB)
  const lower = Math.min(priceA, priceB)
  const priceBase = higher + lower * 0.5

  // El tramo más caro se cobra completo; el más barato, al 50%. El
  // desglose debe reflejar EXACTAMENTE eso (no los precios brutos de
  // cada zona), para que las dos líneas sumen siempre el subtotal.
  const higherZone = priceA >= priceB ? zoneA : zoneB
  const lowerZone = priceA >= priceB ? zoneB : zoneA

  const legs = [
    { label: `${zoneLabel(higherZone)} (tramo completo)`, price: higher },
    { label: `${zoneLabel(lowerZone)} (50% del tramo)`, price: lower * 0.5 },
  ]

  // "breakdown" guarda los valores SIN dividir, para poder mostrar la
  // fórmula literal en la interfaz (ej. "160,00 € + 160,00 € ÷ 2"),
  // no solo el resultado ya calculado.
  const formula = { higher, lower }

  return buildResult({ priceBase, vatRate, mode: 'zone-to-zone', legs, formula })
}

/**
 * Calcula el precio de un servicio de DISPOSICIÓN POR HORAS.
 *
 * - Para 3 a 12 horas, usa la tarifa cerrada de esa franja.
 * - Para más de 12 horas, toma la tarifa de 12h y añade el precio de
 *   "hora extra" multiplicado por las horas adicionales.
 *
 * @param {Object} params
 * @param {string} params.vehicleClassId
 * @param {number} params.hours
 * @param {Map}    params.rateMap  - mapa generado por buildDisposalRateMap
 * @param {number} params.vatRate
 */
export function calculateDisposalPrice({ vehicleClassId, hours, rateMap, vatRate }) {
  if (!vehicleClassId) {
    return { ok: false, error: 'Selecciona una clase de vehículo.' }
  }
  const h = Number(hours)
  if (!Number.isFinite(h) || h < 3) {
    return { ok: false, error: 'La disposición mínima es de 3 horas.' }
  }

  const baseHours = Math.min(h, 12)
  const extraHours = Math.max(h - 12, 0)

  const baseKey = `${vehicleClassId}:${baseHours}:false`
  const basePrice = rateMap.get(baseKey)
  if (basePrice === undefined) {
    return { ok: false, error: 'No existe tarifa registrada para esa franja de horas.' }
  }

  let priceBase = basePrice
  const legs = [{ label: `Disposición ${baseHours} horas`, price: basePrice }]

  if (extraHours > 0) {
    const extraKey = `${vehicleClassId}:0:true`
    const extraPrice = rateMap.get(extraKey)
    if (extraPrice === undefined) {
      return { ok: false, error: 'No existe tarifa de hora extra registrada para esta clase de vehículo.' }
    }
    const extraTotal = extraPrice * extraHours
    priceBase += extraTotal
    legs.push({ label: `${extraHours} hora(s) extra × ${extraPrice.toFixed(2)} €`, price: extraTotal })
  }

  return buildResult({ priceBase, vatRate, mode: extraHours > 0 ? 'extended' : 'standard', legs })
}

function buildResult({ priceBase, vatRate, mode, legs, formula }) {
  const base = round2(priceBase)
  const vatAmount = round2(base * (vatRate / 100))
  const total = round2(base + vatAmount)
  return { ok: true, priceBase: base, vatRate, vatAmount, total, mode, legs, formula }
}

/**
 * Combina varios resultados de calculateZonePrice (uno por trayecto)
 * en un único presupuesto: suma los subtotales de los trayectos
 * válidos y aplica el IVA una sola vez sobre esa suma — igual que una
 * factura con varias líneas.
 *
 * @param {Array<{ok:boolean, priceBase?:number}>} results
 * @param {number} vatRate
 */
export function summarizeTrips(results, vatRate) {
  const okResults = results.filter((r) => r && r.ok)
  const priceBase = round2(okResults.reduce((sum, r) => sum + r.priceBase, 0))
  const vatAmount = round2(priceBase * (vatRate / 100))
  const total = round2(priceBase + vatAmount)
  return { count: okResults.length, priceBase, vatRate, vatAmount, total }
}

export function formatEUR(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

/**
 * Da formato de texto a la fórmula aplicada en un resultado de
 * calculateZonePrice, con los números reales — p. ej.
 * "160,00 € + 160,00 € ÷ 2 = 240,00 €" — para mostrar la norma de
 * cálculo, no solo el resultado ya hecho.
 */
export function formatZoneFormula(result) {
  if (!result?.ok || !result.formula) return null
  const { higher, lower } = result.formula
  return `${formatEUR(higher)} + ${formatEUR(lower)} ÷ 2 = ${formatEUR(result.priceBase)}`
}

export { round2 }
