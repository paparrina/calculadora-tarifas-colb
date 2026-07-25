import { useState } from 'react'
import { Check, Copy, Printer, Download, ArrowRight } from 'lucide-react'
import { formatEUR } from '../../lib/pricing'
import { copyTextRobust, printOrDownloadQuote, buildQuoteHtml } from '../../lib/exportQuote'

/**
 * Ticket de presupuesto combinado para Disposición por horas: agrupa
 * el resultado de varios servicios en un único resumen con subtotal,
 * IVA y total conjuntos — igual que MultiTripTicket pero para
 * servicios por horas en vez de trayectos entre zonas.
 */
export default function MultiDisposalTicket({ services, summary, companyName = 'Transfer Class' }) {
  const [copyState, setCopyState] = useState('idle')
  const [printState, setPrintState] = useState('idle')

  const okServices = services.filter((s) => s.result?.ok)
  const hasAnyResult = services.some((s) => s.result)

  if (!hasAnyResult) {
    return (
      <div className="flex h-full min-h-[280px] min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <ArrowRight size={18} />
        </div>
        <p className="max-w-[220px] text-sm text-ink-muted">
          Completa uno o varios servicios y pulsa "Calcular todos" para ver el presupuesto conjunto.
        </p>
      </div>
    )
  }

  const rowLabel = (service, i) => {
    const ref = service.serviceRef?.trim() ? ` (Ref: ${service.serviceRef.trim()})` : ''
    return `Servicio ${i + 1}${ref}: ${service.hours}h`
  }

  const summaryText = [
    `${companyName} — Presupuesto (${summary.count} servicio${summary.count === 1 ? '' : 's'})`,
    ...okServices.map((s) => `· ${rowLabel(s, services.indexOf(s))}: ${formatEUR(s.result.total)} (con IVA)`),
    `Subtotal (sin IVA): ${formatEUR(summary.priceBase)}`,
    `IVA (${summary.vatRate}%): ${formatEUR(summary.vatAmount)}`,
    `TOTAL: ${formatEUR(summary.total)}`,
  ].join('\n')

  async function handleCopy() {
    const outcome = await copyTextRobust(summaryText, 'resumen-presupuesto.txt')
    setCopyState(outcome)
    setTimeout(() => setCopyState('idle'), 2200)
  }

  function handlePrint() {
    const html = buildQuoteHtml({
      companyName,
      title: `Presupuesto · ${summary.count} servicio${summary.count === 1 ? '' : 's'}`,
      subtitleLines: [],
      rows: okServices.map((s) => ({
        label: rowLabel(s, services.indexOf(s)),
        value: formatEUR(s.result.total) + ' (con IVA)',
      })),
      subtotalLabel: 'Subtotal (sin IVA)',
      subtotal: formatEUR(summary.priceBase),
      vatLabel: `IVA (${summary.vatRate}%)`,
      vat: formatEUR(summary.vatAmount),
      total: formatEUR(summary.total),
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
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Presupuesto conjunto</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">
          {summary.count} servicio{summary.count === 1 ? '' : 's'}
        </h3>
      </div>

      <div className="ticket-perforation mx-6">
        <span className="ticket-notch -left-6" />
        <span className="ticket-notch -right-6" />
      </div>

      <div className="flex-1 space-y-4 px-6 py-6">
        <dl className="space-y-2.5">
          {services.map((service, i) =>
            service.result ? (
              <div key={service.id} className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="min-w-0 break-words text-ink-muted">{rowLabel(service, i)}</dt>
                <dd className="flex-none font-mono text-ink">
                  {service.result.ok ? formatEUR(service.result.total) : <span className="text-rust">Error</span>}
                </dd>
              </div>
            ) : null
          )}
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5 text-sm">
            <dt className="text-ink-muted">Subtotal (sin IVA)</dt>
            <dd className="flex-none font-mono text-ink">{formatEUR(summary.priceBase)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-ink-muted">IVA ({summary.vatRate}%)</dt>
            <dd className="flex-none font-mono text-ink">{formatEUR(summary.vatAmount)}</dd>
          </div>
        </dl>

        <div className="rounded-xl bg-ink px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">Total a pagar</p>
          <p className="mt-0.5 font-mono text-3xl font-semibold text-white">{formatEUR(summary.total)}</p>
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
