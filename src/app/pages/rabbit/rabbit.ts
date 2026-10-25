import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, timer } from 'rxjs';
import { DlqMessage, QueueInfo, RabbitService } from '../../services/rabbit.service';

/** Cada cuántos milisegundos se refresca el listado de colas. */
const REFRESH_MS = 5000;
/** Cantidad de mensajes que se piden al abrir una DLQ (el backend admite hasta 50). */
const MESSAGES_PER_READ = 20;

@Component({
  selector: 'app-rabbit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rabbit.html',
  styleUrl: './rabbit.scss'
})
export class Rabbit implements OnInit, OnDestroy {
  queues: QueueInfo[] = [];
  isLoading = true;
  paused = false;
  lastUpdate: Date | null = null;
  pageError = '';

  selectedQueue: string | null = null;
  messages: DlqMessage[] = [];
  messagesLoading = false;
  messagesError = '';

  private polling?: Subscription;

  constructor(private rabbitService: RabbitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.polling?.unsubscribe();
  }

  /** Total de mensajes acumulados en todas las DLQ: es el indicador de fallos. */
  get failedTotal(): number {
    return this.queues.filter(q => this.isDlq(q)).reduce((sum, q) => sum + q.messages, 0);
  }

  isDlq(queue: QueueInfo): boolean {
    return queue.name.endsWith('.dlq');
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
    this.loadQueues();
  }

  openDlq(queue: QueueInfo): void {
    this.selectedQueue = queue.name;
    this.loadMessages();
  }

  closeDlq(): void {
    this.selectedQueue = null;
    this.messages = [];
    this.messagesError = '';
  }

  loadMessages(): void {
    if (!this.selectedQueue) return;
    this.messagesLoading = true;
    this.messagesError = '';
    this.rabbitService.peekMessages(this.selectedQueue, MESSAGES_PER_READ).subscribe({
      next: data => {
        this.messages = data;
        this.messagesLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.messagesLoading = false;
        this.messagesError = this.describeError(err, 'No se pudieron leer los mensajes.');
        this.cdr.detectChanges();
      }
    });
  }

  trackByName(_: number, q: QueueInfo): string {
    return q.name;
  }

  /** Refresca de inmediato y luego cada REFRESH_MS; al pausar o salir de la vista se cancela. */
  private startPolling(): void {
    this.polling?.unsubscribe();
    this.polling = timer(0, REFRESH_MS).subscribe(() => this.loadQueues());
  }

  private loadQueues(): void {
    this.rabbitService.listQueues().subscribe({
      next: data => {
        this.queues = [...data].sort((a, b) => a.name.localeCompare(b.name));
        this.lastUpdate = new Date();
        this.pageError = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.pageError = this.describeError(err, 'No se pudo obtener el estado de las colas.');
        this.cdr.detectChanges();
      }
    });
  }

  private describeError(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 403) return 'No tienes permiso (se requiere rol Admin).';
    if (err.status === 502) return 'RabbitMQ no responde. Reintentando en el próximo ciclo.';
    return err.error?.message ? `${fallback} ${err.error.message}` : fallback;
  }
}
