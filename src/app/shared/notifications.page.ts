import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsApi, NotificationItem, Page } from "../api/notifications.api";

type Group = { label: string, items: NotificationItem[] };

@Component({
  standalone: true,
  selector: 'app-notifications-page',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  styles: [`
    .wrap { max-width: 1100px; margin: 0 auto; padding: clamp(16px,2vw,24px); }
    .card {
      border-radius: 14px; border: 1px solid #e5e7eb; background: #fff; padding: 14px 16px; position: relative;
      box-shadow: 0 1px 0 rgba(16, 24, 40, .04);
    }
    .card::before {
      content: ""; position: absolute; left: -1px; top: -1px; bottom: -1px; width: 6px; border-radius: 14px 0 0 14px;
      background: linear-gradient(180deg, #4f46e5, #22c55e);
    }
    .title { font-size: 16px; font-weight: 700; color:#0f172a; margin-bottom: 2px; }
    .body  { color:#374151; }
    .meta  { color:#6b7280; font-size: 12px; }
    .prog  { color:#0f766e; font-size: 12px; margin-top: 2px; }
    .section { color:#475569; font-weight: 700; font-size: 13px; letter-spacing: .02em; margin: 18px 0 8px; }
    .search {
      width: 100%; height: 42px; border-radius: 9999px; border: 1px solid #e5e7eb; padding: 0 14px 0 40px;
      background:#fff url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' width='18' height='18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat 12px center;
    }
    .empty { border: 2px dashed #e5e7eb; border-radius: 14px; padding: 24px; text-align: center; color:#64748b; background: #fafafa; }
  `],
  template: `
    <div class="bg-[linear-gradient(180deg,#f8fafc,transparent)]">
      <div class="wrap">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-3xl font-bold tracking-tight">Notifications</h2>
            <div class="text-sm text-gray-600">Total: {{ total }}</div>
          </div>
          <button mat-stroked-button (click)="refresh()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>

        <input class="search mb-4" placeholder="Search this page…" [(ngModel)]="q" (ngModelChange)="applyFilter()" />

        <ng-container *ngIf="groups.length; else noData">
          <div class="space-y-4">
            <ng-container *ngFor="let g of groups">
              <div class="section">{{ g.label }}</div>
              <div class="space-y-3">
                <div class="card" *ngFor="let n of g.items">
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <div class="title truncate">{{ n.title }}</div>
                      <div class="body">{{ n.body }}</div>
                      <div class="prog" *ngIf="programName(n)">Program: {{ programName(n) }}</div>
                    </div>
                    <div class="meta whitespace-nowrap">{{ n.createdAt | date:'mediumDate' }} • {{ n.createdAt | date:'shortTime' }}</div>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- infinite scroll sentinel -->
            <div #sentinel class="h-8"></div>

            <div class="text-center py-3 text-sm text-gray-500" *ngIf="loading">Loading…</div>
            <div class="text-center py-3 text-sm text-gray-500" *ngIf="!loading && reachedEnd">You’re all caught up 🎉</div>
          </div>
        </ng-container>

        <ng-template #noData>
          <div class="empty">No notifications yet.</div>
        </ng-template>
      </div>
    </div>
  `
})
export class NotificationsPage implements OnInit, OnDestroy {
  private api = inject(NotificationsApi);

  items: NotificationItem[] = [];
  filtered: NotificationItem[] = [];
  groups: Group[] = [];

  q = '';

  pageIndex = 0;
  pageSize = 20;
  total = 0;
  loading = false;
  reachedEnd = false;
  private io?: IntersectionObserver;

  @ViewChild('sentinel', { static: false }) sentinel?: ElementRef<HTMLElement>;

  ngOnInit(): void { this.loadPage(); }

  ngAfterViewInit() {
    this.io = new IntersectionObserver(entries => {
      const visible = entries.some(e => e.isIntersecting);
      if (visible && !this.loading && !this.reachedEnd) this.loadPage();
    }, { root: null, rootMargin: '0px', threshold: 0.1 });
    setTimeout(() => this.sentinel && this.io?.observe(this.sentinel.nativeElement));
  }

  ngOnDestroy(): void { this.io?.disconnect(); }

  refresh() {
    this.pageIndex = 0;
    this.items = [];
    this.filtered = [];
    this.groups = [];
    this.total = 0;
    this.reachedEnd = false;
    this.loadPage(true);
  }

  private loadPage(reset = false) {
    if (this.loading) return;
    this.loading = true;
    this.api.listMy(this.pageIndex, this.pageSize).subscribe({
      next: (p: Page<NotificationItem>) => {
        this.total = p.totalElements;
        if (reset) this.items = [];
        this.items = [...this.items, ...p.content];
        this.pageIndex = p.number + 1;
        this.reachedEnd = (this.items.length >= p.totalElements) || (p.number + 1 >= p.totalPages);
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; this.reachedEnd = true; }
    });
  }

  applyFilter() {
    const term = this.q.trim().toLowerCase();
    this.filtered = term
      ? this.items.filter(n =>
        (n.title || '').toLowerCase().includes(term) ||
        (n.body || '').toLowerCase().includes(term) ||
        this.programName(n).toLowerCase().includes(term))
      : [...this.items];
    this.groups = this.groupByDay(this.filtered);
  }

  // Extract program name for “enrollment approved”, “payment received”, etc.
  programName(n: NotificationItem): string {
    const x: any = n as any;
    return x.programName
      || x.program?.name
      || x.metadata?.programName
      || x.metadata?.program?.name
      || x.data?.programName
      || x.data?.program?.name
      || x.payload?.programName
      || x.payload?.program?.name
      || '';
  }

  private groupByDay(list: NotificationItem[]): Group[] {
    const by: Record<string, NotificationItem[]> = {};
    for (const n of list) {
      const d = new Date(n.createdAt as any);
      const key = d.toDateString();
      (by[key] ||= []).push(n);
    }
    const keys = Object.keys(by).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    return keys.map(k => {
      const label = k === today ? 'TODAY' : (k === yesterday ? 'YESTERDAY' : new Date(k).toLocaleDateString());
      const items = by[k].sort((a,b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
      return { label, items };
    });
  }
}
