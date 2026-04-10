export const MARITAL_OPTIONS = [
  { key: 'solteiro', label: 'Solteiro(a)' },
  { key: 'casado', label: 'Casado(a)' },
  { key: 'divorciado', label: 'Divorciado(a)' },
  { key: 'viuvo', label: 'Viúvo(a)' },
] as const;

export const STATUS_OPTIONS = [
  { key: 'visitante', label: 'Visitante' },
  { key: 'ativo', label: 'Ativo' },
  { key: 'inativo', label: 'Inativo' },
] as const;

/** Mapa de chave → label para exibição (derivado de MARITAL_OPTIONS) */
export const MARITAL_LABEL: Record<string, string> = Object.fromEntries(
  MARITAL_OPTIONS.map((o) => [o.key, o.label])
);
