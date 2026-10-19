/**
 * Mensaje legible para un error de HttpClient: el que manda el servidor
 * (400 validación, 409 duplicado o sin cupo...) o uno genérico.
 */
export function httpErrorMessage(err: any, fallback: string): string {
  if (err?.status === 0) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  return err?.error?.message || fallback;
}
