import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>Trazabilidad y Auditoría</h2>
      
      <div class="filters">
        <input type="text" placeholder="Usuario (Email)" [(ngModel)]="filters.user" />
        <input type="date" [(ngModel)]="filters.startDate" />
        <input type="date" [(ngModel)]="filters.endDate" />
        <select [(ngModel)]="filters.eventType">
          <option value="">Todos los eventos</option>
          <option value="REQUEST_CREATED">Trámite Creado</option>
          <option value="REQUEST_APPROVED">Trámite Aprobado</option>
          <option value="REQUEST_REJECTED">Trámite Rechazado</option>
        </select>
        <button class="btn-primary" (click)="fetchAuditLogs()">Filtrar</button>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Evento</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of auditLogs">
            <td>{{ log.timestamp | date:'short' }}</td>
            <td>{{ log.user }}</td>
            <td>{{ log.eventType }}</td>
            <td>{{ log.details }}</td>
          </tr>
          <tr *ngIf="auditLogs.length === 0">
            <td colspan="4">No hay registros de auditoría que coincidan con los filtros.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .filters input, .filters select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
  `]
})
export class Audit implements OnInit {
  auditLogs: any[] = [];
  filters = {
    user: '',
    startDate: '',
    endDate: '',
    eventType: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAuditLogs();
  }

  fetchAuditLogs() {
    let params = new HttpParams();
    if (this.filters.user) params = params.set('user', this.filters.user);
    if (this.filters.startDate) params = params.set('startDate', this.filters.startDate);
    if (this.filters.endDate) params = params.set('endDate', this.filters.endDate);
    if (this.filters.eventType) params = params.set('eventType', this.filters.eventType);

    this.http.get<any[]>('http://localhost:8080/api/audit', { params }).subscribe({
      next: (data) => this.auditLogs = data,
      error: (err) => console.error('Error cargando auditoría (BFF pendiente):', err)
    });
  }
}