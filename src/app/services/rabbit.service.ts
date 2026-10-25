import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Estado de una cola, tal como lo entrega ms-barriodigital-rabbitadmin. */
export interface QueueInfo {
  name: string;
  durable?: boolean;
  autoDelete?: boolean;
  messages: number;
  consumers: number;
  state?: string;
  protectedResource: boolean;
}

/** Por qué y desde dónde llegó un mensaje a la DLQ. */
export interface DeathInfo {
  queue?: string;
  exchange?: string;
  routingKeys?: string[];
  reason?: string;
  count?: number;
  time?: string;
}

/** Mensaje de una DLQ. El correo y el RUT del cuerpo ya vienen enmascarados desde el backend. */
export interface DlqMessage {
  exchange?: string;
  routingKey?: string;
  redelivered: boolean;
  payload?: string;
  binary: boolean;
  payloadBytes: number;
  payloadTruncated: boolean;
  death?: DeathInfo;
}

/** Monitoreo de RabbitMQ (solo Admin) vía BFF / API Gateway. */
@Injectable({ providedIn: 'root' })
export class RabbitService {
  private readonly baseUrl = `${environment.apiBffUrl}/api/rabbit/queues`;

  constructor(private http: HttpClient) {}

  listQueues(): Observable<QueueInfo[]> {
    return this.http.get<QueueInfo[]>(this.baseUrl);
  }

  /** Lee (sin consumir) los mensajes de una DLQ. El backend rechaza con 403 cualquier otra cola. */
  peekMessages(queue: string, count: number): Observable<DlqMessage[]> {
    const params = new HttpParams().set('count', count);
    return this.http.get<DlqMessage[]>(`${this.baseUrl}/${encodeURIComponent(queue)}/messages`, { params });
  }
}
