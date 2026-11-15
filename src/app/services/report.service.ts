import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Totales globales calculados por ms-barriodigital-report a partir de los eventos de Kafka. */
export interface Kpis {
  totalRequests: number;
  totalSuccess: number;
  totalFailed: number;
}

/** Métricas de un tipo de trámite: ingresados, resueltos y rechazados. */
export interface ProcedureMetric {
  actionName: string;
  totalRequests: number;
  successCount: number;
  failedCount: number;
}

/** Reportería en tiempo real (Admin) vía BFF / API Gateway. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly baseUrl = `${environment.apiBffUrl}/api/report`;

  constructor(private http: HttpClient) {}

  getKpis(): Observable<Kpis> {
    return this.http.get<Kpis>(`${this.baseUrl}/kpis`);
  }

  getProcedures(): Observable<ProcedureMetric[]> {
    return this.http.get<ProcedureMetric[]>(`${this.baseUrl}/top-procedures`);
  }
}
