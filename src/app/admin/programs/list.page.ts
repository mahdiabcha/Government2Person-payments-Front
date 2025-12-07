import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgramsApi, Program } from '../../api/programs.api';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type State = Program['state'];

@Component({
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatSnackBarModule, MatIconModule, MatProgressSpinnerModule
  ],
  styles: [`
    .toolbar { display:flex; gap:.75rem; flex-wrap:wrap; align-items:center; }
    .chip {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.2rem .55rem; border-radius:999px; font-size:.75rem; font-weight:600;
      background: rgba(0,0,0,.05);
    }
    .chip-success { background: rgba(16,185,129,.16); color: #047857; }
    .chip-warn    { background: rgba(245,158,11,.16); color: #b45309; }
    .chip-info    { background: rgba(59,130,246,.16); color: #2563eb; }
    .chip-muted   { background: rgba(55,65,81,.10);  color: #374151; }
    .hero {
      border:1px solid rgba(0,0,0,.06); border-radius: .9rem; padding: .9rem 1rem; margin-bottom: .9rem;
      background:
        radial-gradient(800px 160px at -10% -30%, rgba(59,130,246,.12), transparent 60%),
        radial-gradient(800px 160px at 110% 130%, rgba(16,185,129,.10), transparent 60%),
        #fff;
    }
    table thead th { font-size:.75rem; letter-spacing:.02em; text-transform:uppercase; color:#6b7280; }
    table tbody tr:hover { background: rgba(0,0,0,.025); }
    .input {
      border:1px solid #e5e7eb; border-radius:.6rem; padding:.5rem .7rem; outline:0; min-width: 220px;
    }
    .select { padding-right:2rem; }
    .empty {
      border:1px dashed #d1d5db; border-radius:.9rem; padding:1.25rem; color:#6b7280; text-align:center;
      background:#fafafa;
    }
  `],
  template: `
    <!-- Header -->
    <div class="hero">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold m-0">Programs</h2>
          <div class="text-sm text-gray-600">Create and manage public assistance programs.</div>
        </div>
        <button mat-raised-button color="primary" (click)="create()" [disabled]="creating">
          <mat-icon class="mr-1">add</mat-icon>
          {{ creating ? 'Creating…' : 'Create' }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="toolbar mb-3">
      <input class="input" placeholder="Search by name…" [(ngModel)]="q" />
      <select class="input select" [(ngModel)]="filterState">
        <option value="">All states</option>
        <option *ngFor="let s of states" [ngValue]="s">{{ s }}</option>
      </select>
      <span class="flex-1"></span>
      <span class="chip chip-info">Total {{ filtered.length }}</span>
      <span class="chip chip-success">Active {{ count('ACTIVE') }}</span>
      <span class="chip chip-warn">Inactive {{ count('INACTIVE') }}</span>
      <span class="chip chip-muted">Draft {{ count('DRAFT') }}</span>
      <span class="chip chip-muted">Archived {{ count('ARCHIVED') }}</span>
    </div>

    <!-- Loading -->
    <div class="flex items-center justify-center py-10" *ngIf="loading">
      <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
    </div>

    <!-- Empty -->
    <div *ngIf="!loading && !filtered.length" class="empty">
      No programs found. Click <b>Create</b> to add one.
    </div>

    <!-- Table -->
    <div *ngIf="!loading && filtered.length">
      <table class="min-w-full text-sm bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-50">
          <tr class="border-b">
            <th class="text-left p-3">#</th>
            <th class="text-left p-3">Name</th>
            <th class="text-left p-3">Description</th>
            <th class="p-3">State</th>
            <th class="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of filtered; trackBy: track" class="border-b">
            <td class="p-3">#{{ p.id }}</td>
            <td class="p-3 font-medium">{{ p.name }}</td>
            <td class="p-3 text-gray-600">{{ p.description || '—' }}</td>
            <td class="p-3 text-center">
              <span class="chip" [ngClass]="stateClass(p.state)">{{ p.state }}</span>
            </td>
            <td class="p-3 text-center">
              <a routerLink="/admin/programs/{{p.id}}" class="text-indigo-600 hover:underline">Open</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class AdminProgramsListPage {
  items: Program[] = [];
  loading = false;
  creating = false;

  q = '';
  filterState: State | '' = '';
  states: State[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];

  constructor(private api: ProgramsApi, private router: Router, private snack: MatSnackBar) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading = true;
    this.api.listPrograms().subscribe({
      next: x => {
        // sort newest first for convenience
        this.items = (x || []).slice().sort((a,b) => (b.id||0) - (a.id||0));
        this.loading = false;
      },
      error: _ => this.loading = false
    });
  }

  get filtered(): Program[] {
    const q = this.q.trim().toLowerCase();
    return this.items.filter(p =>
      (!this.filterState || p.state === this.filterState) &&
      (!q || p.name?.toLowerCase().includes(q))
    );
  }

  count(s: State): number { return this.items.filter(p => p.state === s).length; }

  stateClass(s: State) {
    return s === 'ACTIVE' ? 'chip-success'
      : s === 'INACTIVE' ? 'chip-warn'
        : s === 'ARCHIVED' ? 'chip-muted'
          : 'chip-info';
  }

  track(_: number, p: Program) { return p?.id ?? _; }

  create() {
    if (this.creating) return;
    const name = (prompt('Program name?') || '').trim();
    if (!name) return;
    this.creating = true;
    this.api.createProgram({ name, description: '' }).subscribe({
      next: p => {
        this.snack.open('Program created. Define eligibility rules before activating.', 'Close', { duration: 2500 });
        this.creating = false;
        this.router.navigate(['/admin/programs', p.id]);
      },
      error: _ => { this.creating = false; }
    });
  }
}
