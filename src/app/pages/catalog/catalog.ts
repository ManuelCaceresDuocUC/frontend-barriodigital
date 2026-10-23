import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CatalogService, ProcedureType } from '../../services/catalog.service';
import { httpErrorMessage } from '../../utils/http-error';
import { isNumber, normalizeText } from '../../utils/text';
import { Pagination } from '../../shared/pagination/pagination';

/** Tipo de trámite con el cupo usado hoy (null si no se pudo consultar). */
interface ProcedureRow extends ProcedureType {
  usedToday: number | null;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Pagination],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.scss']
})
export class Catalog implements OnInit {
  readonly nameMax = 100;
  readonly requirementsMax = 1000;

  readonly pageSizeOptions = [5, 10, 20, 50];

  procedures: ProcedureRow[] = [];

  // Búsqueda, filtros y paginación (todo en el cliente: el backend entrega la lista completa)
  searchTerm = '';
  statusFilter: '' | 'active' | 'inactive' = '';
  quotaFilter: '' | 'available' | 'full' = '';
  quotaMin: number | null = null;
  quotaMax: number | null = null;
  page = 1;
  pageSize = 10;
  filteredProcedures: ProcedureRow[] = [];
  pagedProcedures: ProcedureRow[] = [];
  isLoading = false;

  // Modal de crear / editar
  showModal = false;
  editingId: number | null = null;
  form!: FormGroup;
  isSaving = false;
  formError: string | null = null;

  // Desactivar (confirmación en la propia fila)
  pendingDeactivateId: number | null = null;
  isDeactivating = false;

  // Activar un tipo desactivado (id en curso, para deshabilitar los botones mientras responde)
  activatingId: number | null = null;

  pageError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private catalogService: CatalogService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.load();
  }

  /** Admin edita; Operador solo consulta (el backend también lo exige). */
  get isAdmin(): boolean {
    return this.authService.hasRole('Admin');
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm.trim() || this.statusFilter || this.quotaFilter
      || isNumber(this.quotaMin) || isNumber(this.quotaMax));
  }

  /** Mínimo mayor que máximo: ningún trámite puede cumplirlo. */
  get quotaRangeInvalid(): boolean {
    return isNumber(this.quotaMin) && isNumber(this.quotaMax) && this.quotaMin > this.quotaMax;
  }

  /** Aplica búsqueda y filtros sobre la lista completa y recalcula la página visible. */
  applyFilters(): void {
    const term = normalizeText(this.searchTerm);

    this.filteredProcedures = this.procedures.filter(p => {
      if (term && !(normalizeText(p.name).includes(term) || normalizeText(p.requirements).includes(term))) {
        return false;
      }
      if (this.statusFilter === 'active' && !p.active) return false;
      if (this.statusFilter === 'inactive' && p.active) return false;

      // Con cupo / agotado se calcula con el usado hoy; si no se pudo consultar (null), no se puede afirmar ninguno
      if (this.quotaFilter) {
        if (p.usedToday === null) return false;
        const full = p.usedToday >= p.dailyQuota;
        if (this.quotaFilter === 'full' && !full) return false;
        if (this.quotaFilter === 'available' && full) return false;
      }

      if (isNumber(this.quotaMin) && p.dailyQuota < this.quotaMin) return false;
      if (isNumber(this.quotaMax) && p.dailyQuota > this.quotaMax) return false;
      return true;
    });

    this.updatePage();
  }

  /** Recorta la lista filtrada a la página actual (y corrige la página si quedó fuera de rango). */
  private updatePage(): void {
    const totalPages = Math.max(1, Math.ceil(this.filteredProcedures.length / this.pageSize));
    if (this.page > totalPages) {
      this.page = totalPages;
    }
    const start = (this.page - 1) * this.pageSize;
    this.pagedProcedures = this.filteredProcedures.slice(start, start + this.pageSize);
  }

  /** Cambió la búsqueda o algún filtro: se vuelve a la primera página. */
  onFilterChange(): void {
    this.page = 1;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.updatePage();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.updatePage();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.quotaFilter = '';
    this.quotaMin = null;
    this.quotaMax = null;
    this.onFilterChange();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(this.nameMax)]],
      requirements: ['', [Validators.required, Validators.maxLength(this.requirementsMax)]],
      dailyQuota: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]]
    });
  }

  /** Carga los tipos y, para cada uno, el cupo usado hoy. */
  load(): void {
    this.isLoading = true;
    this.pageError = null;

    this.catalogService.list()
      .pipe(
        switchMap(list =>
          list.length === 0
            ? of([] as ProcedureRow[])
            : forkJoin(list.map(p =>
                this.catalogService.quota(p.id).pipe(
                  map(q => ({ ...p, usedToday: q.used }) as ProcedureRow),
                  catchError(() => of({ ...p, usedToday: null } as ProcedureRow))
                )
              ))
        ),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: rows => {
          this.procedures = rows;
          this.applyFilters();
        },
        error: err => {
          console.error('Error al cargar el catálogo:', err);
          this.procedures = [];
          this.applyFilters();
          this.pageError = httpErrorMessage(err, 'No se pudo cargar el catálogo.');
        }
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formError = null;
    this.form.reset({ name: '', requirements: '', dailyQuota: 0 });
    this.showModal = true;
  }

  openEdit(p: ProcedureRow): void {
    this.editingId = p.id;
    this.formError = null;
    this.form.reset({ name: p.name, requirements: p.requirements, dailyQuota: p.dailyQuota });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isSaving) return;

    this.isSaving = true;
    this.formError = null;

    const payload = {
      name: String(this.form.value.name).trim(),
      requirements: String(this.form.value.requirements).trim(),
      dailyQuota: Number(this.form.value.dailyQuota)
    };

    const request$ = this.editingId === null
      ? this.catalogService.create(payload)
      : this.catalogService.update(this.editingId, payload);

    request$
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
        },
        error: err => {
          console.error('Error al guardar el tipo de trámite:', err);
          this.formError = httpErrorMessage(err, 'No se pudo guardar el tipo de trámite.');
        }
      });
  }

  askDeactivate(id: number): void {
    this.pendingDeactivateId = id;
  }

  cancelDeactivate(): void {
    this.pendingDeactivateId = null;
  }

  confirmDeactivate(id: number): void {
    if (this.isDeactivating) return;

    this.isDeactivating = true;
    this.pageError = null;

    this.catalogService.deactivate(id)
      .pipe(
        finalize(() => {
          this.isDeactivating = false;
          this.pendingDeactivateId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.load(),
        error: err => {
          console.error('Error al desactivar:', err);
          this.pageError = httpErrorMessage(err, 'No se pudo desactivar el tipo de trámite.');
        }
      });
  }

  /** Vuelve a ofrecer un tipo desactivado. No es destructivo, así que no pide confirmación. */
  activate(id: number): void {
    if (this.activatingId !== null) return;

    this.activatingId = id;
    this.pageError = null;

    this.catalogService.activate(id)
      .pipe(
        finalize(() => {
          this.activatingId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.load(),
        error: err => {
          console.error('Error al activar:', err);
          this.pageError = httpErrorMessage(err, 'No se pudo activar el tipo de trámite.');
        }
      });
  }

  trackById(_: number, p: ProcedureRow): number {
    return p.id;
  }
}
