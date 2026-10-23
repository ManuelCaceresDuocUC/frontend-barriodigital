import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Barra de paginación reutilizable. No conoce los datos: recibe el total, la página y el
 * tamaño actuales, y avisa con eventos cuando el usuario los cambia. La página que muestra
 * (el "slice") la calcula quien la usa.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.scss']
})
export class Pagination {
  /** Cantidad total de elementos (ya filtrados). */
  @Input() total = 0;
  /** Página actual, desde 1. */
  @Input() page = 1;
  /** Elementos por página. */
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  /** Cuántos números de página se muestran a la vez. */
  private readonly windowSize = 5;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / Math.max(1, this.pageSize)));
  }

  /** Primer elemento mostrado (1-based); 0 si no hay elementos. */
  get from(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get to(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  /** Ventana de números de página centrada en la actual. */
  get pages(): number[] {
    const last = this.totalPages;
    const start = Math.max(1, Math.min(this.page - Math.floor(this.windowSize / 2), last - this.windowSize + 1));
    const end = Math.min(last, start + this.windowSize - 1);
    const result: number[] = [];
    for (let p = start; p <= end; p++) {
      result.push(p);
    }
    return result;
  }

  go(target: number): void {
    const next = Math.min(Math.max(1, target), this.totalPages);
    if (next !== this.page) {
      this.pageChange.emit(next);
    }
  }

  onSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (Number.isInteger(size) && size > 0 && size !== this.pageSize) {
      this.pageSizeChange.emit(size);
    }
  }
}
