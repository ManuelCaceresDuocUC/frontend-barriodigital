import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Mis Trámites</h2>
      <button class="btn-primary" (click)="createRequest()">+ Nuevo Trámite</button>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let req of requests">
            <td>{{ req.id }}</td>
            <td>{{ req.type }}</td>
            <td>{{ req.status }}</td>
            <td>{{ req.date }}</td>
          </tr>
          <tr *ngIf="requests.length === 0">
            <td colspan="4">No hay trámites registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class Requests implements OnInit {
  requests: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchRequests();
  }

  fetchRequests() {
    // El MsalInterceptor adjuntará el Bearer token automáticamente aquí
    this.http.get<any[]>('http://localhost:8080/api/requests').subscribe({
      next: (data) => this.requests = data,
      error: (err) => console.error('Error cargando trámites (BFF pendiente):', err)
    });
  }

  createRequest() {
    console.log('Abrir formulario de nuevo trámite');
  }
}