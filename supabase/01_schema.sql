-- ============================================================
-- TRANSFER CLASS · Calculadora de Tarifas por Zonas
-- 01_schema.sql — Esquema de base de datos (Supabase / Postgres)
-- ============================================================
-- Modelo de ZONAS NUMÉRICAS fiel al tarifario original: la Zona 0 ES
-- el Aeropuerto (en el documento de proveedores, la zona 0 agrupa las
-- localidades junto al Aeropuerto de Palma: Can Pastilla, S'Arenal,
-- Palma...), con su propio precio base real — exactamente igual que
-- cualquier otra zona (1, 2, 3...). No hay ningún valor "0 de
-- referencia": cada zona, incluida la Zona 0, tiene UN precio base
-- por clase de vehículo, y el precio entre dos zonas cualesquiera se
-- deriva SIEMPRE con la misma fórmula de negocio, sin excepciones
-- (ver 02_seed.sql y src/lib/pricing.js):
--
--     precio_base = tramo_más_caro + 50% × tramo_más_barato
--
-- No se almacena una matriz N×N de tarifas cruzadas explícita: basta
-- con el precio base de cada zona para derivar cualquier par con la
-- fórmula anterior, lo que hace mucho más fácil mantener el
-- tarifario (una fila por zona y clase, no toda una columna).
--
-- Ejecutar este fichero primero en el SQL Editor de Supabase,
-- y a continuación 02_seed.sql para cargar las 8 zonas del
-- tarifario de proveedores 2026 (0, A, B, C, D, E, F, G renumeradas
-- como 0 a 7).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. Clases de vehículo (Mercedes E, Mercedes S, Clase V...)
-- ------------------------------------------------------------
create table if not exists public.vehicle_classes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,          -- 'E', 'S', 'V'
  name text not null,                 -- 'Mercedes Clase E'
  max_pax int not null default 3,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.vehicle_classes is 'Categorías de vehículo disponibles y su capacidad máxima de pasajeros.';

-- ------------------------------------------------------------
-- 2. Zonas — el Aeropuerto es explícitamente la Zona 0
-- ------------------------------------------------------------
create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  zone_number int not null unique check (zone_number >= 0),
  name text not null,                       -- 'Aeropuerto de Palma (PMI)', 'Palma y Bahía'...
  example_locations text,                   -- localidades orientativas incluidas en la zona
  is_airport boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  -- Solo puede existir una zona marcada como aeropuerto, y debe ser la Zona 0
  constraint airport_is_zone_zero check (not is_airport or zone_number = 0)
);

create unique index if not exists idx_zones_single_airport
  on public.zones (is_airport) where is_airport = true;

comment on table public.zones is 'Zonas tarifarias. zone_number = 0 identifica siempre al Aeropuerto: es una zona más, con su propio precio real en zone_rates (no un valor especial).';

-- ------------------------------------------------------------
-- 3. Tarifa base de cada zona, por clase de vehículo (SIN IVA).
--    Cada zona —incluida la Zona 0 (Aeropuerto)— tiene su propio
--    precio real; no hay ningún valor especial ni bloqueado.
-- ------------------------------------------------------------
create table if not exists public.zone_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id) on delete cascade,
  vehicle_class_id uuid not null references public.vehicle_classes(id) on delete cascade,
  price_base numeric(10,2) not null check (price_base >= 0),
  updated_at timestamptz not null default now(),
  unique (zone_id, vehicle_class_id)
);

comment on table public.zone_rates is 'Precio base (sin IVA) de cada zona, por clase de vehículo. La Zona 0 (Aeropuerto) tiene un precio real, igual que cualquier otra zona: no hay ningún valor de referencia especial. El precio entre dos zonas cualesquiera se deriva con la misma fórmula, sin excepciones (ver src/lib/pricing.js).';

-- ------------------------------------------------------------
-- 4. Tarifas de disposición por horas (servicio de chófer)
-- ------------------------------------------------------------
create table if not exists public.disposal_rates (
  id uuid primary key default gen_random_uuid(),
  vehicle_class_id uuid not null references public.vehicle_classes(id) on delete cascade,
  hours int not null default 0,            -- 3..12 ; 0 = fila de "hora extra"
  is_extra_hour boolean not null default false,
  price_base numeric(10,2) not null check (price_base >= 0),
  updated_at timestamptz not null default now(),
  unique (vehicle_class_id, hours, is_extra_hour)
);

comment on table public.disposal_rates is 'Precio base (sin IVA) del servicio de disposición por horas (3 a 12h) y precio de hora extra, por clase de vehículo.';

-- ------------------------------------------------------------
-- 5. Configuración general de la app (IVA, etc.)
-- ------------------------------------------------------------
create table if not exists public.app_settings (
  id int primary key default 1,
  vat_rate numeric(5,2) not null default 10.00,
  company_name text not null default 'Transfer Class',
  contact_email text default 'reservas@transferclass.com',
  contact_phone text default '971221811',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.app_settings (id) values (1)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 6. Vista de conveniencia: tarifas de zona "legibles"
-- ------------------------------------------------------------
create or replace view public.v_zone_rates as
select
  zr.id,
  z.id as zone_id,
  z.zone_number,
  z.name as zone_name,
  z.is_airport,
  vc.id as vehicle_class_id,
  vc.code as vehicle_code,
  vc.name as vehicle_name,
  vc.max_pax,
  zr.price_base,
  round(zr.price_base * (1 + s.vat_rate / 100.0), 2) as price_with_vat
from public.zone_rates zr
join public.zones z on z.id = zr.zone_id
join public.vehicle_classes vc on vc.id = zr.vehicle_class_id
cross join public.app_settings s
order by z.zone_number, vc.display_order;

-- ------------------------------------------------------------
-- 7. Función SQL opcional: calcular el precio entre dos zonas
-- ------------------------------------------------------------
-- Encapsula la fórmula de negocio en la base de datos, por si se
-- quiere calcular el precio desde SQL/RPC además de en el frontend.
-- Una única fórmula, sin excepciones — ni para la Zona 0, ni cuando
-- origen y destino son la misma zona (en ese caso los dos tramos
-- valen lo mismo, y la fórmula da automáticamente 1,5× esa tarifa):
--   precio_base = tramo_mas_caro + 50% * tramo_mas_barato
create or replace function public.calculate_zone_price(
  p_zone_a uuid,
  p_zone_b uuid,
  p_vehicle_class uuid
) returns table (
  price_base numeric,
  vat_amount numeric,
  total numeric
) language plpgsql stable as $$
declare
  v_price_a numeric;
  v_price_b numeric;
  v_higher numeric;
  v_lower numeric;
  v_base numeric;
  v_vat_rate numeric;
begin
  select zr.price_base into v_price_a from public.zone_rates zr
    where zr.zone_id = p_zone_a and zr.vehicle_class_id = p_vehicle_class;
  select zr.price_base into v_price_b from public.zone_rates zr
    where zr.zone_id = p_zone_b and zr.vehicle_class_id = p_vehicle_class;

  if v_price_a is null or v_price_b is null then
    raise exception 'No existe tarifa registrada para una de las zonas y esa clase de vehículo';
  end if;

  v_higher := greatest(v_price_a, v_price_b);
  v_lower := least(v_price_a, v_price_b);
  v_base := round(v_higher + (v_lower * 0.5), 2);

  select s.vat_rate into v_vat_rate from public.app_settings s where s.id = 1;

  return query select
    v_base,
    round(v_base * (v_vat_rate / 100.0), 2),
    round(v_base * (1 + v_vat_rate / 100.0), 2);
end;
$$;

comment on function public.calculate_zone_price is 'Aplica "tramo más caro + 50% del tramo más barato" entre dos zonas cualesquiera, sin ninguna excepción — Zona 0 incluida, y también cuando origen y destino son la misma zona (da 1,5× su tarifa, sin necesidad de una regla aparte).';

-- ------------------------------------------------------------
-- 8. Row Level Security (RLS)
-- ------------------------------------------------------------
-- Lectura pública (la calculadora es de cara al cliente/colaborador),
-- escritura restringida a usuarios autenticados (panel de gestión).
-- Ajusta la policy de escritura a tu modelo de roles/Auth real
-- (por ejemplo, comprobando una claim 'role' = 'admin' en el JWT).

alter table public.vehicle_classes enable row level security;
alter table public.zones           enable row level security;
alter table public.zone_rates      enable row level security;
alter table public.disposal_rates  enable row level security;
alter table public.app_settings    enable row level security;

create policy "Lectura pública" on public.vehicle_classes for select using (true);
create policy "Lectura pública" on public.zones             for select using (true);
create policy "Lectura pública" on public.zone_rates        for select using (true);
create policy "Lectura pública" on public.disposal_rates    for select using (true);
create policy "Lectura pública" on public.app_settings       for select using (true);

create policy "Escritura autenticados" on public.vehicle_classes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Escritura autenticados" on public.zones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Escritura autenticados" on public.zone_rates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Escritura autenticados" on public.disposal_rates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Escritura autenticados" on public.app_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Fin del esquema. Continúa con 02_seed.sql
-- ------------------------------------------------------------
