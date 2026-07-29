import { useState } from 'react'
import { PlaneTakeoff, Clock3, AlertTriangle, RefreshCcw } from 'lucide-react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { Card, Spinner, Tabs } from './components/ui/Primitives'
import TransferCalculator from './components/calculator/TransferCalculator'
import DisposalCalculator from './components/calculator/DisposalCalculator'
import RatesAdmin from './components/admin/RatesAdmin'
import { useCalculatorData } from './hooks/useCalculatorData'
import { isSupabaseConfigured } from './lib/supabaseClient'

export default function App() {
  const [view, setView] = useState('calculator')
  const [mode, setMode] = useState('transfer')
  const data = useCalculatorData()

  return (
    <div className="flex min-h-screen flex-col">
      <Header view={view} onViewChange={setView} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-12">
        {!isSupabaseConfigured ? (
          <SetupNotice />
        ) : data.error ? (
          <ErrorNotice message={data.error} onRetry={data.reload} />
        ) : data.loading ? (
          <LoadingNotice />
        ) : view === 'calculator' ? (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                  Calculadora de tarifas
                </h1>
                <p className="mt-1 text-sm text-ink-muted">
                  Traslados aeropuerto ⇄ punto y servicio de disposición por horas, IVA incluido.
                </p>
              </div>
              <Tabs
                tabs={[
                  { id: 'transfer', label: 'Traslado', icon: <PlaneTakeoff size={14} /> },
                  { id: 'disposal', label: 'Por horas', icon: <Clock3 size={14} /> },
                ]}
                active={mode}
                onChange={setMode}
              />
            </div>

            <Card className="p-5 sm:p-7">
              {mode === 'transfer' ? (
                <TransferCalculator
                  locations={data.locations}
                  vehicleClasses={data.vehicleClasses}
                  zoneRateMap={data.zoneRateMap}
                  disposalRateMap={data.disposalRateMap}
                  vatRate={data.vatRate}
                />
              ) : (
                <DisposalCalculator
                  vehicleClasses={data.vehicleClasses}
                  disposalRateMap={data.disposalRateMap}
                  vatRate={data.vatRate}
                />
              )}
            </Card>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Gestión de tarifas</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Consulta y actualiza los precios base (sin IVA) almacenados en Supabase.
              </p>
            </div>
            <RatesAdmin />
          </>
        )}
      </main>

      <Footer contactEmail="reservas@transferclass.com" contactPhone="971221811" />
    </div>
  )
}

function LoadingNotice() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-muted">
      <Spinner size={22} />
      <p className="text-sm">Cargando tarifario…</p>
    </div>
  )
}

function ErrorNotice({ message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rust/10 text-rust">
        <AlertTriangle size={20} />
      </div>
      <p className="text-sm font-medium text-rust">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30"
      >
        <RefreshCcw size={14} /> Reintentar
      </button>
    </div>
  )
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
        <AlertTriangle size={20} />
      </div>
      <h2 className="font-display text-xl font-semibold text-ink">Falta configurar Supabase</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Copia <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-xs">.env.example</code> a{' '}
        <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-xs">.env</code> y añade tu{' '}
        <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-xs">VITE_SUPABASE_URL</code> y{' '}
        <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>. Consulta el
        README para la guía completa.
      </p>
    </div>
  )
}
