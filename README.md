# Transfer Class · Calculadora de Tarifas por Zonas

Calculadora de tarifas de traslados entre **zonas numéricas** (la Zona 0 es
siempre el Aeropuerto) y de disposición por horas, construida con
**React + Vite + Tailwind CSS + Supabase**. Los datos (zonas y precios)
viven en Supabase, así que se pueden actualizar sin tocar código desde la
propia app (pestaña **Gestión**) o desde el SQL editor.

---

## 1. Stack

- **Frontend:** React 18 + Vite 5 (SPA estática, ideal para Vercel/Netlify)
- **Estilos:** Tailwind CSS (paleta e identidad propias, ver `tailwind.config.js`)
- **Datos:** Supabase (Postgres + API REST autogenerada)
- **Iconos:** lucide-react

---

## 2. El modelo de zonas (léelo antes de tocar nada)

El tarifario de proveedores agrupa las localidades en zonas (0, A, B, C...
en el documento original). La **Zona 0 ES el Aeropuerto**: en el propio
documento, esa zona reúne las localidades junto al Aeropuerto de Palma
(Can Pastilla, S'Arenal, Palma...), así que tiene su **propio precio base
real** — 53,00 / 98,00 / 81,00 € — exactamente igual que cualquier otra
zona. No es un valor especial ni de referencia: se guarda, se edita y se
usa igual que el resto.

El precio entre dos zonas cualesquiera —incluida la Zona 0— se **deriva**
siempre con la misma fórmula de negocio, sin ningún caso especial:

```
Precio base = tramo_más_caro + 50% × tramo_más_barato
```

donde cada "tramo" es el precio base de cada zona implicada. Esto se
aplica de forma **idéntica** en cualquier combinación de zonas, Zona 0
incluida — no hay una rama de código distinta para "traslados desde el
aeropuerto" frente a "traslados entre dos zonas".

> **Importante:** como consecuencia de aplicar la fórmula sin excepciones,
> el precio calculado por la app para un traslado Aeropuerto → Zona X
> puede no coincidir con el importe que el PDF original lista de forma
> directa para esa zona (que era, literalmente, ya una tarifa
> Aeropuerto→Zona). Por ejemplo, Aeropuerto (Zona 0, 53 €) → Zona 1 (58 €)
> da `58 + 50%×53 = 84,50 €`, no los 58 € que aparecen en el documento.
> Esto es intencionado: es el comportamiento que se pidió explícitamente
> (una única fórmula para todas las combinaciones de zonas, sin
> excepciones). Si en algún momento prefieres que los traslados que
> incluyen la Zona 0 devuelvan el precio directo de la otra zona (como en
> el PDF), es un cambio acotado a `src/lib/pricing.js`.

---

## 3. Estructura del proyecto

```
transfer-calculator/
├── supabase/
│   ├── 01_schema.sql      # Tablas, vista, función SQL, RLS
│   └── 02_seed.sql        # 8 zonas + tarifas (generado automáticamente)
├── src/
│   ├── lib/
│   │   ├── supabaseClient.js   # Cliente Supabase
│   │   ├── pricing.js          # 🔴 Lógica de negocio (fórmula de zonas + IVA)
│   │   └── exportQuote.js      # Copiar/imprimir robustos (con fallback de descarga)
│   ├── hooks/
│   │   ├── useCalculatorData.js  # Carga datos para la calculadora
│   │   └── useAdminRates.js      # Carga/edita datos para el panel de gestión
│   ├── components/
│   │   ├── ui/            # Combobox, Button, Card, Tabs…
│   │   ├── calculator/    # TransferCalculator (multi-trayecto), TripRow, MultiTripTicket, DisposalCalculator, ResultTicket
│   │   ├── admin/         # RatesAdmin, EditablePrice
│   │   └── layout/        # Header, Footer
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   └── generate_seed.py   # Script usado para generar 02_seed.sql
├── .env.example
├── netlify.toml
└── vercel.json
```

---

## 4. Configuración de Supabase

### 4.1 Crear el proyecto

1. Ve a [supabase.com](https://supabase.com) → **New project**.
2. Guarda la contraseña de la base de datos.
3. Cuando el proyecto esté listo, ve a **Project Settings → API** y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`

### 4.2 Crear las tablas y cargar los datos

En el panel de Supabase abre **SQL Editor → New query** y ejecuta, en este orden:

1. Todo el contenido de [`supabase/01_schema.sql`](./supabase/01_schema.sql)
   — crea las tablas `vehicle_classes`, `zones`, `zone_rates`,
   `disposal_rates`, `app_settings`, la vista `v_zone_rates`, la función
   `calculate_zone_price(...)` (la misma fórmula pero en SQL, por si la
   necesitas desde un RPC) y las políticas RLS.
2. Todo el contenido de [`supabase/02_seed.sql`](./supabase/02_seed.sql)
   — carga las **8 zonas** del tarifario (0, A, B, C, D, E, F, G del
   documento original, renumeradas como 0 a 7; la Zona 0 es el
   Aeropuerto y tiene su propio precio real), sus precios por clase de
   vehículo E/S/V, y las tarifas de disposición por horas.

Puedes volver a ejecutar `02_seed.sql` con seguridad: usa `on conflict … do
update`, así que actualiza los precios en vez de duplicar filas.

> **Nota sobre seguridad:** el esquema deja la lectura abierta a todo el
> mundo (`anon`), porque la calculadora es pública, pero restringe la
> escritura a usuarios autenticados. Antes de dar acceso al panel de
> **Gestión** a colaboradores externos, añade Supabase Auth y ajusta las
> políticas de `01_schema.sql` para exigir un rol de administrador.

---

## 5. Configuración local del proyecto

### 5.1 Requisitos

- Node.js 18 o superior
- Un proyecto de Supabase ya configurado (paso 4)

### 5.2 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env y añade tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# 3. Arrancar en desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`.

### 5.3 Build de producción

```bash
npm run build   # genera la carpeta dist/
npm run preview # sirve el build localmente para comprobarlo
```

**Varios trayectos a la vez:** la pestaña Traslado permite añadir varias
filas de trayecto (botón "+ Añadir trayecto"), cada una con su propia zona
de origen/destino y clase de vehículo. "Calcular todos" computa cada fila
por separado con `calculateZonePrice` y las combina con `summarizeTrips`
en un único presupuesto — el IVA se aplica una sola vez sobre la suma de
todos los subtotales, como una factura con varias líneas.

**Copiar / exportar presupuesto:** `src/lib/exportQuote.js` intenta primero
la Clipboard API / `window.print()` nativos; si el navegador los bloquea
(por ejemplo, dentro de un iframe con sandbox), cae automáticamente a un
método alternativo que sí funciona en cualquier contexto — copia por el
método antiguo (`execCommand`) o, como último recurso, descarga un fichero
(.txt o .html) con el mismo contenido. El botón indica qué ha ocurrido
("Copiado" / "Descargado (.txt)", "Abierto para imprimir" / "Descargado").

---

## 6. Lógica de cálculo (resumen)

Toda la lógica de negocio vive en [`src/lib/pricing.js`](./src/lib/pricing.js),
sin dependencias de React ni de Supabase (fácil de testear).

**Traslado entre dos zonas** (`calculateZonePrice`) — una única fórmula,
sin ninguna excepción (ni para la Zona 0, ni cuando origen y destino son
la misma zona):

```
Precio base = tramo_más_caro + 50% × tramo_más_barato
```

Si origen y destino son la misma zona, ambos tramos valen lo mismo, así
que la fórmula da automáticamente **1,5× esa tarifa** (el tramo completo
más el 50% del mismo tramo) — no hace falta ninguna regla aparte. El
resultado incluye un desglose (`legs`) que muestra el tramo más caro
completo y el más barato al 50% — las dos líneas suman siempre el
subtotal exacto, para que el desglose nunca contradiga visualmente el
total.

**Disposición por horas** (`calculateDisposalPrice`):
```
Si horas ≤ 12  → tarifa cerrada de esa franja (3 a 12 horas)
Si horas > 12  → tarifa de 12h + (horas - 12) × precio hora extra
```

**IVA:** en ambos casos, `IVA = Precio base × 10%` y `Total = Precio base + IVA`.
El tipo de IVA no está hardcodeado: se lee de `app_settings.vat_rate`, así que
se puede cambiar desde Supabase sin tocar código.

---

## 7. Desplegar en Vercel (menos de 5 minutos)

1. Sube el proyecto a un repositorio de GitHub/GitLab/Bitbucket.
2. Entra en [vercel.com](https://vercel.com) → **Add New… → Project** →
   importa el repositorio.
3. Vercel detecta Vite automáticamente. Confirma:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. En **Environment Variables** añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Pulsa **Deploy**. En 1-2 minutos tendrás una URL pública (`*.vercel.app`).

## 8. Desplegar en Netlify (alternativa)

1. Sube el proyecto a un repositorio Git.
2. Entra en [app.netlify.com](https://app.netlify.com) → **Add new site →
   Import an existing project**.
3. Netlify leerá `netlify.toml` automáticamente (`npm run build`, publica
   `dist`).
4. En **Site settings → Environment variables** añade `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
5. **Deploy site**.

> Alternativa exprés sin Git: `npm run build` en local y arrastra la carpeta
> `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop) — pero
> recuerda que en ese caso las variables de entorno hay que configurarlas
> igualmente en el panel de Netlify y volver a desplegar.

---

## 9. Desplegar en Cloudflare Pages (recomendado: gratis, sin límite de tráfico, uso comercial permitido)

1. Sube el proyecto a un repositorio de GitHub.
2. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers &
   Pages → Create → Pages → Connect to Git**.
3. Autoriza GitHub y elige el repositorio.
4. En la configuración de build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. En **Environment variables** añade `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
6. **Save and Deploy**. En 1-2 minutos tendrás una URL pública
   (`*.pages.dev`), ampliable a un dominio propio gratis desde la misma
   pantalla.

### 9.1 Evitar que Supabase se pause por inactividad (plan gratuito)

Los proyectos gratuitos de Supabase se pausan tras 7 días sin actividad y
hay que reactivarlos a mano desde el panel. El fichero
[`.github/workflows/keep-alive.yml`](./.github/workflows/keep-alive.yml) ya
incluido en este proyecto hace una consulta ligera cada 4 días para que eso
nunca ocurra. Solo hay que configurar dos secretos, una vez, en GitHub:

1. En tu repositorio → **Settings → Secrets and variables → Actions → New
   repository secret**.
2. Crea `SUPABASE_URL` con el mismo valor que `VITE_SUPABASE_URL`.
3. Crea `SUPABASE_ANON_KEY` con el mismo valor que `VITE_SUPABASE_ANON_KEY`.

A partir de ahí funciona solo, sin coste ni mantenimiento.

---

## 10. Actualizar zonas y tarifas en el futuro

Dos opciones, sin tocar código:

1. **Desde la app:** pestaña **Gestión** → edita cualquier precio de zona u
   hora en línea (se guarda al salir del campo). La Zona 0 (Aeropuerto)
   se edita exactamente igual que cualquier otra zona.
2. **Desde Supabase:** Table Editor → `zone_rates` / `disposal_rates` →
   edita `price_base` directamente, o vuelve a generar `02_seed.sql` con
   `python3 scripts/generate_seed.py` si cambia el tarifario completo.

Para añadir una **zona nueva**, inserta una fila en `zones` (con su
`zone_number` y, opcionalmente, `example_locations` para el desplegable) y
sus tres filas en `zone_rates` (una por clase E/S/V); aparecerá
automáticamente en los desplegables de la calculadora.
