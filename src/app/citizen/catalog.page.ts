import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramsApi, Program } from '../api/programs.api';
import { RouterLink } from '@angular/router';
import { StatusChipComponent } from '../shared/status-chip.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusChipComponent],
  styles: [`
    :host { display:block; }
    .hero {
      position: relative;
      border-radius: 1rem;
      padding: 1.25rem;
      background:
        radial-gradient(1200px 200px at 0% -20%, rgba(37,99,235,.10), transparent 60%),
        radial-gradient(1200px 200px at 100% 120%, rgba(16,185,129,.10), transparent 60%),
        linear-gradient(180deg, rgba(0,0,0,.02), transparent);
      border: 1px solid rgba(0,0,0,.06);
    }
    .card {
      border: 1px solid rgba(0,0,0,.08);
      border-radius: .85rem;
      padding: 1rem;
      background: white;
      transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(0,0,0,.06);
      border-color: rgba(0,0,0,.12);
    }
    .skeleton {
      border-radius: .85rem;
      height: 128px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
      background-size: 400% 100%;
      animation: shimmer 1.2s infinite;
      border: 1px solid rgba(0,0,0,.06);
    }
    @keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: 0 0 } }
    .btn-link {
      color: rgb(37,99,235);
      font-weight: 600;
    }
    .btn-link:hover { text-decoration: underline; }
    .muted { color: #6b7280; }
  `],
  template: `
    <!-- Hero / Controls -->
    <div class="hero mb-4">
      <div class="flex flex-col md:flex-row gap-3 md:items-end justify-between">
        <div>
          <h2 class="text-xl font-semibold leading-tight">Programs</h2>
          <p class="text-sm muted">Only active programs are visible.</p>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <input
            class="border rounded px-3 py-2 text-sm w-full md:w-72"
            placeholder="Search programs…"
            [(ngModel)]="q" (ngModelChange)="applyFilters()" />
          <select class="border rounded px-2 py-2 text-sm"
                  [(ngModel)]="sortBy" (ngModelChange)="applyFilters()">
            <option value="name">Sort: Name</option>
            <option value="new">Sort: Newest</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3" *ngIf="loading">
      <div class="skeleton" *ngFor="let _ of placeholders"></div>
    </div>

    <!-- Content -->
    <ng-container *ngIf="!loading">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3" *ngIf="programs.length; else empty">
        <div class="card" *ngFor="let p of programs; trackBy: trackProgram">
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-semibold leading-tight truncate" [title]="p.name">{{ p.name }}</h3>
            <app-chip [text]="p.state" [tone]="progTone(p.state)"></app-chip>
          </div>

          <p class="text-sm my-2 line-clamp-3 muted">{{ p.description || 'No description provided.' }}</p>

          <div class="flex items-center justify-between pt-1">
            <div class="text-xs muted">ID #{{ p.id }}</div>
            <a class="btn-link" routerLink="/citizen/programs/{{p.id}}">Open →</a>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="border border-dashed rounded-xl p-8 text-center">
          <div class="text-lg font-medium mb-1">No active programs right now</div>
          <div class="text-sm muted">Please check back later.</div>
        </div>
      </ng-template>
    </ng-container>
  `,
})
export class CatalogPage {
  allPrograms: Program[] = [];
  programs: Program[] = [];
  loading = true;

  q = '';
  sortBy: 'name' | 'new' = 'name';

  placeholders = Array.from({ length: 6 });

  constructor(private api: ProgramsApi) {}

  ngOnInit() {
    this.api.listPrograms().subscribe(p => {
      // keep only ACTIVE
      this.allPrograms = (p || []).filter(x => x.state === 'ACTIVE');
      this.loading = false;
      this.applyFilters();
    });
  }

  applyFilters() {
    const q = this.q.trim().toLowerCase();
    let out = [...this.allPrograms];
    if (q) {
      out = out.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    if (this.sortBy === 'name') {
      out.sort((a,b) => (a.name||'').localeCompare(b.name||''));
    } else {
      // “Newest”: larger id first (fallback if you don’t have createdAt)
      out.sort((a,b) => (b.id||0) - (a.id||0));
    }
    this.programs = out;
  }

  trackProgram = (_: number, p: Program) => p?.id ?? _;

  progTone(s: Program['state']) {
    return s==='ACTIVE' ? 'success'
      : s==='INACTIVE' ? 'warning'
        : s==='ARCHIVED' ? 'neutral'
          : 'info';
  }
}
