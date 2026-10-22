import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * RUT chileno: utilidades de normalización y validación (módulo 11).
 * Formato canónico que viaja al backend: "12345678-5" (sin puntos, con guion, K en mayúscula).
 */

/** Deja solo dígitos y K, en mayúscula. "12.345.678-k" -> "12345678K". */
function clean(value: string): string {
  return value.replace(/[^0-9kK]/g, '').toUpperCase();
}

/** Dígito verificador esperado para un cuerpo numérico. */
function checkDigit(body: string): string {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return '0';
  if (rest === 10) return 'K';
  return String(rest);
}

/** Valida formato (7 u 8 dígitos + verificador) y dígito verificador. Vacío no es válido. */
export function isValidRut(value: string | null | undefined): boolean {
  const cleaned = clean(value ?? '');
  if (!/^\d{7,8}[0-9K]$/.test(cleaned)) return false;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return checkDigit(body) === dv;
}

/** "12.345.678-5" -> "12345678-5". Devuelve null si el texto está vacío. */
export function normalizeRut(value: string | null | undefined): string | null {
  const cleaned = clean(value ?? '');
  if (cleaned.length < 2) return null;
  return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`;
}

/** Validador de formularios: el campo es opcional, pero si se escribe debe ser un RUT válido. */
export function rutValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  return isValidRut(value) ? null : { rut: true };
}
