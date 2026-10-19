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

/** Acceso a los tipos de trámite de ms-barriodigital-catalog (vía BFF / API Gateway). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly baseUrl = `${environment.apiBffUrl}/api/catalog/procedures`;

  constructor(private http: HttpClient) {}

  /** Cliente recibe solo los tipos activos; Operador y Admin reciben todos. */
  list(): Observable<ProcedureType[]> {
    return this.http.get<ProcedureType[]>(this.baseUrl);
  }
}
