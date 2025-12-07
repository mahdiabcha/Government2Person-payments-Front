// src/app/admin/programs/cycles-list.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgramsApi, Cycle } from '../../api/programs.api';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
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
      padding: .9rem 1rem;
      margin-bottom: 1rem;
    }
    .muted { color:#6b7280; }
    .row { display:flex; align-items:center; justify-content:space-between; gap:.75rem; flex-wrap:wrap; }

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
    .td-right { text-align:right; }

    /* Chips */
    .chip {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.22rem .6rem; border-radius:999px; font-size:.75rem; font-weight:600;
      border:1px solid rgba(0,0,0,.08); background:#f8fafc;
    }
    .chip-success { background:rgba(16,185,129,.14); color:#065f46; border-color:rgba(16,185,129,.22); }
    .chip-warn    { background:rgba(245,158,11,.16); color:#92400e; border-color:rgba(245,158,11,.22); }
    .chip-info    { background:rgba(59,130,246,.14); color:#1e40af; border-color:rgba(59,130,246,.22); }
    .chip-muted   { background:rgba(107,114,128,.16); color:#374151; border-color:rgba(107,114,128,.22); }

    /* Empty state */
    .empty {
      text-align:center; padding:2.25rem 1rem;
      border:1px dashed rgba(0,0,0,.15); border-radius:.8rem; color:#6b7280; background:#fafafa;
    }

    /* Buttons row spacing on wrap */
    .btns > * { margin-left:.5rem; }
    .btns > *:first-child { margin-left:0; }
  `],
  template: `
    <!-- HERO -->
    <div class="hero">
      <div class="row">
        <div class="min-w-0">
          <div class="text-xl font-semibold leading-tight">Cycles — Program #{{ programId }}</div>
          <div class="muted text-sm">
            {{ items?.length || 0 }} {{ (items?.length || 0) === 1 ? 'cycle' : 'cycles' }} total
          </div>
        </div>
        <div class="btns">
          <button mat-raised-button color="primary" (click)="create()" [disabled]="creating">
            {{ creating ? 'Creating…' : 'Create cycle' }}
          </button>
        </div>
      </div>
    </div>

    <!-- LIST -->
    <div class="card">
      <div class="card-h">
        <div class="font-semibold">All cycles</div>
        <div class="muted text-sm">Manage enrollment periods and disbursement windows.</div>
      </div>
      <div class="card-b">
        <div *ngIf="!items?.length" class="empty">
          No cycles yet. Click <b>Create cycle</b> to add your first one.
        </div>

        <div class="table-wrap" *ngIf="items?.length">
          <table class="text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>State</th>
                <th>Dates</th>
                <th class="td-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of items">
                <td>#{{ c.id }}</td>
                <td>{{ c.name }}</td>
                <td>
                  <span class="chip" [ngClass]="stateChip(c.state)">{{ c.state }}</span>
                </td>
                <td>{{ c.startDate }} → {{ c.endDate }}</td>
                <td class="td-right">
                  <a mat-stroked-button color="primary" [routerLink]="'/admin/cycles/' + c.id">Open</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `,
})
export class AdminCyclesListPage {
  programId = Number(this.route.snapshot.paramMap.get('id'));
  items: Cycle[] = [];
  creating = false;

  constructor(private route: ActivatedRoute, private api: ProgramsApi, private snack: MatSnackBar) {}
  ngOnInit() { this.refresh(); }
  refresh() { this.api.listCycles(this.programId).subscribe(x => this.items = x); }

  create() {
    if (this.creating) return;
    const name = (prompt('Cycle name?') || '').trim();
    if (!name) { this.snack.open('Name is required.', 'Close', { duration: 1500 }); return; }
    const startDate = (prompt('Start date (YYYY-MM-DD)?') || '').trim();
    const endDate = (prompt('End date (YYYY-MM-DD)?') || '').trim();
    if (!startDate || !endDate) {
      this.snack.open('Start and end dates are required.', 'Close', { duration: 1800 });
      return;
    }

    this.creating = true;
    this.api.createCycle(this.programId, { name, startDate, endDate }).subscribe({
      next: () => { this.snack.open('Cycle created', 'Close', { duration: 1500 }); this.creating = false; this.refresh(); },
      error: () => { this.creating = false; }
    });
  }

  stateChip(s: string) {
    return s === 'APPROVED' || s === 'DISTRIBUTED' || s === 'ENDED' ? 'chip-success'
      : s === 'TO_APPROVE' ? 'chip-info'
        : s === 'CANCELED' ? 'chip-muted'
          : 'chip-warn';
  }
}
