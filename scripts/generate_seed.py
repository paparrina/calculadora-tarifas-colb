#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera supabase/02_seed.sql para el modelo de ZONAS NUMÉRICAS, fiel a
la numeración del tarifario original (Zona 0, A, B, C, D, E, F, G).

La Zona 0 ES el Aeropuerto: en el tarifario de proveedores, la zona 0
agrupa las localidades inmediatamente alrededor del Aeropuerto de
Palma (Can Pastilla, S'Arenal, Palma...), así que la Zona 0 tiene un
precio real (53,00 / 98,00 / 81,00 €), exactamente igual que cualquier
otra zona. No hay ningún precio "0 de referencia": la fórmula de
negocio (tramo_más_caro + 50% del más barato) se aplica exactamente
igual entre cualquier par de zonas, incluida la Zona 0.

Uso:
    python3 scripts/generate_seed.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from locations_data import LOCATIONS

# (zone_number, name, example_locations, price_E, price_S, price_V, is_airport)
ZONES = [
    (0, "Aeropuerto de Palma (PMI) y alrededores", "Palma, Arenal, Can Pastilla, S'Aranjassa, Son Ferriol, Sa Casa Blanca, Pont d'Inca, Sant Jordi, Son Rapinya, Son Veri Nou", 53.00, 98.00, 81.00, True),
    (1, "Ponent y Marratxí", "Bendinat, Illetes, Cas Català, Son Vida, Marratxí, Llucmajor, Algaida", 58.00, 106.00, 88.00, False),
    (2, "Calvià y Tramuntana Sur", "Magaluf, Santa Ponça, Peguera, Valldemossa, Bunyola, Inca, Sineu, Campos", 72.00, 131.00, 109.00, False),
    (3, "Andratx y Sóller", "Andratx, Port de Andratx, Deià, Sóller, Port de Sóller, Sa Pobla, Manacor, Santanyí", 85.00, 155.00, 129.00, False),
    (4, "Pollença y Llevant Nord", "Pollença, Port de Pollença, Can Picafort, Porto Cristo, Cala d'Or", 106.00, 192.00, 160.00, False),
    (5, "Artà y Costa Nord-Este", "Cala San Vicenç, Artà, Cala Millor, Sa Coma, Colònia de Sant Pere", 117.00, 212.00, 176.00, False),
    (6, "Capdepera", "Cala Ratjada, Cala Agulla, Cala Mesquida, Capdepera", 126.00, 229.00, 191.00, False),
    (7, "Sa Calobra (zona remota)", "Cala Tuent, La Calobra", 135.00, 245.00, 204.00, False),
]

DISPOSAL = [
    (3, 273.00, 396.00, 355.00),
    (4, 338.00, 490.00, 440.00),
    (5, 339.00, 491.00, 441.00),
    (6, 404.00, 586.00, 526.00),
    (7, 469.00, 680.00, 611.00),
    (8, 470.00, 681.00, 612.00),
    (9, 536.00, 776.00, 697.00),
    (10, 601.00, 870.00, 782.00),
    (11, 666.00, 965.00, 867.00),
    (12, 667.00, 966.00, 868.00),
]
EXTRA_HOUR = (65.00, 95.00, 85.00)


def esc(s):
    return s.replace("'", "''")


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "supabase")
    out_path = os.path.join(out_dir, "02_seed.sql")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("-- ============================================================\n")
        f.write("-- SEED DE DATOS - Transfer Class - Modelo de Zonas 2026\n")
        f.write("-- Generado automáticamente por scripts/generate_seed.py\n")
        f.write("-- ============================================================\n\n")

        f.write("-- 1. Clases de vehículo\n")
        f.write("""insert into public.vehicle_classes (code, name, max_pax, display_order) values
  ('E', 'Mercedes Clase E', 3, 1),
  ('S', 'Mercedes Clase S', 3, 2),
  ('V', 'Clase V', 6, 3)
on conflict (code) do nothing;

""")

        f.write("-- 2. Zonas (Zona 0 = Aeropuerto, con precio real como cualquier otra zona)\n")
        f.write("insert into public.zones (zone_number, name, example_locations, is_airport) values\n")
        vals = []
        for zn, name, examples, *_rest, is_airport in ZONES:
            vals.append(f"  ({zn}, '{esc(name)}', '{esc(examples)}', {'true' if is_airport else 'false'})")
        f.write(",\n".join(vals))
        f.write("\non conflict (zone_number) do update set name = excluded.name, example_locations = excluded.example_locations, is_airport = excluded.is_airport;\n\n")

        f.write("-- 2.1 Localidades reales del tarifario (231, extraídas del PDF y verificadas)\n")
        f.write("--     + el propio Aeropuerto, para poder buscarlo por nombre igual que el resto.\n")
        f.write("""with zn as (
  select id, zone_number from public.zones
)
insert into public.locations (name, zone_id)
select v.name, zn.id
from (values\n""")
        vals = ["  ('Aeropuerto de Palma (PMI)', 0)"]
        for name, zone_number in LOCATIONS:
            vals.append(f"  ('{esc(name)}', {zone_number})")
        f.write(",\n".join(vals))
        f.write("""
) as v(name, zone_number)
join zn on zn.zone_number = v.zone_number
on conflict (name) do update set zone_id = excluded.zone_id;

""")

        f.write("-- 3. Tarifa base por zona y clase de vehículo (SIN IVA)\n")
        f.write("""with cls as (
  select id, code from public.vehicle_classes
),
zn as (
  select id, zone_number from public.zones
)
insert into public.zone_rates (zone_id, vehicle_class_id, price_base)
select zn.id, cls.id, v.price
from (values\n""")
        vals = []
        for zone_number, name, examples, pe, ps, pv, is_airport in ZONES:
            vals.append(f"  ({zone_number}, 'E', {pe})")
            vals.append(f"  ({zone_number}, 'S', {ps})")
            vals.append(f"  ({zone_number}, 'V', {pv})")
        f.write(",\n".join(vals))
        f.write("""
) as v(zone_number, class_code, price)
join zn on zn.zone_number = v.zone_number
join cls on cls.code = v.class_code
on conflict (zone_id, vehicle_class_id) do update set price_base = excluded.price_base;

""")

        f.write("-- 4. Tarifas de disposición por horas (servicio de chófer a horas)\n")
        f.write("""with cls as (
  select id, code from public.vehicle_classes
)
insert into public.disposal_rates (vehicle_class_id, hours, price_base, is_extra_hour)
select cls.id, v.hours, v.price, false
from (values\n""")
        vals = []
        for hours, pe, ps, pv in DISPOSAL:
            vals.append(f"  ({hours}, 'E', {pe})")
            vals.append(f"  ({hours}, 'S', {ps})")
            vals.append(f"  ({hours}, 'V', {pv})")
        f.write(",\n".join(vals))
        f.write("""
) as v(hours, class_code, price)
join cls on cls.code = v.class_code
on conflict (vehicle_class_id, hours, is_extra_hour) do update set price_base = excluded.price_base;

""")

        pe, ps, pv = EXTRA_HOUR
        f.write("-- 5. Precio de hora extra (a partir de la hora 12)\n")
        f.write(f"""with cls as (
  select id, code from public.vehicle_classes
)
insert into public.disposal_rates (vehicle_class_id, hours, price_base, is_extra_hour)
select cls.id, 0, v.price, true
from (values
  ('E', {pe}),
  ('S', {ps}),
  ('V', {pv})
) as v(class_code, price)
join cls on cls.code = v.class_code
on conflict (vehicle_class_id, hours, is_extra_hour) do update set price_base = excluded.price_base;
""")

    print(f"{len(ZONES)} zonas -> {out_path}")


if __name__ == "__main__":
    main()
