// src/app/admin/payments/batch-detail.page.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PaymentsApi, PaymentInstruction } from '../../api/payments.api';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, interval, switchMap } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  styles: [`
    :host { display:block; }

    /* Hero */
    .hero {
      border-radius: 1rem;
      border: 1px solid rgba(0,0,0,.06);
      background:
        radial-gradient(1000px 180px at -10% -30%, rgba(59,130,246,.14), transparent 60%),
        radial-gradient(1000px 180px at 110% 130%, rgba(16,185,129,.14), transparent 60%),
        linear-gradient(180deg, #fff, #fafafa);
      padding: .9rem 1rem; margin-bottom: 1rem;
    }
    .row { display:flex; align-items:center; justify-content:space-between; gap:.75rem; flex-wrap:wrap; }
    .muted { color:#6b7280; }
    .btns > * { margin-left:.5rem; } .btns > *:first-child { margin-left:0; }

    /* Chips */
    .chip {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.22rem .6rem; border-radius:999px; font-size:.75rem; font-weight:600;
      border:1px solid rgba(0,0,0,.08); background:#f8fafc;
    }
    .chip-ok   { background:rgba(16,185,129,.16); color:#065f46; border-color:rgba(16,185,129,.22); }
    .chip-warn { background:rgba(245,158,11,.16); color:#92400e; border-color:rgba(245,158,11,.22); }
    .chip-info { background:rgba(59,130,246,.14); color:#1e40af; border-color:rgba(59,130,246,.22); }
    .chip-bad  { background:rgba(239,68,68,.14); color:#991b1b; border-color:rgba(239,68,68,.22); }

    /* Card + table */
    .card { border:1px solid rgba(0,0,0,.08); border-radius:.9rem; background:#fff; overflow:hidden; }
    .card-h { padding:.85rem 1rem; border-bottom:1px solid rgba(0,0,0,.06); display:flex; align-items:center; justify-content:space-between; gap:.75rem; }
    .card-b { padding:1rem; }
    .table-wrap { overflow:auto; border:1px solid rgba(0,0,0,.06); border-radius:.6rem; }
    table { width:100%; border-collapse:separate; border-spacing:0; background:#fff; }
    thead th {
      position:sticky; top:0; z-index:1;
      background:#f8fafc; text-align:left; padding:.7rem .75rem;
      font-size:.73rem; text-transform:uppercase; letter-spacing:.04em; color:#6b7280;
      border-bottom:1px solid rgba(0,0,0,.06);
    }
    tbody td { padding:.7rem .75rem; border-bottom:1px solid rgba(0,0,0,.05); }
    tbody tr:hover { background:#fafafa; }

    /* Progress */
    .bar { height:8px; border-radius:999px; background:#edf2f7; overflow:hidden; border:1px solid rgba(0,0,0,.06); }
    .bar > div { height:100%; border-radius:999px; background:linear-gradient(90deg,#60a5fa,#34d399); transition:width .3s ease; }

    /* Empty */
    .empty { text-align:center; padding:2rem 1rem; border:1px dashed rgba(0,0,0,.15); border-radius:.8rem; color:#6b7280; background:#fafafa; }
  `],
  template: `
    <ng-container *ngIf="batch">
      <!-- HERO -->
      <div class="hero">
        <div class="row">
          <div class="min-w-0">
            <div class="text-xl font-semibold leading-tight">
              Batch #{{ batch.batch.id }}
              <span class="chip" [ngClass]="statusChip(batch.batch.status)">{{ batch.batch.status }}</span>
            </div>
            <div class="muted text-sm">
              Success: {{ batch.batch.successCount ?? 0 }} /
              Total: {{ batch.batch.totalCount ?? 0 }} —
              Failed: {{ batch.batch.failedCount ?? 0 }}
              <span *ngIf="batch.batch.status==='PROCESSING'">· Auto-refreshing…</span>
            </div>
          </div>
          <div class="btns">
            <button mat-raised-button color="primary" (click)="dispatch()" [disabled]="dispatching">
              {{ dispatching ? 'Dispatching…' : 'Dispatch' }}
            </button>
            <button mat-stroked-button (click)="load()">Refresh</button>
          </div>
        </div>
        <div class="bar mt-2" *ngIf="(batch.batch.totalCount ?? 0) > 0">
          <div [style.width.%]="progressPct(batch.batch.successCount, batch.batch.totalCount)"></div>
        </div>
      </div>

      <!-- INSTRUCTIONS -->
      <div class="card">
        <div class="card-h">
          <div class="font-semibold">Instructions</div>
          <div class="muted text-sm">Delivery details per beneficiary</div>
        </div>
        <div class="card-b">
          <div *ngIf="!batch.instructions?.length" class="empty">No instructions yet.</div>

          <div class="table-wrap" *ngIf="batch.instructions?.length">
            <table class="text-sm">
              <thead>
                <tr>
                  <th>Beneficiary</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Bank Ref</th>
                  <th>Fail reason</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let i of batch.instructions">
                  <td>{{ i.beneficiaryUsername }}</td>
                  <td>{{ i.amount }}</td>
                  <td>{{ i.currency }}</td>
                  <td>
                    <span class="chip" [ngClass]="instChip(i.status)">{{ i.status }}</span>
                  </td>
                  <td>{{ i.bankRef || '—' }}</td>
                  <td>{{ i.failReason || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </ng-container>
  `,
})
export class AdminBatchDetailPage implements OnDestroy {
  id = Number(this.route.snapshot.paramMap.get('id'));
  batch?: { batch: any; instructions: PaymentInstruction[] };
  pollingSub?: Subscription;
  dispatching = false;

  constructor(private route: ActivatedRoute, private api: PaymentsApi) {}
  ngOnInit() { this.load(); }
  ngOnDestroy() { this.stopPoll(); }

  load() {
    this.api.getBatch(this.id).subscribe(b => {
      this.batch = b;
      if (b.batch.status === 'PROCESSING') this.startPoll(); else this.stopPoll();
    });
  }

  dispatch() {
    this.dispatching = true;
    this.api.dispatch(this.id).subscribe(
      () => { this.dispatching = false; this.startPoll(); },
      _ => { this.dispatching = false; }
    );
  }

  startPoll() {
    this.stopPoll();
    this.pollingSub = interval(2500)
      .pipe(switchMap(() => this.api.getBatch(this.id)))
      .subscribe(b => {
        this.batch = b;
        if (b.batch.status !== 'PROCESSING') this.stopPoll();
      });
  }

  stopPoll() { this.pollingSub?.unsubscribe(); this.pollingSub = undefined; }

  progressPct(ok?: number, total?: number) {
    const t = total ?? 0, s = ok ?? 0;
    return t > 0 ? Math.min(100, Math.max(0, Math.round((s / t) * 100))) : 0;
  }

  statusChip(s: string) {
    return s === 'COMPLETED' ? 'chip-ok'
      : s === 'PROCESSING' ? 'chip-info'
        : s === 'FAILED' ? 'chip-bad'
          : 'chip-warn';
  }
  instChip(s: string) {
    return s === 'SUCCESS' ? 'chip-ok'
      : s === 'FAILED' ? 'chip-bad'
        : s === 'QUEUED' || s === 'SENT' ? 'chip-info'
          : 'chip-warn';
  }
}
