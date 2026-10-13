import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  summary: string;
  imageIcon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {
  // Noticias Comunales
  newsList: NewsItem[] = [
    {
      id: 1,
      title: 'Corte Programado de Agua Potable por Mantención',
      category: 'Servicios Básicos',
      date: '28 Sep 2026',
      summary: 'El sector norte tendrá suspensión temporal del servicio entre las 22:00 y las 06:00 hrs.',
      imageIcon: '🚰'
    },
    {
      id: 2,
      title: 'Inauguración de la Nueva Plaza de la Infancia',
      category: 'Comunidad',
      date: '26 Sep 2026',
      summary: 'Contamos con más de 1.500 m² de áreas verdes y juegos inclusivos para las familias.',
      imageIcon: '🌳'
    },
    {
      id: 3,
      title: 'Operativo Gratuito de Vacunación de Mascotas',
      category: 'Salud Animal',
      date: '24 Sep 2026',
      summary: 'Este sábado en la junta de vecinos #12 se aplicarán vacunas antirrábicas y microchips.',
      imageIcon: '🐶'
    }
  ];
}