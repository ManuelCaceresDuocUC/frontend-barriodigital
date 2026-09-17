import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Catálogo de Servicios y Cupos</h2>
      <div class="catalog-grid">
        <div class="card" *ngFor="let item of catalogItems">
          <h3>{{ item.name }}</h3>
          <p>Cupos disponibles: {{ item.stock }}</p>
          <button [disabled]="item.stock === 0">Reservar</button>
        </div>
      </div>
      <p *ngIf="catalogItems.length === 0">Cargando catálogo...</p>
    </div>
  `
})
export class Catalog implements OnInit {
  catalogItems: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCatalog();
  }

  fetchCatalog() {
    this.http.get<any[]>('http://localhost:8080/api/catalog').subscribe({
      next: (data) => this.catalogItems = data,
      error: (err) => console.error('Error cargando catálogo (BFF pendiente):', err)
    });
  }
}