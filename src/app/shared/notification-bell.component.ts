import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationsApi, NotificationItem } from "../api/notifications.api";
import { AuthService } from "../core/auth.service";
import { Subscription, interval, switchMap } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-notification-bell',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, RouterLink],
  styles: [`
    .bell-wrap { position: relative; display: inline-flex; align-items: center; }
    .btn { width: 40px; height: 40px; border-radius: 9999px; }
    .badge {
      position: absolute; top: -2px; right: -2px; transform: translate(25%, -25%);
      min-width: 18px; height: 18px; padding: 0 6px; border-radius: 9999px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; line-height: 1; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      box-shadow: 0 0 0 2px #fff, 0 2px 6px rgba(79,70,229,.35);
      will-change: transform;
    }
    .badge.pop { animation: pop .28s ease-out; }
    @keyframes pop {
      0% { transform: translate(25%,-25%) scale(.8); }
      60% { transform: translate(25%,-25%) scale(1.15); }
      100% { transform: translate(25%,-25%) scale(1); }
    }

    .menu-head { padding: 10px 12px; font-weight: 700; color:#0f172a; opacity:.9; }
    .item { display:flex; flex-direction:column; gap:4px; padding:12px; text-decoration:none; color:inherit; }
    .item:hover { background: #f8fafc; }
    .title { font-size: 14px; font-weight: 700; color:#0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .body  { font-size: 12px; color:#475569; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .prog  { font-size: 11px; color:#0f766e; }
    .meta  { font-size: 11px; color:#64748b; }
  `],
  template: `
    <div class="bell-wrap">
      <button class="btn" mat-icon-button [matMenuTriggerFor]="menu" aria-label="Notifications" (click)="refreshPreview()">
        <mat-icon>notifications</mat-icon>
      </button>
      <span *ngIf="count() > 0" class="badge" [class.pop]="pop">{{ displayCount() }}</span>
    </div>

    <mat-menu #menu="matMenu" class="min-w-[340px]" [overlapTrigger]="false">
      <div class="menu-head">Notifications</div>

      <ng-container *ngIf="items().length; else empty">
        <div class="max-h-[360px] overflow-auto">
          <a *ngFor="let n of items()"
             class="item"
             [routerLink]="[listRoute()]"
             (click)="goList()">
            <div class="title">{{ n.title }}</div>
            <div class="body">{{ n.body }}</div>
            <div class="prog" *ngIf="programName(n)">Program: {{ programName(n) }}</div>
            <div class="meta">{{ n.createdAt | date:'short' }}</div>
          </a>
        </div>

        <div class="px-3 pb-3 pt-2">
          <a class="w-full" mat-stroked-button [routerLink]="[listRoute()]" (click)="goList()">View all</a>
        </div>
      </ng-container>

      <ng-template #empty>
        <div class="px-3 py-4 text-sm text-gray-600">No notifications yet.</div>
      </ng-template>
    </mat-menu>
  `,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private api = inject(NotificationsApi);
  private auth = inject(AuthService);
  private router = inject(Router);

  count = signal(0);
  items = signal<NotificationItem[]>([]);
  isAdmin = computed(() => this.auth.roles().includes('ADMIN'));
  listRoute = computed(() => this.isAdmin() ? '/admin/notifications' : '/citizen/notifications');
  displayCount = computed(() => this.count() > 99 ? '99+' : String(this.count()));

  pop = false;
  private sub?: Subscription;

  ngOnInit(): void {
    this.refreshPreview();
    this.refreshCount();
    this.sub = interval(30000).pipe(switchMap(() => this.api.countMy()))
      .subscribe({ next: res => this.setCount(Number(res?.count || 0)), error: () => {} });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  goList() { this.router.navigateByUrl(this.listRoute()); }

  private setCount(v: number) {
    const before = this.count();
    this.count.set(v);
    if (v !== before) { // trigger a subtle pop
      this.pop = false;
      setTimeout(() => this.pop = true, 0);
      setTimeout(() => this.pop = false, 300);
    }
  }

  private refreshCount() {
    this.api.countMy().subscribe({
      next: r => this.setCount(Number(r?.count || 0)),
      error: () => this.setCount(0),
    });
  }

  refreshPreview() {
    this.api.listMy(0, 8).subscribe({
      next: page => this.items.set(page.content || []),
      error: () => this.items.set([]),
    });
  }

  /** Extract a program name for any notification shape:
   *  supports n.programName, n.program?.name, n.metadata.programName,
   *  n.data.programName, n.data.program?.name, etc.
   */
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
}
