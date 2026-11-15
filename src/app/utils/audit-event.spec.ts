import { prettyJson, summarizeEvent } from './audit-event';

describe('summarizeEvent', () => {
  it('resume un cambio del personal con motivo y cuadrilla', () => {
    const payload = JSON.stringify({
      requestId: 7, fromStatus: 'EN_TERRENO', toStatus: 'EN_GESTION', reason: 'Camión averiado',
      actorName: 'Pedro', actorRole: 'Operador', crew: { name: 'Cuadrilla Norte', vehiclePlate: 'ABCD12' }
    });
    const summary = summarizeEvent('audit.timeline', payload);
    expect(summary.title).toBe('Trámite #7: EN_TERRENO → EN_GESTION por Pedro (Operador)');
    expect(summary.detail).toBe('Motivo: Camión averiado · Cuadrilla: Cuadrilla Norte · patente ABCD12');
  });

  it('resume un trámite ingresado', () => {
    const summary = summarizeEvent('requests.events',
      JSON.stringify({ eventType: 'REQUEST_CREATED', requestId: 3, procedureType: 'Poda', status: 'INGRESADO' }));
    expect(summary.title).toBe('Trámite #3 ingresado');
    expect(summary.detail).toBe('Tipo: Poda');
  });

  it('resume un cambio de estado de requests.events', () => {
    const summary = summarizeEvent('requests.events',
      JSON.stringify({ eventType: 'REQUEST_STATUS_CHANGED', requestId: 3, previousStatus: 'INGRESADO', status: 'ADMITIDO' }));
    expect(summary.title).toBe('Trámite #3: INGRESADO → ADMITIDO');
  });

  it('no falla con un mensaje que no es JSON', () => {
    expect(summarizeEvent('requests.events', 'texto').title).toBe('Mensaje no interpretable');
    expect(prettyJson('texto')).toBe('texto');
  });
});
