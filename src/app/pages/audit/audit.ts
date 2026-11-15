import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Pagination } from '../../shared/pagination/pagination';
import { AUDIT_TOPICS, AuditEvent, AuditService } from '../../services/audit.service';
import { AuditSummary, prettyJson, summarizeEvent } from '../../utils/audit-event';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, Pagination],
  templateUrl: './audit.html',
  styleUrl: './audit.scss'
})
export class Audit implements OnInit {
  readonly topics = AUDIT_TOPICS;

  events: AuditEvent[] = [];
  total = 0;
  topic = '';
  page = 1;
  pageSize = 10;
  isLoading = true;
  pageError = '';
  expandedId: number | null = null;

  constructor(private auditService: AuditService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  onTopicChange(): void {
    this.page = 1;
    this.load();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.load();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.load();
  }

  toggle(event: AuditEvent): void {
    this.expandedId = this.expandedId === event.id ? null : event.id;
  }

  summary(event: AuditEvent): AuditSummary {
    return summarizeEvent(event.topicName, event.payload);
  }

  pretty(event: AuditEvent): string {
    return prettyJson(event.payload);
  }

  trackById(_: number, event: AuditEvent): number {
    return event.id;
  }

  load(): void {
    this.isLoading = true;
    this.expandedId = null;
    this.auditService.list(this.topic, this.page, this.pageSize).subscribe({
      next: result => {
        this.events = result.events;
        this.total = result.total;
        this.pageError = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.pageError = err.status === 403
          ? 'No tienes permiso para ver la auditoría (se requiere rol Auditor o Admin).'
          : err.status === 502 || err.status === 504
            ? 'El servicio de auditoría no responde.'
            : 'No se pudo cargar la auditoría.';
        this.cdr.detectChanges();
      }
    });
  }
}
