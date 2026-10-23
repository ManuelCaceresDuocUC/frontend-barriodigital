import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CatalogService, ProcedureType } from '../../services/catalog.service';
import { environment } from '../../../environments/environment';
import { normalizeRut, rutValidator } from '../../utils/rut';
import { normalizeText } from '../../utils/text';
import { Pagination } from '../../shared/pagination/pagination';

export interface RequestModel {
  id?: number;
  type: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  userId?: string | null;
  userEmail?: string | null;
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Pagination],
  templateUrl: './requests.html',
  styleUrls: ['./requests.scss']
})
export class Requests implements OnInit {
  /** Estados posibles de una solicitud (valores del enum del backend). */
  readonly statusOptions = ['INGRESADO', 'ADMITIDO', 'EN_GESTION', 'EN_TERRENO', 'RESUELTO', 'RECHAZADO'];
  readonly pageSizeOptions = [5, 10, 20, 50];

  requestsList: RequestModel[] = [];

  // Búsqueda, filtros y paginación (todo en el cliente: el backend entrega la lista completa)
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  requesterFilter = '';
  dateFrom = '';
  dateTo = '';
  page = 1;
  pageSize = 10;
  filteredRequests: RequestModel[] = [];
  pagedRequests: RequestModel[] = [];
  typeOptions: string[] = [];
  requesterOptions: string[] = [];

  isLoading = false;
  showModal = false;
  requestForm!: FormGroup;

  // Tipos de trámite (catálogo)
  procedures: ProcedureType[] = [];
  proceduresLoading = false;
  proceduresError: string | null = null;

  // Estado de las peticiones en curso y errores visibles
  isSaving = false;
  isUpdating = false;
  formError: string | null = null;
  pageError: string | null = null;

  private apiUrl = `${environment.apiBffUrl}/api/requests`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private catalogService: CatalogService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.fetchRequests();
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      procedureId: [null, Validators.required],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      citizenRut: ['', [rutValidator]],
      // Solo el personal lo completa; un Cliente usa el correo de su cuenta (lo toma el backend del JWT).
      citizenEmail: ['', this.isStaff ? [Validators.required, Validators.email, Validators.maxLength(254)] : []]
    });
  }

  /** Operador y Admin ingresan la solicitud a nombre de un vecino, así que deben indicar su correo. */
  get isStaff(): boolean {
    return this.authService.hasAnyRole(['Operador', 'Admin']);
  }

  /** La columna y el filtro de solicitante solo existen para el personal. */
  get canSeeRequester(): boolean {
    return this.authService.hasAnyRole(['Operador', 'Admin', 'Auditor']);
  }

  /** Columnas visibles de la tabla (para el colspan de las filas vacías). */
  get columnCount(): number {
    return 4 + (this.canSeeRequester ? 1 : 0) + (this.isStaff ? 1 : 0);
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm.trim() || this.statusFilter || this.typeFilter
      || this.requesterFilter || this.dateFrom || this.dateTo);
  }

  /** "Desde" posterior a "Hasta": ninguna solicitud puede cumplirlo. */
  get dateRangeInvalid(): boolean {
    return !!this.dateFrom && !!this.dateTo && this.dateFrom > this.dateTo;
  }

  /** Tipo de trámite elegido en el formulario (para mostrar sus requisitos). */
  get selectedProcedure(): ProcedureType | null {
    const id = this.requestForm?.value?.procedureId;
    return this.procedures.find(p => p.id === id) ?? null;
  }

  openModal(): void {
    this.formError = null;
    this.requestForm.reset({ procedureId: null, description: '', citizenRut: '', citizenEmail: '' });
    this.showModal = true;
    this.loadProcedures();
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = null;
  }

  loadProcedures(): void {
    this.proceduresLoading = true;
    this.proceduresError = null;

    this.catalogService.list()
      .pipe(
        finalize(() => {
          this.proceduresLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.procedures = (Array.isArray(data) ? data : []).filter(p => p.active);
        },
        error: (err) => {
          console.error('Error al cargar el catálogo:', err);
          this.procedures = [];
          this.proceduresError = this.errorMessage(err, 'No se pudieron cargar los tipos de trámite.');
        }
      });
  }

  /**
   * Carga las solicitudes. El backend decide qué ve cada rol (un Cliente recibe solo
   * las suyas), así que aquí no se filtra nada: la autorización no vive en la pantalla.
   */
  fetchRequests(): void {
    this.isLoading = true;
    this.pageError = null;

    this.http.get<any[]>(this.apiUrl)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          const rawList = Array.isArray(data) ? data : [];

          this.requestsList = rawList.map(item => {
            let formattedDate = 'Sin Fecha';
            if (item && item.createdAt) {
              formattedDate = String(item.createdAt).replace('T', ' ').split('.')[0];
            }

            return {
              id: item?.id ?? 0,
              type: item?.type ?? 'Sin Tipo',
              description: item?.description ?? 'Sin Descripción',
              status: item?.status ?? 'INGRESADO',
              createdAt: formattedDate,
              userId: item?.userId || item?.userEmail || item?.createdBy || null,
              userEmail: item?.requesterEmail || item?.userEmail || item?.userId || 'Vecino Anónimo'
            };
          });

          this.buildFilterOptions();
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error al conectar con la API:', err);
          this.pageError = this.errorMessage(err, 'No se pudieron cargar las solicitudes.');
        }
      });
  }

  /** Valores de los desplegables de tipo y solicitante, tomados de las solicitudes cargadas. */
  private buildFilterOptions(): void {
    const distinctSorted = (values: (string | null | undefined)[]): string[] =>
      [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, 'es'));

    this.typeOptions = distinctSorted(this.requestsList.map(r => r.type));
    this.requesterOptions = distinctSorted(this.requestsList.map(r => r.userEmail));
  }

  /** Aplica búsqueda y filtros sobre la lista completa y recalcula la página visible. */
  applyFilters(): void {
    // "#108" y "108" buscan lo mismo
    const term = normalizeText(this.searchTerm).replace(/^#/, '');

    this.filteredRequests = this.requestsList.filter(r => {
      if (term) {
        const matches = String(r.id ?? '').includes(term)
          || normalizeText(r.userEmail).includes(term)
          || normalizeText(r.description).includes(term);
        if (!matches) return false;
      }
      if (this.statusFilter && r.status !== this.statusFilter) return false;
      if (this.typeFilter && r.type !== this.typeFilter) return false;
      if (this.requesterFilter && r.userEmail !== this.requesterFilter) return false;

      if (this.dateFrom || this.dateTo) {
        // createdAt llega como "yyyy-MM-dd HH:mm:ss"; el día son los 10 primeros caracteres
        const day = r.createdAt.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
        if (this.dateFrom && day < this.dateFrom) return false;
        if (this.dateTo && day > this.dateTo) return false;
      }
      return true;
    });

    this.updatePage();
  }

  /** Recorta la lista filtrada a la página actual (y corrige la página si quedó fuera de rango). */
  private updatePage(): void {
    const totalPages = Math.max(1, Math.ceil(this.filteredRequests.length / this.pageSize));
    if (this.page > totalPages) {
      this.page = totalPages;
    }
    const start = (this.page - 1) * this.pageSize;
    this.pagedRequests = this.filteredRequests.slice(start, start + this.pageSize);
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
    this.typeFilter = '';
    this.requesterFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.onFilterChange();
  }

  trackById(_: number, item: RequestModel): number | undefined {
    return item.id;
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    if (this.isSaving) return;

    this.isSaving = true;
    this.formError = null;

    // El dueño de la solicitud lo determina el backend a partir del JWT; no se envía userId.
    // El RUT es opcional: solo se envía si se escribió, ya normalizado ("12345678-5").
    const citizenRut = normalizeRut(this.requestForm.value.citizenRut);
    const payload = {
      procedureId: this.requestForm.value.procedureId,
      description: this.requestForm.value.description,
      ...(citizenRut ? { citizenRut } : {}),
      ...(this.isStaff ? { citizenEmail: String(this.requestForm.value.citizenEmail).trim() } : {})
    };

    this.http.post(this.apiUrl, payload)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.requestForm.reset({ procedureId: null, description: '', citizenRut: '', citizenEmail: '' });
          this.fetchRequests();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.formError = this.errorMessage(err, 'Ocurrió un error al guardar la solicitud.');
        }
      });
  }

  updateStatus(id?: number, newStatus?: string): void {
    if (!id || !newStatus || this.isUpdating) return;

    this.isUpdating = true;
    this.pageError = null;
    const body = { status: newStatus };

    this.http.put(`${this.apiUrl}/${id}/status`, body)
      .pipe(
        finalize(() => {
          this.isUpdating = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.fetchRequests();
        },
        error: (err) => {
          console.error('Error al actualizar estado:', err);
          this.pageError = this.errorMessage(err, 'Error al actualizar el estado de la solicitud.');
        }
      });
  }

  /** Mensaje del servidor si lo hay (409 sin cupo o transición inválida, 400 validación...), o uno genérico. */
  private errorMessage(err: any, fallback: string): string {
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    }
    return err?.error?.message || fallback;
  }
}
