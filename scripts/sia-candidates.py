"""Internship candidates from two SIA reports: enrolled undergraduates with AVANCE_CARRERA >= threshold and no P
(trabajo de grado) credits in their plan, matched by DOCUMENTO.

Usage: python -I scripts/sia-candidates.py <RE_MAT_PER_BAS.xlsx> <RE_MIG_PLA_EST_DATOS.xlsx> <out.csv> [threshold=75]
The CSV (email, program, program_name, progress_pct, papa, nombre) feeds scripts/load-candidates.mjs. It holds personal
data: keep it out of git (herramientas/practicas-fcen/recursos/sia/ is ignored).
"""
import csv
import sys
from collections import Counter, defaultdict
from openpyxl import load_workbook

sys.stdout.reconfigure(encoding="utf-8")

PROGRAMS = {
  "4030": ("ingenieria-fisica", "Ingeniería Física"),
  "4032": ("matematicas", "Matemáticas"),
  "4034": ("ciencias-computacion", "Ciencias de la Computación"),
  "4036": ("estadistica", "Estadística"),
  "4037": ("ingenieria-biologica", "Ingeniería Biológica"),
}


def pt(*args, **kwargs):
  print(*args, **kwargs)


def num(value):
  try:
    return float(str(value).replace(",", "."))
  except (TypeError, ValueError):
    return None


def main():
  mat_path, mig_path, out_path = sys.argv[1:4]
  threshold = float(sys.argv[4]) if len(sys.argv) > 4 else 75.0

  mig = load_workbook(mig_path, read_only=True, data_only=True)
  with_p = set()
  for r in mig["Sheet3"].iter_rows(min_row=3, values_only=True):
    if r[0] and r[5] == "P":
      with_p.add((str(r[2]).strip(), str(r[0]).strip()))
  mig_email = {str(r[0]).strip(): str(r[5]).strip().lower() for r in mig["Sheet2"].iter_rows(min_row=3, values_only=True) if r[0] and r[5]}

  mat = load_workbook(mat_path, read_only=True, data_only=True)
  stats = defaultdict(Counter)
  rows = []
  for r in mat["Sheet2"].iter_rows(min_row=3, values_only=True):
    code = str(r[3]).strip() if r[3] else ""
    if not r[0] or r[6] != "PREGRADO" or code not in PROGRAMS:
      continue
    doc = str(r[11]).strip()
    advance = num(r[36])
    has_p = (doc, code) in with_p
    slug, name = PROGRAMS[code]
    stats[name]["matriculados"] += 1
    if advance is None or advance < threshold or has_p:
      continue
    email = (str(r[25]).strip().lower() if r[25] else "") or mig_email.get(doc, "")
    if not email.endswith("@unal.edu.co"):
      stats[name]["sin correo UNAL"] += 1
      continue
    stats[name]["candidatos"] += 1
    full_name = " ".join(str(x).strip() for x in (r[7], r[8], r[9]) if x)
    rows.append([email, slug, name, advance, num(r[34]), full_name])

  with open(out_path, "w", newline="", encoding="utf-8") as fh:
    writer = csv.writer(fh)
    writer.writerow(["email", "program", "program_name", "progress_pct", "papa", "nombre"])
    writer.writerows(sorted(rows))
  for name, c in sorted(stats.items()):
    pt(f"{name:28} " + ", ".join(f"{k}: {v}" for k, v in c.items()))
  pt(f"Total: {len(rows)} candidatos (avance >= {threshold:g} y sin trabajo de grado) -> {out_path}")


if __name__ == "__main__":
  main()
