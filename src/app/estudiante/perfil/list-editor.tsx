"use client";

export type FieldDef<T> = {
  key: keyof T & string;
  label: string;
  type?: "text" | "number" | "date" | "url" | "textarea" | "select";
  options?: (string | { value: string; label: string })[];
  wide?: boolean;
  placeholder?: string;
};

export function ListEditor<T extends Record<string, unknown>>({
  items,
  onChange,
  fields,
  empty,
  addLabel,
  max,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  fields: FieldDef<T>[];
  empty: T;
  addLabel: string;
  max?: number;
}) {
  function update(index: number, key: keyof T, value: unknown) {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-borde bg-superficie p-3">
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className={`field ${f.wide || f.type === "textarea" ? "md:col-span-2" : ""}`}>
                <span>{f.label}</span>
                {f.type === "textarea" ? (
                  <textarea
                    className="input"
                    value={(item[f.key] as string) ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => update(index, f.key, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <select className="input" value={(item[f.key] as string) ?? ""} onChange={(e) => update(index, f.key, e.target.value)}>
                    <option value="">Elegir…</option>
                    {f.options?.map((o) => {
                      const { value, label } = typeof o === "string" ? { value: o, label: o } : o;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    className="input"
                    type={f.type ?? "text"}
                    value={(item[f.key] as string | number | null) ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      update(index, f.key, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <button type="button" className="mt-2 text-sm text-naranja hover:underline" onClick={() => onChange(items.filter((_, i) => i !== index))}>
            Quitar
          </button>
        </div>
      ))}
      {(max === undefined || items.length < max) && (
        <button type="button" className="btn btn-secondary" onClick={() => onChange([...items, { ...empty }])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}
