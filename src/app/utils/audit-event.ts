/** Resumen legible de un mensaje de Kafka guardado por auditoría. */
export interface AuditSummary {
  title: string;
  detail?: string;
}

interface Crew {
  name?: string;
  members?: string;
  vehiclePlate?: string;
}

interface EventBody {
  eventType?: string;
  requestId?: number;
  procedureType?: string;
  fromStatus?: string;
  toStatus?: string;
  previousStatus?: string;
  status?: string;
  reason?: string;
  actorName?: string;
  actorRole?: string;
  crew?: Crew | null;
}

/** Convierte el JSON de un evento en una frase; si no se puede leer, devuelve el texto tal cual. */
export function summarizeEvent(topic: string, payload: string): AuditSummary {
  let body: EventBody;
  try {
    body = JSON.parse(payload) as EventBody;
  } catch {
    return { title: 'Mensaje no interpretable' };
  }
  const id = body.requestId != null ? `Trámite #${body.requestId}` : 'Trámite';

  if (topic === 'audit.timeline') {
    const who = body.actorName ? `${body.actorName}${body.actorRole ? ` (${body.actorRole})` : ''}` : 'personal municipal';
    const details: string[] = [];
    if (body.reason) details.push(`Motivo: ${body.reason}`);
    if (body.crew?.name) {
      details.push(`Cuadrilla: ${body.crew.name}${body.crew.vehiclePlate ? ` · patente ${body.crew.vehiclePlate}` : ''}`);
    }
    return {
      title: `${id}: ${body.fromStatus ?? 'nuevo'} → ${body.toStatus ?? '?'} por ${who}`,
      detail: details.length ? details.join(' · ') : undefined
    };
  }

  if (body.eventType === 'REQUEST_CREATED') {
    return { title: `${id} ingresado`, detail: body.procedureType ? `Tipo: ${body.procedureType}` : undefined };
  }
  return {
    title: `${id}: ${body.previousStatus ?? 'nuevo'} → ${body.status ?? '?'}`,
    detail: body.procedureType ? `Tipo: ${body.procedureType}` : undefined
  };
}

/** JSON con sangría para mostrarlo; si no es JSON válido, el texto original. */
export function prettyJson(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}
