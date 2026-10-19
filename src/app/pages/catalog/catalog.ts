import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CatalogService, ProcedureType } from '../../services/catalog.service';
import { httpErrorMessage } from '../../utils/http-error';

/** Tipo de trámite con el cupo usado hoy (null si no se pudo consultar). */
interface ProcedureRow extends ProcedureType {
  usedToday: number | null;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.scss']
})
export class Catalog implements OnInit {
  readonly nameMax = 100;
  readonly requirementsMax = 1000;

  procedures: ProcedureRow[] = [];
  searchTerm = '';
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

  get filteredProcedures(): ProcedureRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.procedures;
    return this.procedures.filter(p =>
      p.name.toLowerCase().includes(term) || p.requirements.toLowerCase().includes(term)
    );
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
        next: rows => (this.procedures = rows),
        error: err => {
          console.error('Error al cargar el catálogo:', err);
          this.procedures = [];
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

  trackById(_: number, p: ProcedureRow): number {
    return p.id;
  }
}
