// src/app/admin/payments/batches-list.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsApi, PaymentBatch } from '../../api/payments.api';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, FormsModule],
  styles: [`
    :host { display:block; }

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
    .td-right { text-align:right; }

    .chip {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.22rem .6rem; border-radius:999px; font-size:.75rem; font-weight:600;
      border:1px solid rgba(0,0,0,.08); background:#f8fafc;
    }
    .chip-ok   { background:rgba(16,185,129,.16); color:#065f46; border-color:rgba(16,185,129,.22); }
    .chip-warn { background:rgba(245,158,11,.16); color:#92400e; border-color:rgba(245,158,11,.22); }
    .chip-info { background:rgba(59,130,246,.14); color:#1e40af; border-color:rgba(59,130,246,.22); }
    .chip-bad  { background:rgba(239,68,68,.14); color:#991b1b; border-color:rgba(239,68,68,.22); }

    .bar { height:6px; border-radius:999px; background:#edf2f7; overflow:hidden; border:1px solid rgba(0,0,0,.06); }
    .bar > div { height:100%; border-radius:999px; background:linear-gradient(90deg,#60a5fa,#34d399); }

    .empty { text-align:center; padding:2rem 1rem; border:1px dashed rgba(0,0,0,.15); border-radius:.8rem; color:#6b7280; background:#fafafa; }
  `],
  template: `
    <!-- HERO -->
    <div class="hero">
      <div class="row">
        <div class="min-w-0">
          <div class="text-xl font-semibold leading-tight">Payment Batches</div>
          <div class="muted text-sm">{{ items?.length || 0 }} total</div>
        </div>
        <div class="btns">
          <button mat-stroked-button (click)="openManual()">Create manual</button>
          <button mat-raised-button color="primary" (click)="openFromCycle()">From cycle</button>
        </div>
      </div>
    </div>

    <!-- LIST -->
    <div class="card">
      <div class="card-h">
        <div class="font-semibold">All batches</div>
        <div class="muted text-sm">Dispatch disbursements and monitor progress</div>
      </div>
      <div class="card-b">
        <div *ngIf="!items?.length" class="empty">No batches yet.</div>

        <div class="table-wrap" *ngIf="items?.length">
          <table class="text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Program</th>
                <th>Cycle</th>
                <th>Status</th>
                <th>Totals</th>
                <th class="td-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of items">
                <td>#{{ b.id }}</td>
                <td>{{ b.programId ?? '—' }}</td>
                <td>{{ b.cycleId ?? '—' }}</td>
                <td><span class="chip" [ngClass]="statusChip(b.status)">{{ b.status }}</span></td>
                <td>
                  <div class="muted">
                    {{ (b.successCount ?? 0) }}/{{ (b.totalCount ?? 0) }}
                    (failed: {{ (b.failedCount ?? 0) }})
                  </div>
                  <div class="bar" *ngIf="(b.totalCount ?? 0) > 0">
                    <div [style.width.%]="progressPct(b.successCount, b.totalCount)"></div>
                  </div>
                </td>
                <td class="td-right">
                  <a mat-stroked-button color="primary" [routerLink]="'/admin/payments/batches/' + b.id">Open</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `,
})
export class AdminBatchesListPage {
  items: PaymentBatch[] = [];
  constructor(private api: PaymentsApi) {}
  ngOnInit() { this.refresh(); }
  refresh() { this.api.listBatches().subscribe(x => this.items = x); }

  openManual() {
    const programId = Number(prompt('programId?') ?? '0'); if (!programId) return;
    const amount = Number(prompt('amount?') ?? '0'); if (!amount) return;
    const currency = (prompt('currency? (e.g., TND)') ?? 'TND').toUpperCase();
    const beneficiaries = (prompt('Beneficiaries CSV (user1,user2,...)') ?? '')
      .split(',').map(x => x.trim()).filter(Boolean);
    this.api.createManualBatch({ programId, amount, currency, beneficiaries })
      .subscribe(() => this.refresh());
  }

  openFromCycle() {
    const programId = Number(prompt('programId?') ?? '0');
    const cycleId = Number(prompt('cycleId?') ?? '0');
    if (!programId || !cycleId) return;
    this.api.createBatchFromCycle(cycleId, programId).subscribe(() => this.refresh());
  }

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
}
