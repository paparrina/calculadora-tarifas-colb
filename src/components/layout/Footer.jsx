import { Mail, Phone } from 'lucide-react'

export default function Footer({ contactEmail, contactPhone }) {
  return (
    <footer className="border-t border-line bg-paper py-8 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 text-center text-xs text-ink-muted sm:flex-row sm:justify-between sm:text-left">
        <p>Precios sin IVA según tarifario de proveedores 2026. IVA (10%) añadido automáticamente.</p>
        <div className="flex items-center gap-4">
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="flex items-center gap-1.5 hover:text-ink">
              <Mail size={13} /> {contactEmail}
            </a>
          )}
          {contactPhone && (
            <a href={`tel:${contactPhone}`} className="flex items-center gap-1.5 hover:text-ink">
              <Phone size={13} /> {contactPhone}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
