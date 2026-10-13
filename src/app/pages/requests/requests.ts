import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; // 1. Importar AuthService

export interface RequestModel {
  id?: number;
  type: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  userId?: string | null;
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
  
  private apiUrl = 'https://lkbz5es695.execute-api.us-east-1.amazonaws.com/api/requests';

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public authService: AuthService // 2. Inyectar AuthService como público para usarlo en el HTML
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.fetchRequests();
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      type: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  fetchRequests(): void {
    this.isLoading = true;

    this.http.get<any[]>(this.apiUrl)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos:', data);
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
              userId: item?.userId ?? null
            };
          });
        },
        error: (err) => {
          console.error('Error al conectar con la API:', err);
        }
      });
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    const payload = {
      type: this.requestForm.value.type,
      description: this.requestForm.value.description,
      status: 'INGRESADO'
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.showModal = false;
        this.requestForm.reset();
        this.fetchRequests();
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        alert('Ocurrió un error al guardar la solicitud.');
      }
    });
  }

  // 3. Nuevo método para cambiar el estado de la solicitud (Máquina de Estados)
  updateStatus(id?: number, newStatus?: string): void {
    if (!id || !newStatus) return;

    this.isLoading = true;
    const body = { status: newStatus };

    this.http.put(`${this.apiUrl}/${id}/status`, body)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.fetchRequests(); // Recargar la lista tras actualizar
        },
        error: (err) => {
          console.error('Error al actualizar estado:', err);
          alert(err?.error?.message || 'Error al actualizar el estado de la solicitud.');
        }
      });
  }
}