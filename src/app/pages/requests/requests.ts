import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CatalogService, ProcedureType } from '../../services/catalog.service';
import { environment } from '../../../environments/environment';
import { normalizeRut, rutValidator } from '../../utils/rut';

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.scss']
})
export class Requests implements OnInit {
  requestsList: RequestModel[] = [];
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
      citizenRut: ['', [rutValidator]]
    });
  }

  /** Tipo de trámite elegido en el formulario (para mostrar sus requisitos). */
  get selectedProcedure(): ProcedureType | null {
    const id = this.requestForm?.value?.procedureId;
    return this.procedures.find(p => p.id === id) ?? null;
  }

  openModal(): void {
    this.formError = null;
    this.requestForm.reset({ procedureId: null, description: '', citizenRut: '' });
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
              userEmail: item?.userEmail || item?.userId || 'Vecino Anónimo'
            };
          });
        },
        error: (err) => {
          console.error('Error al conectar con la API:', err);
          this.pageError = this.errorMessage(err, 'No se pudieron cargar las solicitudes.');
        }
      });
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
      ...(citizenRut ? { citizenRut } : {})
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
          this.requestForm.reset({ procedureId: null, description: '', citizenRut: '' });
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
