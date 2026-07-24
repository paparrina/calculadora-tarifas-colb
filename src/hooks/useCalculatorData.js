import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { buildZoneRateMap, buildDisposalRateMap } from '../lib/pricing'

const emptyState = {
  loading: true,
  error: null,
  zones: [],
  vehicleClasses: [],
  zoneRateMap: new Map(),
  disposalRateMap: new Map(),
  vatRate: 10,
}

/**
 * Carga en paralelo todas las tablas necesarias para la calculadora:
 * zonas (Zona 0 = Aeropuerto), clases de vehículo, tarifas base por
 * zona, tarifas de disposición y la configuración general (IVA).
 * Se ejecuta una sola vez al montar la app — el dataset es muy
 * pequeño (9 zonas) y no necesita paginación.
 */
export function useCalculatorData() {
  const [state, setState] = useState(emptyState)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setState({
        ...emptyState,
        loading: false,
        error: 'Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu fichero .env.',
      })
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    try {
      const [zonesRes, vehicleClassesRes, zoneRatesRes, disposalRatesRes, settingsRes] = await Promise.all([
        supabase.from('zones').select('*').eq('active', true).order('zone_number', { ascending: true }),
        supabase.from('vehicle_classes').select('*').order('display_order', { ascending: true }),
        supabase.from('zone_rates').select('*'),
        supabase.from('disposal_rates').select('*'),
        supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
      ])

      const firstError =
        zonesRes.error || vehicleClassesRes.error || zoneRatesRes.error || disposalRatesRes.error || settingsRes.error
      if (firstError) throw firstError

      setState({
        loading: false,
        error: null,
        zones: zonesRes.data ?? [],
        vehicleClasses: vehicleClassesRes.data ?? [],
        zoneRateMap: buildZoneRateMap(zoneRatesRes.data ?? []),
        disposalRateMap: buildDisposalRateMap(disposalRatesRes.data ?? []),
        vatRate: settingsRes.data?.vat_rate ?? 10,
      })
    } catch (err) {
      console.error(err)
      setState((s) => ({ ...s, loading: false, error: err.message || 'No se pudieron cargar las tarifas.' }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
