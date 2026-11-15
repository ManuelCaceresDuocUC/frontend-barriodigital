import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/** Un mensaje de Kafka tal como lo guardó ms-barriodigital-audit. */
export interface AuditEvent {
  id: number;
  topicName: string;
  partitionNumber?: number | null;
  recordOffset?: number | null;
  eventKey?: string | null;
  payload: string;
  receivedAt: string;
}

export interface AuditPage {
  events: AuditEvent[];
  total: number;
}

/** Tópicos que se auditan. */
export const AUDIT_TOPICS = ['requests.events', 'audit.timeline'];

/** Consulta de auditoría (Auditor y Admin) vía BFF / API Gateway. */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly baseUrl = `${environment.apiBffUrl}/api/audit/events`;

  constructor(private http: HttpClient) {}

  /** @param topic tópico a filtrar; vacío trae todos. @param page página desde 1. */
  list(topic: string, page: number, size: number): Observable<AuditPage> {
    const url = topic ? `${this.baseUrl}/topic/${encodeURIComponent(topic)}` : this.baseUrl;
    const params = new HttpParams()
      .set('page', page - 1)
      .set('size', size)
      .set('sort', 'receivedAt,desc');
    // Spring puede entregar el total en la raíz o dentro de "page", según su modo de serialización.
    return this.http
      .get<{ content: AuditEvent[]; totalElements?: number; page?: { totalElements?: number } }>(url, { params })
      .pipe(map(body => ({
        events: body.content ?? [],
        total: body.totalElements ?? body.page?.totalElements ?? (body.content ?? []).length
      })));
  }
}
