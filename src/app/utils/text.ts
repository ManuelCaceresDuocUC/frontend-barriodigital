/**
 * Normaliza un texto para buscar: minúsculas, sin tildes y sin espacios sobrantes,
 * de modo que "tramite" encuentre "Trámite".
 */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** true si el valor es un número finito (los inputs numéricos vacíos entregan null). */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
