import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProcedureType {
  id: number;
  name: string;
  requirements: string;
  dailyQuota: number;
  active: boolean;
}

/** Datos que se envían al crear o editar un tipo de trámite. */
export interface ProcedureRequest {
  name: string;
  requirements: string;
  dailyQuota: number;
}

/** Cupo de un tipo de trámite para el día de hoy. */
export interface QuotaStatus {
  procedureId: number;
  name: string;
  date: string;
  dailyQuota: number;
  used: number;
  available: number;
}

/** Acceso a los tipos de trámite de ms-barriodigital-catalog (vía BFF / API Gateway). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly baseUrl = `${environment.apiBffUrl}/api/catalog/procedures`;

  constructor(private http: HttpClient) {}

  /** Cliente recibe solo los tipos activos; Operador y Admin reciben todos. */
  list(): Observable<ProcedureType[]> {
    return this.http.get<ProcedureType[]>(this.baseUrl);
  }

  /** Solo Admin. */
  create(request: ProcedureRequest): Observable<ProcedureType> {
    return this.http.post<ProcedureType>(this.baseUrl, request);
  }

  /** Solo Admin. */
  update(id: number, request: ProcedureRequest): Observable<ProcedureType> {
    return this.http.put<ProcedureType>(`${this.baseUrl}/${id}`, request);
  }

  /** Solo Admin. Baja lógica: el tipo deja de ofrecerse, pero no se borra. */
  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Admin y Operador. */
  quota(id: number): Observable<QuotaStatus> {
    return this.http.get<QuotaStatus>(`${this.baseUrl}/${id}/quota`);
  }
}
