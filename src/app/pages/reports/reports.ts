import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, forkJoin, timer } from 'rxjs';
import { Kpis, ProcedureMetric, ReportService } from '../../services/report.service';

/** Cada cuántos milisegundos se refrescan las métricas. */
const REFRESH_MS = 5000;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports implements OnInit, OnDestroy {
  kpis: Kpis = { totalRequests: 0, totalSuccess: 0, totalFailed: 0 };
  procedures: ProcedureMetric[] = [];
  isLoading = true;
  paused = false;
  lastUpdate: Date | null = null;
  pageError = '';

  private polling?: Subscription;

  constructor(private reportService: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.polling?.unsubscribe();
  }

  /** Trámites ingresados que aún no se resuelven ni se rechazan. */
  get inProgress(): number {
    return Math.max(0, this.kpis.totalRequests - this.kpis.totalSuccess - this.kpis.totalFailed);
  }

  /** Porcentaje de trámites ingresados que terminaron resueltos. */
  get resolutionRate(): number {
    return this.percent(this.kpis.totalSuccess, this.kpis.totalRequests);
  }

  percent(part: number, total: number): number {
    return total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;
  }

  togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.polling?.unsubscribe();
    } else {
      this.startPolling();
    }
  }

  refreshNow(): void {
    this.load();
  }

  trackByName(_: number, p: ProcedureMetric): string {
    return p.actionName;
  }

  /** Refresca de inmediato y luego cada REFRESH_MS; al pausar o salir de la vista se cancela. */
  private startPolling(): void {
    this.polling?.unsubscribe();
    this.polling = timer(0, REFRESH_MS).subscribe(() => this.load());
  }

  private load(): void {
    forkJoin({ kpis: this.reportService.getKpis(), procedures: this.reportService.getProcedures() }).subscribe({
      next: ({ kpis, procedures }) => {
        this.kpis = kpis;
        this.procedures = procedures;
        this.lastUpdate = new Date();
        this.pageError = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.pageError = this.describeError(err);
        this.cdr.detectChanges();
      }
    });
  }

  private describeError(err: HttpErrorResponse): string {
    if (err.status === 403) return 'No tienes permiso para ver los reportes (se requiere rol Admin).';
    if (err.status === 502 || err.status === 504) return 'El servicio de reportes no responde. Reintentando en el próximo ciclo.';
    return 'No se pudieron cargar las métricas.';
  }
}
