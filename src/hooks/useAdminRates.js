import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

/**
 * Hook independiente para el panel de Gestión: trae las tarifas ya
 * "aplanadas" (join con zona / clase de vehículo) para poder
 * editarlas fila a fila, y expone funciones de actualización que
 * escriben directamente en Supabase.
 */
export function useAdminRates() {
  const [zoneRows, setZoneRows] = useState([])
  const [disposalRows, setDisposalRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('Supabase no está configurado.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [zoneRes, disposalRes] = await Promise.all([
        supabase
          .from('zone_rates')
          .select('id, price_base, zone:zones(id,zone_number,name,is_airport), vehicle_class:vehicle_classes(id,code,name,display_order)')
          .order('zone(zone_number)', { ascending: true }),
        supabase
          .from('disposal_rates')
          .select('id, hours, is_extra_hour, price_base, vehicle_class:vehicle_classes(id,code,name,display_order)')
          .order('hours', { ascending: true }),
      ])
      if (zoneRes.error) throw zoneRes.error
      if (disposalRes.error) throw disposalRes.error

      const sortedZones = [...(zoneRes.data ?? [])].sort(
        (a, b) => (a.vehicle_class?.display_order ?? 0) - (b.vehicle_class?.display_order ?? 0)
      )
      const sortedDisposal = [...(disposalRes.data ?? [])].sort((a, b) => {
        if (a.is_extra_hour !== b.is_extra_hour) return a.is_extra_hour ? 1 : -1
        return (a.vehicle_class?.display_order ?? 0) - (b.vehicle_class?.display_order ?? 0)
      })

      setZoneRows(sortedZones)
      setDisposalRows(sortedDisposal)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudieron cargar las tarifas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function updateZonePrice(id, price) {
    const { error: updErr } = await supabase.from('zone_rates').update({ price_base: price }).eq('id', id)
    if (updErr) throw updErr
    setZoneRows((rows) => rows.map((r) => (r.id === id ? { ...r, price_base: price } : r)))
  }

  async function updateDisposalPrice(id, price) {
    const { error: updErr } = await supabase.from('disposal_rates').update({ price_base: price }).eq('id', id)
    if (updErr) throw updErr
    setDisposalRows((rows) => rows.map((r) => (r.id === id ? { ...r, price_base: price } : r)))
  }

  return { zoneRows, disposalRows, loading, error, reload: load, updateZonePrice, updateDisposalPrice }
}
