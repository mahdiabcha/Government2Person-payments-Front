import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LayoutModule, BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from './core/auth.service';
import { NotificationBellComponent } from './shared/notification-bell.component';

type NavItem = { label: string; icon: string; link: string; exact?: boolean };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatDividerModule, MatTooltipModule, MatSnackBarModule,
    LayoutModule, NotificationBellComponent
  ],
  template: `
    <div class="app-container flex bg-slate-50 min-h-screen">
      <mat-sidenav-container class="w-full min-h-screen">
        <mat-sidenav
          class="sidenav !bg-[#0f172a] !text-slate-100 border-r border-white/10"
          [mode]="isHandset() ? 'over' : 'side'"
          [opened]="isHandset() ? drawerOpen() : loggedIn()"
          [style.width.px]="!isHandset() ? (sidebarExpanded() ? 256 : 80) : null"
          (keydown.escape)="closeDrawerOnHandset()"
        >
          <div class="flex items-center justify-between px-3 py-3">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <mat-icon>verified</mat-icon>
              </div>
              <span class="font-semibold tracking-wide" *ngIf="sidebarExpanded() && !isHandset()">OpenG2P</span>
            </div>
            <button
              mat-icon-button
              *ngIf="!isHandset()"
              (click)="toggleSidebar()"
              class="!text-slate-200 hover:!bg-white/10"
              [matTooltip]="sidebarExpanded() ? 'Collapse' : 'Expand'"
              matTooltipPosition="right"
              aria-label="Toggle sidebar"
            >
              <mat-icon>{{ sidebarExpanded() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
            </button>
          </div>

          <mat-divider class="!border-white/10"></mat-divider>

          <ng-container *ngIf="isCitizenArea() && isCitizen()">
            <div class="px-4 pt-3 pb-1 text-[10px] uppercase text-slate-400" *ngIf="sidebarExpanded() && !isHandset()">Citizen</div>
            <mat-nav-list class="!px-2">
              <a mat-list-item *ngFor="let item of citizenMenu"
                 [routerLink]="item.link" routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: item.exact ?? false}" class="nav-item"
                 (click)="navClicked()"
                 [matTooltip]="(sidebarExpanded() && !isHandset()) ? '' : item.label" matTooltipPosition="right">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle *ngIf="sidebarExpanded() && !isHandset()">{{ item.label }}</span>
              </a>
            </mat-nav-list>
          </ng-container>

          <ng-container *ngIf="isAdminArea() && isAdmin()">
            <div class="px-4 pt-3 pb-1 text-[10px] uppercase text-slate-400" *ngIf="sidebarExpanded() && !isHandset()">Admin</div>
            <mat-nav-list class="!px-2">
              <a mat-list-item *ngFor="let item of adminMenu"
                 [routerLink]="item.link" routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: item.exact ?? false}" class="nav-item"
                 (click)="navClicked()
                 " [matTooltip]="(sidebarExpanded() && !isHandset()) ? '' : item.label" matTooltipPosition="right">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle *ngIf="sidebarExpanded() && !isHandset()">{{ item.label }}</span>
              </a>
            </mat-nav-list>
          </ng-container>

          <div class="flex-1"></div>

          <div class="p-3" *ngIf="loggedIn()">
            <button mat-stroked-button class="w-full logout-btn" (click)="logout()"
                    [matTooltip]="(sidebarExpanded() && !isHandset()) ? '' : 'Logout'" matTooltipPosition="right">
              <mat-icon class="mr-2">logout</mat-icon>
              <span *ngIf="sidebarExpanded() && !isHandset()">Logout</span>
            </button>
          </div>
        </mat-sidenav>

        <mat-sidenav-content>
          <mat-toolbar class="!px-3 md:!px-4 text-slate-100 bg-gradient-to-r from-slate-900 to-indigo-900">
            <button
              mat-icon-button
              class="mr-1"
              *ngIf="loggedIn() && isHandset()"
              (click)="drawerOpen.set(true)"
              aria-label="Open menu"
            >
              <mat-icon>menu</mat-icon>
            </button>

            <div class="flex items-center gap-3">
              <span class="font-semibold tracking-wide text-lg">{{ topTitle() }}</span>
              <span class="hidden md:inline text-sm opacity-70" *ngIf="topSubtitle()">{{ topSubtitle() }}</span>
            </div>

            <span class="flex-1"></span>

            <ng-container *ngIf="loggedIn(); else authLinks">
              <app-notification-bell class="mr-1"></app-notification-bell>
              <div class="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10">
                <div class="h-7 w-7 rounded-full bg-emerald-500/80 text-slate-900 font-bold text-xs flex items-center justify-center">
                  {{ initials() }}
                </div>
                <span class="hidden sm:inline text-sm">{{ displayName() }}</span>
              </div>
            </ng-container>
            <ng-template #authLinks>
              <a routerLink="/login" class="text-sm underline decoration-white/50 hover:decoration-white">Login</a>
            </ng-template>
          </mat-toolbar>

          <div class="p-4">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .sidenav { transition: width .18s ease; }
    .active { background: rgba(255,255,255,0.18); border-left: 3px solid #ffffff; color: #ffffff !important; font-weight: 700; }
    .nav-item { border-radius: 10px; margin: 4px 6px; padding: 6px 10px; color: #ffffff !important; font-weight: 600; }
    .nav-item:hover { background: rgba(255,255,255,0.12); color: #ffffff !important; }
    :host ::ng-deep .mat-mdc-list-item-title, :host ::ng-deep .mat-mdc-list-item { color: #ffffff !important; }
    :host ::ng-deep .mat-mdc-list-item-icon { color: #ffffff !important; }
    .logout-btn { color: #3b82f6 !important; border-color: #3b82f6 !important; font-weight: 600; }
    .logout-btn mat-icon { color: #3b82f6 !important; }
    .logout-btn:hover { background: rgba(59,130,246,0.1); }
    :host ::ng-deep .mat-toolbar { box-shadow: inset 0 -1px 0 rgba(255,255,255,0.06); }
  `]
})
export class AppComponent {
  constructor(
    public auth: AuthService,
    private router: Router,
    private snack: MatSnackBar,
    private bp: BreakpointObserver
  ) {
    // hydrate persisted sidebar state (desktop only)
    const persisted = localStorage.getItem('sidebarExpanded');
    if (persisted !== null) this.sidebarExpanded.set(persisted === '1');

    // handset detection
    this.bp.observe([Breakpoints.Handset]).subscribe(res => {
      this._isHandset.set(res.matches);
      if (res.matches) {
        // close drawer on phones by default
        this.drawerOpen.set(false);
      }
    });
  }

  // --------- layout state
  private _isHandset = signal(false);
  isHandset = () => this._isHandset();

  drawerOpen = signal(false);               // for handset (over) mode
  sidebarExpanded = signal(true);           // for desktop width (collapsed vs expanded)
  toggleSidebar = () => {
    this.sidebarExpanded.update(v => {
      const next = !v;
      localStorage.setItem('sidebarExpanded', next ? '1' : '0');
      return next;
    });
  };
  closeDrawerOnHandset = () => { if (this.isHandset()) this.drawerOpen.set(false); };

  // keyboard shortcut: Ctrl/Cmd + B toggles sidebar (desktop)
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key.toLowerCase() === 'b')) {
      e.preventDefault();
      if (this.isHandset()) {
        this.drawerOpen.update(v => !v);
      } else {
        this.toggleSidebar();
      }
    }
  }

  // --------- auth & routing helpers
  loggedIn = () => !!localStorage.getItem('jwt');
  isCitizenArea = () => this.router.url.startsWith('/citizen');
  isAdminArea   = () => this.router.url.startsWith('/admin');

  isCitizen = () => (this.auth.roles() || []).includes('CITIZEN');
  isAdmin   = () => (this.auth.roles() || []).includes('ADMIN');

  displayName = () => this.auth.username() || (this.isAdmin() ? 'Admin' : 'User');
  initials = () => (this.displayName().match(/\b\w/g) || []).slice(0,2).join('').toUpperCase();

  citizenMenu: NavItem[] = [
    { label: 'Profile',        icon: 'person',        link: '/citizen/profile',    exact: true },
    { label: 'Documents',      icon: 'attach_file',   link: '/citizen/documents' },
    { label: 'Catalog',        icon: 'view_list',     link: '/citizen/catalog' },
    { label: 'My Enrollments', icon: 'assignment',    link: '/citizen/enrollments' },
    { label: 'Notifications',  icon: 'notifications', link: '/citizen/notifications' },
  ];
  adminMenu: NavItem[] = [
    { label: 'Programs',      icon: 'dashboard',  link: '/admin/programs',          exact: true },
    { label: 'Batches',       icon: 'payments',   link: '/admin/payments/batches' },
    { label: 'Notifications', icon: 'notifications', link: '/admin/notifications' },
  ];

  navClicked() { if (this.isHandset()) this.drawerOpen.set(false); }

  topTitle() {
    if (this.isAdminArea() && this.isAdmin()) {
      const h = new Date().getHours();
      const period = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      const u = this.auth.username() || 'Admin';
      return `${period}, ${u}`;
    }
    if (this.isCitizenArea() && this.isCitizen()) return 'Explore Programs';
    return 'Welcome to OpenG2P';
  }

  topSubtitle() {
    if (this.isAdminArea() && this.isAdmin()) return 'Manage programs and payment batches';
    if (this.isCitizenArea() && this.isCitizen()) return 'Find and enroll in benefits that fit you';
    return '';
  }

  logout() {
    this.auth.clear();
    this.snack.open('Logged out', 'Close', { duration: 1200 });
    this.router.navigateByUrl('/login');
  }
}
