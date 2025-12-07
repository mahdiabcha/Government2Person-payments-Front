// src/app/admin/programs/cycle-detail.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProgramsApi, Cycle, Entitlement, EntitlementState, CycleState } from '../../api/programs.api';
import { PaymentsApi } from '../../api/payments.api';

// add these near the imports
type EntitlementStateUI = EntitlementState | 'TO_APPROVE';
type CycleStateUI = CycleState | 'TO_APPROVE';
type SortBy = 'user'|'amount'|'state';
type SortDir = 'asc'|'desc';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  styles: [`
    :host { display:block; }
    .hero {
      border-radius: 1rem;
      border: 1px solid rgba(0,0,0,.06);
      background:
        radial-gradient(800px 160px at -10% -30%, rgba(59,130,246,.12), transparent 60%),
        radial-gradient(800px 160px at 110% 130%, rgba(16,185,129,.10), transparent 60%),
        #fff;
      padding: 1rem 1.1rem; margin-bottom: .75rem;
    }
    .hero h2 { margin:0; }
    .muted { color:#6b7280; }

    .chip {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.2rem .55rem; border-radius:999px; font-size:.75rem; font-weight:600;
      background: rgba(0,0,0,.05);
    }
    .chip-success { background: rgba(16,185,129,.16); color:#047857; }
    .chip-warn    { background: rgba(245,158,11,.16); color:#b45309; }
    .chip-info    { background: rgba(59,130,246,.16); color:#2563eb; }
    .chip-muted   { background: rgba(55,65,81,.10);  color:#374151; }

    .section {
      border: 1px solid rgba(0,0,0,.06);
      border-radius: .9rem;
      background: #fff;
      padding: 1rem;
    }
    .section h3 { margin:.1rem 0 .6rem; font-weight:600; }

    .toolbar {
      display:flex; flex-wrap:wrap; gap:.5rem; align-items:center;
      padding:.5rem; border:1px solid rgba(0,0,0,.06); border-radius:.75rem; background:#f8fafc;
    }
    .input { border:1px solid #e5e7eb; border-radius:.6rem; padding:.45rem .65rem; outline:0; }
    .pill {
      border:1px solid #e5e7eb; border-radius:999px; padding:.25rem .55rem; font-size:.75rem; font-weight:600;
      background:#fff;
    }

    table thead th { font-size:.75rem; letter-spacing:.02em; text-transform:uppercase; color:#6b7280; }
    table tbody tr:hover { background: rgba(0,0,0,.025); }
    .empty { border:1px dashed #d1d5db; border-radius:.9rem; padding:1.1rem; color:#6b7280; text-align:center; background:#fafafa; }
  `],
  template: `
    <ng-container *ngIf="cycle; else loading">
      <!-- Header -->
      <div class="hero">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-xl font-semibold">Cycle #{{ cycle.id }} — {{ cycle.name || 'Untitled' }}</h2>
            <div class="muted text-sm">
              Program #{{ cycle.programId }} ·
              {{ cycle.startDate || '—' }} → {{ cycle.endDate || '—' }}
            </div>
          </div>

        <div class="flex items-center gap-2">
            <span class="chip" [ngClass]="stateChip(cycle.state)">{{ cycle.state }}</span>
            <select class="input" [ngModel]="cycle.state" (ngModelChange)="moveState($event)" [disabled]="changingState">
              <option *ngFor="let s of states" [ngValue]="s">{{ s }}</option>
            </select>
            <button mat-stroked-button (click)="refresh()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Entitlements -->
      <div class="section">
        <div class="flex items-center justify-between">
          <h3 class="flex items-center gap-2"><mat-icon>list_alt</mat-icon> Entitlements</h3>
          <div class="flex gap-2">
            <button mat-stroked-button (click)="prepare()" [disabled]="busy">
              <mat-icon>build_circle</mat-icon>
              {{ busy ? 'Working…' : 'Prepare from enrollments' }}
            </button>
            <button mat-stroked-button (click)="generate()" [disabled]="busy">
              <mat-icon>playlist_add</mat-icon>
              {{ busy ? 'Working…' : 'Generate manually' }}
            </button>
            <button mat-raised-button color="primary" (click)="approveAll()" [disabled]="busy">
              <mat-icon>task_alt</mat-icon>
              {{ busy ? 'Working…' : 'Approve all' }}
            </button>
          </div>
        </div>

        <!-- Stats row -->
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="pill">Total: {{ ents.length }}</span>
          <span class="pill" *ngFor="let s of entStates">
            {{ s }}: {{ countByState(s) }}
          </span>
          <span class="pill" *ngFor="let pair of sumsByCurrency">
            {{ pair.currency }} {{ pair.sum | number:'1.0-2' }}
          </span>
        </div>

        <!-- Filters / sort -->
        <div class="toolbar mt-3">
          <input class="input min-w-[220px]" placeholder="Search beneficiary…" [(ngModel)]="q">
          <select class="input" [(ngModel)]="filterState">
            <option value="">All states</option>
            <option *ngFor="let s of entStates" [value]="s">{{ s }}</option>
          </select>
          <span class="flex-1"></span>
          <label class="muted text-sm">Sort by</label>
          <select class="input" [(ngModel)]="sortBy">
            <option value="user">Beneficiary</option>
            <option value="amount">Amount</option>
            <option value="state">State</option>
          </select>
          <select class="input" [(ngModel)]="sortDir">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>

        <!-- Loading -->
        <div class="flex items-center justify-center py-8" *ngIf="loadingEnts">
          <mat-progress-spinner mode="indeterminate" diameter="28"></mat-progress-spinner>
        </div>

        <!-- Table -->
        <div *ngIf="!loadingEnts && !filteredEnts.length" class="empty mt-3">
          No entitlements match your filter.
        </div>

        <div *ngIf="!loadingEnts && filteredEnts.length" class="mt-3 overflow-auto rounded-lg border border-gray-200">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr class="border-b">
                <th class="p-3 text-left">Beneficiary</th>
                <th class="p-3 text-right">Amount</th>
                <th class="p-3 text-center">Currency</th>
                <th class="p-3 text-center">State</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of filteredEnts; trackBy: trackEnt" class="border-b">
                <td class="p-3">{{ e.beneficiaryUsername }}</td>
                <td class="p-3 text-right">{{ e.amount | number:'1.0-2' }}</td>
                <td class="p-3 text-center">{{ e.currency }}</td>
                <td class="p-3 text-center">
                  <span class="chip" [ngClass]="entChip(e.state)">{{ e.state }}</span>
                </td>
                <td class="p-3">
                  <div class="flex gap-2 justify-end">
                    <select class="input" [ngModel]="e.state" (ngModelChange)="changeEntState(e, $event)" [disabled]="busy">
                      <option *ngFor="let s of entStates" [ngValue]="s">{{ s }}</option>
                    </select>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payments -->
      <div class="section mt-4">
        <h3 class="flex items-center gap-2"><mat-icon>payments</mat-icon> Payments — Create batch from this cycle</h3>
        <div class="flex gap-2 items-center">
          <button mat-raised-button color="primary" (click)="createBatch()" [disabled]="creatingBatch">
            <mat-icon>playlist_add_check</mat-icon>
            {{ creatingBatch ? 'Creating…' : 'Create batch' }}
          </button>
          <span class="muted text-sm" *ngIf="batchMessage">{{ batchMessage }}</span>
        </div>
      </div>
    </ng-container>

    <ng-template #loading>
      <div class="flex items-center justify-center py-20">
        <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
      </div>
    </ng-template>
  `
})
export class AdminCycleDetailPage {
  cycleId = Number(this.route.snapshot.paramMap.get('cycleId'));
  cycle?: Cycle;

  ents: Entitlement[] = [];
  entStates: EntitlementStateUI[] = ['DRAFT','TO_APPROVE','APPROVED','DISTRIBUTED','CANCELED'];
  states: CycleStateUI[] = ['DRAFT','TO_APPROVE','APPROVED','DISTRIBUTED','CANCELED','ENDED'];

  // UI state
  busy = false;
  changingState = false;
  creatingBatch = false;
  loadingEnts = false;
  batchMessage = '';

  // filters/sort
  q = '';
  filterState: '' | EntitlementStateUI = '';
  sortBy: SortBy = 'user';
  sortDir: SortDir = 'asc';

  constructor(private route: ActivatedRoute, private api: ProgramsApi, private pay: PaymentsApi, private snack: MatSnackBar) {}
  ngOnInit() { this.refresh(); }

  refresh() {
    this.api.getCycle(this.cycleId).subscribe(c => {
      this.cycle = c;
      this.loadEntitlements();
    });
  }

  loadEntitlements() {
    this.loadingEnts = true;
    this.api.listEntitlements(this.cycleId).subscribe({
      next: x => { this.ents = x || []; this.loadingEnts = false; },
      error: _ => { this.ents = []; this.loadingEnts = false; }
    });
  }

  // ---------- Cycle state ----------
  moveState(s: CycleState) {
    if (!this.cycle || this.changingState) return;
    this.changingState = true;
    this.api.changeCycleState(this.cycle.id, s).subscribe({
      next: c => { this.cycle = c; this.snack.open(`Cycle state is now ${c.state}`, 'Close', { duration: 1500 }); this.changingState = false; },
      error: () => { this.changingState = false; }
    });
  }

  // ---------- Entitlement actions ----------
  prepare() {
    if (!this.cycle || this.busy) return;
    const amount = Number(prompt('Amount per beneficiary?')||'0');
    if (!amount) { this.snack.open('Amount is required.', 'Close', { duration: 1500 }); return; }
    const currency = (prompt('Currency? (e.g., TND)')||'TND').toUpperCase();
    const validFrom = prompt('validFrom (YYYY-MM-DD)?') || '';
    const validUntil = prompt('validUntil (YYYY-MM-DD)?') || '';
    this.busy = true;
    this.api.prepareEntitlements(this.cycle.programId, this.cycle.id, { amount, currency, validFrom, validUntil })
      .subscribe({
        next: () => { this.snack.open('Entitlements prepared', 'Close', { duration: 1500 }); this.busy = false; this.loadEntitlements(); },
        error: () => { this.busy = false; }
      });
  }

  generate() {
    if (!this.cycle || this.busy) return;
    const csv = prompt('Enter CSV lines: username,amount,currency (one per line)');
    if (!csv) return;
    const items = csv.split('\n').map(row => {
      const [u,a,c] = row.split(',').map(x => x.trim());
      return { username: u, amount: Number(a), currency: (c||'TND').toUpperCase() };
    }).filter(x => !!x.username && !!x.amount);
    if (!items.length) { this.snack.open('No valid rows.', 'Close', { duration: 1500 }); return; }
    this.busy = true;
    this.api.generateEntitlements(this.cycle.programId, this.cycle.id, items).subscribe({
      next: () => { this.snack.open('Entitlements generated', 'Close', { duration: 1500 }); this.busy = false; this.loadEntitlements(); },
      error: () => { this.busy = false; }
    });
  }

  approveAll() {
    if (this.busy) return; this.busy = true;
    this.api.approveAllEntitlements(this.cycleId).subscribe({
      next: () => { this.snack.open('All entitlements approved', 'Close', { duration: 1500 }); this.busy = false; this.loadEntitlements(); },
      error: () => { this.busy = false; }
    });
  }

// when calling your API, its method likely still expects EntitlementState.
// Cast only at the call site (so TS stays happy), e.g.:
  changeEntState(e: Entitlement, v: EntitlementStateUI) {
    if (this.busy) return; this.busy = true;
    this.api.changeEntitlementState(this.cycleId, e.id, v as EntitlementState).subscribe({
      next: () => { /* ... */ },
      error: () => { this.busy = false; }
    });
  }


  // ---------- Payments ----------
  createBatch() {
    if (!this.cycle || this.creatingBatch) return;
    this.creatingBatch = true;
    this.pay.createBatchFromCycle(this.cycle.id, this.cycle.programId).subscribe({
      next: r => {
        this.batchMessage = r.existing ? `Batch already existed (ID=${r.batchId}).` : `Batch created (ID=${r.batchId}) with ${r.totalCount} instructions.`;
        this.snack.open(this.batchMessage, 'Close', { duration: 2500 });
        this.creatingBatch = false;
      },
      error: () => { this.creatingBatch = false; }
    });
  }

  // ---------- Derived data (filters/sort/stats) ----------
  get filteredEnts(): Entitlement[] {
    const q = this.q.trim().toLowerCase();
    const f = this.filterState;
    const base = this.ents.filter(e => {
      const u = (e.beneficiaryUsername || '').toLowerCase();
      const passQ = !q || u.includes(q);
      const passS = !f || e.state === f;
      return passQ && passS;
    });

    const sorted = [...base].sort((a,b) => {
      let cmp = 0;
      if (this.sortBy === 'user') {
        cmp = (a.beneficiaryUsername||'').localeCompare(b.beneficiaryUsername||'');
      } else if (this.sortBy === 'amount') {
        cmp = (a.amount||0) - (b.amount||0);
      } else {
        cmp = (a.state||'').localeCompare(b.state||'');
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }

  countByState(s: "DRAFT" | "APPROVED" | "DISTRIBUTED" | "CANCELED" | "TO_APPROVE"): number {
    return this.ents.filter(e => e.state === s).length;
  }

  get sumsByCurrency(): {currency: string, sum: number}[] {
    const map = new Map<string, number>();
    for (const e of this.filteredEnts) {
      const cur = (e.currency || '').toUpperCase();
      if (!cur) continue;
      map.set(cur, (map.get(cur) || 0) + (Number(e.amount) || 0));
    }
    return Array.from(map.entries()).map(([currency, sum]) => ({ currency, sum }));
  }

// update the helper signatures so comparisons against 'TO_APPROVE' are valid
  stateChip(s: CycleStateUI) {
    return s === 'APPROVED' || s === 'DISTRIBUTED' || s === 'ENDED' ? 'chip-success'
      : s === 'TO_APPROVE' ? 'chip-info'
        : s === 'CANCELED' ? 'chip-muted'
          : 'chip-warn';
  }

  entChip(s: EntitlementStateUI) {
    return s === 'APPROVED' || s === 'DISTRIBUTED' ? 'chip-success'
      : s === 'CANCELED' ? 'chip-muted'
        : s === 'TO_APPROVE' ? 'chip-info'
          : 'chip-warn';
  }

  trackEnt = (_: number, e: Entitlement) => (e as any)?.id ?? _;
}
