import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface ServiceItem {
  id: number;
  title: string;
  category: string;
  description: string;
  estimatedDays: number;
  icon: string;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.scss']
})
export class Catalog {
  searchTerm = '';

  services: ServiceItem[] = [
    { id: 1, title: 'Reparación de Alumbrado', category: 'Infraestructura', description: 'Solicita la reparación o reemplazo de luminarias defectuosas en la vía pública.', estimatedDays: 3, icon: '💡' },
    { id: 2, title: 'Retiro de Escombros', category: 'Aseo', description: 'Coordinación para la recolección de voluminosos y residuos de construcción.', estimatedDays: 5, icon: '🚛' },
    { id: 3, title: 'Poda Urbana', category: 'Ornato', description: 'Mantenimiento preventivo y despeje de ramas en áreas de circulación.', estimatedDays: 7, icon: '🌳' },
    { id: 4, title: 'Patente Comercial', category: 'Trámites', description: 'Obtención o renovación de permisos para actividades comerciales.', estimatedDays: 10, icon: '📜' }
  ];

  get filteredServices() {
    return this.services.filter(s => 
      s.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}