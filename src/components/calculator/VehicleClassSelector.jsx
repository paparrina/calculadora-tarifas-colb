import { Car, Users } from 'lucide-react'

export default function VehicleClassSelector({ vehicleClasses, value, onChange }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Clase de vehículo
      </span>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {vehicleClasses.map((vc) => {
          const selected = value === vc.id
          return (
            <button
              key={vc.id}
              type="button"
              onClick={() => onChange(vc.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-gold bg-gold-50 shadow-sm'
                  : 'border-line bg-surface hover:border-ink/20'
              }`}
            >
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                  selected ? 'bg-gold text-white' : 'bg-ink/5 text-ink-muted'
                }`}
              >
                <Car size={16} strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${selected ? 'text-ink' : 'text-ink'}`}>
                  {vc.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <Users size={12} /> hasta {vc.max_pax} pax
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
