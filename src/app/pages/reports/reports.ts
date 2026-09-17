import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Reportes y KPIs</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <h3>Trámites Totales</h3>
          <p class="kpi-value">{{ kpis?.total || 0 }}</p>
        </div>
        <div class="kpi-card">
          <h3>Aprobados</h3>
          <p class="kpi-value kpi-success">{{ kpis?.approved || 0 }}</p>
        </div>
        <div class="kpi-card">
          <h3>Rechazados</h3>
          <p class="kpi-value kpi-danger">{{ kpis?.rejected || 0 }}</p>
        </div>
        <div class="kpi-card">
          <h3>Tiempo Promedio (hs)</h3>
          <p class="kpi-value">{{ kpis?.avgProcessingTime || 0 }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid { display: flex; gap: 20px; flex-wrap: wrap; }
    .kpi-card { border: 1px solid #ccc; padding: 20px; border-radius: 8px; min-width: 200px; text-align: center; }
    .kpi-value { font-size: 2rem; font-weight: bold; margin: 10px 0; }
    .kpi-success { color: green; }
    .kpi-danger { color: red; }
  `]
})
export class Reports implements OnInit {
  kpis: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchKPIs();
  }

  fetchKPIs() {
    this.http.get<any>('http://localhost:8080/api/reports/kpis').subscribe({
      next: (data) => this.kpis = data,
      error: (err) => console.error('Error cargando KPIs (BFF pendiente):', err)
    });
  }
}