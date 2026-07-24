-- ============================================================
-- SEED DE DATOS - Transfer Class - Modelo de Zonas 2026
-- Generado automáticamente por scripts/generate_seed.py
-- ============================================================

-- 1. Clases de vehículo
insert into public.vehicle_classes (code, name, max_pax, display_order) values
  ('E', 'Mercedes Clase E', 3, 1),
  ('S', 'Mercedes Clase S', 3, 2),
  ('V', 'Clase V', 6, 3)
on conflict (code) do nothing;

-- 2. Zonas (Zona 0 = Aeropuerto, con precio real como cualquier otra zona)
insert into public.zones (zone_number, name, example_locations, is_airport) values
  (0, 'Aeropuerto de Palma (PMI) y alrededores', 'Palma, Arenal, Can Pastilla, S''Aranjassa, Son Ferriol, Sa Casa Blanca, Pont d''Inca, Sant Jordi, Son Rapinya, Son Veri Nou', true),
  (1, 'Ponent y Marratxí', 'Bendinat, Illetes, Cas Català, Son Vida, Marratxí, Llucmajor, Algaida', false),
  (2, 'Calvià y Tramuntana Sur', 'Magaluf, Santa Ponça, Peguera, Valldemossa, Bunyola, Inca, Sineu, Campos', false),
  (3, 'Andratx y Sóller', 'Andratx, Port de Andratx, Deià, Sóller, Port de Sóller, Sa Pobla, Manacor, Santanyí', false),
  (4, 'Pollença y Llevant Nord', 'Pollença, Port de Pollença, Can Picafort, Porto Cristo, Cala d''Or', false),
  (5, 'Artà y Costa Nord-Este', 'Cala San Vicenç, Artà, Cala Millor, Sa Coma, Colònia de Sant Pere', false),
  (6, 'Capdepera', 'Cala Ratjada, Cala Agulla, Cala Mesquida, Capdepera', false),
  (7, 'Sa Calobra (zona remota)', 'Cala Tuent, La Calobra', false)
on conflict (zone_number) do update set name = excluded.name, example_locations = excluded.example_locations, is_airport = excluded.is_airport;

-- 3. Tarifa base por zona y clase de vehículo (SIN IVA)
with cls as (
  select id, code from public.vehicle_classes
),
zn as (
  select id, zone_number from public.zones
)
insert into public.zone_rates (zone_id, vehicle_class_id, price_base)
select zn.id, cls.id, v.price
from (values
  (0, 'E', 53.0),
  (0, 'S', 98.0),
  (0, 'V', 81.0),
  (1, 'E', 58.0),
  (1, 'S', 106.0),
  (1, 'V', 88.0),
  (2, 'E', 72.0),
  (2, 'S', 131.0),
  (2, 'V', 109.0),
  (3, 'E', 85.0),
  (3, 'S', 155.0),
  (3, 'V', 129.0),
  (4, 'E', 106.0),
  (4, 'S', 192.0),
  (4, 'V', 160.0),
  (5, 'E', 117.0),
  (5, 'S', 212.0),
  (5, 'V', 176.0),
  (6, 'E', 126.0),
  (6, 'S', 229.0),
  (6, 'V', 191.0),
  (7, 'E', 135.0),
  (7, 'S', 245.0),
  (7, 'V', 204.0)
) as v(zone_number, class_code, price)
join zn on zn.zone_number = v.zone_number
join cls on cls.code = v.class_code
on conflict (zone_id, vehicle_class_id) do update set price_base = excluded.price_base;

-- 4. Tarifas de disposición por horas (servicio de chófer a horas)
with cls as (
  select id, code from public.vehicle_classes
)
insert into public.disposal_rates (vehicle_class_id, hours, price_base, is_extra_hour)
select cls.id, v.hours, v.price, false
from (values
  (3, 'E', 273.0),
  (3, 'S', 396.0),
  (3, 'V', 355.0),
  (4, 'E', 338.0),
  (4, 'S', 490.0),
  (4, 'V', 440.0),
  (5, 'E', 339.0),
  (5, 'S', 491.0),
  (5, 'V', 441.0),
  (6, 'E', 404.0),
  (6, 'S', 586.0),
  (6, 'V', 526.0),
  (7, 'E', 469.0),
  (7, 'S', 680.0),
  (7, 'V', 611.0),
  (8, 'E', 470.0),
  (8, 'S', 681.0),
  (8, 'V', 612.0),
  (9, 'E', 536.0),
  (9, 'S', 776.0),
  (9, 'V', 697.0),
  (10, 'E', 601.0),
  (10, 'S', 870.0),
  (10, 'V', 782.0),
  (11, 'E', 666.0),
  (11, 'S', 965.0),
  (11, 'V', 867.0),
  (12, 'E', 667.0),
  (12, 'S', 966.0),
  (12, 'V', 868.0)
) as v(hours, class_code, price)
join cls on cls.code = v.class_code
on conflict (vehicle_class_id, hours, is_extra_hour) do update set price_base = excluded.price_base;

-- 5. Precio de hora extra (a partir de la hora 12)
with cls as (
  select id, code from public.vehicle_classes
)
insert into public.disposal_rates (vehicle_class_id, hours, price_base, is_extra_hour)
select cls.id, 0, v.price, true
from (values
  ('E', 65.0),
  ('S', 95.0),
  ('V', 85.0)
) as v(class_code, price)
join cls on cls.code = v.class_code
on conflict (vehicle_class_id, hours, is_extra_hour) do update set price_base = excluded.price_base;
