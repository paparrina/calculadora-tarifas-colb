/**
 * lib/exportQuote.js
 * ------------------------------------------------------------------
 * "Copiar" e "Imprimir/Descargar" dependen de permisos del navegador
 * (Clipboard API, ventanas emergentes, window.print) que a menudo
 * están bloqueados dentro de entornos con sandbox — por ejemplo, el
 * iframe de vista previa de un artefacto. Estas utilidades intentan
 * primero el camino "nativo" y, si falla, caen a una alternativa que
 * SIEMPRE funciona: la descarga de un fichero, que los navegadores
 * permiten incluso en la mayoría de entornos restringidos porque la
 * dispara un gesto directo del usuario (un clic).
 * ------------------------------------------------------------------
 */

/**
 * Copia texto al portapapeles. Devuelve 'clipboard' si funcionó por la
 * vía moderna, 'legacy' si funcionó por el método antiguo
 * (execCommand), o 'download' si ninguna de las dos funcionó y en su
 * lugar se ha descargado un .txt con el mismo contenido como último
 * recurso garantizado.
 */
export async function copyTextRobust(text, downloadFilename = 'resumen.txt') {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return 'clipboard'
    } catch {
      /* seguimos con el siguiente método */
    }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (ok) return 'legacy'
  } catch {
    /* seguimos con el último recurso */
  }

  downloadTextFile(downloadFilename, text)
  return 'download'
}

/** Descarga un fichero de texto plano — funciona prácticamente en cualquier contexto. */
export function downloadTextFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Intenta abrir el diálogo de impresión nativo del navegador
 * (funciona bien en una pestaña normal, p.ej. la app ya desplegada).
 * Si no es posible (p.ej. dentro de un iframe con sandbox que bloquea
 * ventanas emergentes o `window.print`), descarga en su lugar un HTML
 * autocontenido y ya maquetado para imprimir, que el usuario puede
 * abrir y imprimir por su cuenta. Devuelve 'print' o 'download'.
 */
export function printOrDownloadQuote(html, downloadFilename = 'presupuesto.html') {
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) {
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      return 'print'
    }
    URL.revokeObjectURL(url)
  } catch {
    /* seguimos con la descarga */
  }

  downloadTextFile(downloadFilename, html, 'text/html;charset=utf-8')
  return 'download'
}

/** Construye un HTML autocontenido y listo para imprimir a partir de las líneas de un presupuesto. */
export function buildQuoteHtml({ companyName, title, subtitleLines = [], rows, subtotalLabel, subtotal, vatLabel, vat, total }) {
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 0;color:#4B4E55;">${escapeHtml(r.label)}</td><td style="padding:6px 0;text-align:right;font-variant-numeric:tabular-nums;">${escapeHtml(r.value)}</td></tr>`
    )
    .join('')
  const subtitleHtml = subtitleLines.filter(Boolean).map((l) => `<p style="margin:2px 0;color:#4B4E55;">${escapeHtml(l)}</p>`).join('')

  return `<!doctype html>
<html lang="es"><head><meta charset="UTF-8"><title>${escapeHtml(companyName)} · Presupuesto</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#101114;max-width:640px;margin:40px auto;padding:0 20px;}
  h1{font-size:20px;margin:0 0 4px;}
  table{width:100%;border-collapse:collapse;margin-top:16px;}
  tr+tr td{border-top:1px solid #E4E3DE;}
  .total{margin-top:18px;background:#101114;color:#fff;padding:14px 18px;border-radius:10px;font-size:22px;font-weight:bold;display:flex;justify-content:space-between;}
  @media print{ body{margin:0;padding:20px;} }
</style></head>
<body>
  <p style="text-transform:uppercase;font-size:11px;letter-spacing:.05em;color:#6C6F76;margin:0;">${escapeHtml(companyName)} — Presupuesto</p>
  <h1>${escapeHtml(title)}</h1>
  ${subtitleHtml}
  <table>${rowsHtml}
    <tr><td style="padding-top:10px;font-weight:600;">${escapeHtml(subtotalLabel)}</td><td style="padding-top:10px;text-align:right;font-weight:600;">${escapeHtml(subtotal)}</td></tr>
    <tr><td>${escapeHtml(vatLabel)}</td><td style="text-align:right;">${escapeHtml(vat)}</td></tr>
  </table>
  <div class="total"><span>TOTAL</span><span>${escapeHtml(total)}</span></div>
  <script>window.onload = () => setTimeout(() => window.print(), 200);<\/script>
</body></html>`
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
