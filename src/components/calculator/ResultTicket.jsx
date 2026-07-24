import { useState } from 'react'
import { Check, Copy, Printer, Download, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatEUR } from '../../lib/pricing'
import { copyTextRobust, printOrDownloadQuote, buildQuoteHtml } from '../../lib/exportQuote'

/**
 * Ticket de resultado — el elemento "firma" de la interfaz.
 * Se presenta como un resguardo/billete con un borde perforado que
 * separa la ruta del desglose económico, en línea con el negocio
 * (traslados de aeropuerto) sin resultar decorativo de más.
 */
export default function ResultTicket({
  title,
  subtitle,
  vehicleClassName,
  result,
  companyName = 'Transfer Class',
  emptyHint,
}) {
  const [copyState, setCopyState] = useState('idle') // idle | clipboard | legacy | download
  const [printState, setPrintState] = useState('idle') // idle | print | download

  if (!result) {
    return (
      <div className="flex h-full min-h-[280px] min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <ArrowRight size={18} />
        </div>
        <p className="max-w-[220px] text-sm text-ink-muted">
          {emptyHint || 'Completa los datos del trayecto para ver el presupuesto.'}
        </p>
      </div>
    )
  }

  if (!result.ok) {
    return (
      <div className="flex h-full min-h-[280px] min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-rust/30 bg-rust-50 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rust/10 text-rust">
          <AlertTriangle size={18} />
        </div>
        <p className="max-w-[260px] text-sm font-medium text-rust">{result.error}</p>
      </div>
    )
  }

  const summaryText = [
    `${companyName} — Presupuesto de traslado`,
    title,
    vehicleClassName ? `Vehículo: ${vehicleClassName}` : null,
    ...result.legs.map((l) => `· ${l.label}: ${formatEUR(l.price)}`),
    `Subtotal (sin IVA): ${formatEUR(result.priceBase)}`,
    `IVA (${result.vatRate}%): ${formatEUR(result.vatAmount)}`,
    `TOTAL: ${formatEUR(result.total)}`,
  ]
    .filter(Boolean)
    .join('\n')

  async function handleCopy() {
    const outcome = await copyTextRobust(summaryText, 'resumen-presupuesto.txt')
    setCopyState(outcome)
    setTimeout(() => setCopyState('idle'), 2200)
  }

  function handlePrint() {
    const html = buildQuoteHtml({
      companyName,
      title,
      subtitleLines: [vehicleClassName],
      rows: result.legs.map((l) => ({ label: l.label, value: formatEUR(l.price) })),
      subtotalLabel: 'Subtotal (sin IVA)',
      subtotal: formatEUR(result.priceBase),
      vatLabel: `IVA (${result.vatRate}%)`,
      vat: formatEUR(result.vatAmount),
      total: formatEUR(result.total),
    })
    const outcome = printOrDownloadQuote(html, 'presupuesto-transfer-class.html')
    setPrintState(outcome)
    setTimeout(() => setPrintState('idle'), 2200)
  }

  const copyLabel = { idle: 'Copiar resumen', clipboard: 'Copiado', legacy: 'Copiado', download: 'Descargado (.txt)' }[copyState]
  const printLabel = { idle: 'Presupuesto', print: 'Abierto para imprimir', download: 'Descargado' }[printState]

  return (
    <div id="print-quote" className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="animate-riseIn px-6 pb-5 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{subtitle}</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">{title}</h3>
        {vehicleClassName && <p className="mt-0.5 text-sm text-ink-muted">{vehicleClassName}</p>}
      </div>

      <div className="ticket-perforation mx-6">
        <span className="ticket-notch -left-6" />
        <span className="ticket-notch -right-6" />
      </div>

      <div className="flex-1 space-y-4 px-6 py-6">
        <dl className="space-y-2.5">
          {result.legs.map((leg, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="min-w-0 break-words text-ink-muted">{leg.label}</dt>
              <dd className="flex-none font-mono text-ink">{formatEUR(leg.price)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5 text-sm">
            <dt className="text-ink-muted">Subtotal (sin IVA)</dt>
            <dd className="flex-none font-mono text-ink">{formatEUR(result.priceBase)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-ink-muted">IVA ({result.vatRate}%)</dt>
            <dd className="flex-none font-mono text-ink">{formatEUR(result.vatAmount)}</dd>
          </div>
        </dl>

        <div className="rounded-xl bg-ink px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">Total a pagar</p>
          <p className="mt-0.5 font-mono text-3xl font-semibold text-white">{formatEUR(result.total)}</p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-line px-6 py-4 print:hidden">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
        >
          {copyState !== 'idle' ? <Check size={15} className="text-pine" /> : <Copy size={15} />}
          {copyLabel}
        </button>
        <button
          onClick={handlePrint}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white shadow-pop transition hover:bg-gold-600"
        >
          {printState === 'download' ? <Download size={15} /> : <Printer size={15} />}
          {printLabel}
        </button>
      </div>
    </div>
  )
}
