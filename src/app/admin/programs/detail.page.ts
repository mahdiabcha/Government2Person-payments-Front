// src/app/admin/programs/detail.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProgramsApi, Program, ProgramState } from '../../api/programs.api';
import { EnrollmentApi, EnrollmentStatus } from '../../api/enrollment.api';
import { RulesBuilderComponent } from '../../shared/rules-builder.component';
import { AdminProfileDialogComponent } from '../../shared/admin-profile-dialog.component';

type Section = 'DETAILS' | 'RULES' | 'BENEFICIARIES';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RulesBuilderComponent,
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
      padding: 1rem 1.1rem; margin-bottom: .5rem;
    }
    .tabs {
      position: sticky; top: 0;
      z-index: 10;
      padding: .5rem 0;
      background: linear-gradient(180deg, rgba(255,255,255,.85), #fff);
      backdrop-filter: blur(6px);
    }
    .seg {
      display:flex; gap:.4rem; align-items:center;
      border:1px solid rgba(0,0,0,.06); border-radius:.8rem; padding:.25rem;
      background:#f8fafc;
    }
    .seg .tab {
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.45rem .8rem; border-radius:.6rem; border:0; background:transparent;
      font-weight:600; font-size:.9rem; color:#374151; cursor:pointer;
    }
    .seg .tab.active { background:#fff; box-shadow:0 1px 0 rgba(0,0,0,.04), 0 1px 10px rgba(0,0,0,.04); }
    .seg .tab:hover  { background:rgba(255,255,255,.6); }
    .seg .spacer { flex:1 1 auto; }

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

    .input { border:1px solid #e5e7eb; border-radius:.6rem; padding:.45rem .65rem; outline:0; }

    table thead th { font-size:.75rem; letter-spacing:.02em; text-transform:uppercase; color:#6b7280; }
    table tbody tr:hover { background: rgba(0,0,0,.025); }
    .empty { border:1px dashed #d1d5db; border-radius:.9rem; padding:1.1rem; color:#6b7280; text-align:center; background:#fafafa; }
  `],
  template: `
    <ng-container *ngIf="program; else loadingPage">

      <!-- Header -->
      <div class="hero">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-xl font-semibold truncate m-0">
              Program #{{ program.id }} — {{ program.name || 'Untitled' }}
            </h2>
            <div class="text-sm text-gray-600">Manage meta, rules, and beneficiaries.</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="chip" [ngClass]="stateClass(program.state)">{{ program.state }}</span>
            <a mat-stroked-button routerLink="/admin/programs/{{program.id}}/cycles">
              <mat-icon class="mr-1">schedule</mat-icon> Cycles
            </a>
          </div>
        </div>
      </div>

      <!-- Top segmented navigation -->
      <div class="tabs">
        <div class="seg">
          <button class="tab" [class.active]="section==='DETAILS'" (click)="setSection('DETAILS')">
            <mat-icon>info</mat-icon> Details
          </button>
          <button class="tab" [class.active]="section==='RULES'" (click)="setSection('RULES')">
            <mat-icon>rule</mat-icon> Rules
          </button>
          <button class="tab" [class.active]="section==='BENEFICIARIES'" (click)="setSection('BENEFICIARIES')">
            <mat-icon>group</mat-icon> Beneficiaries
          </button>
          <span class="spacer"></span>
          <button mat-stroked-button color="primary" (click)="saveCurrent()">
            <mat-icon>save</mat-icon> Save
          </button>
        </div>
      </div>

      <!-- DETAILS -->
      <div *ngIf="section==='DETAILS'" class="section">
        <h3>Program details</h3>
        <div class="grid md:grid-cols-2 gap-3 mt-2">
          <div>
            <label class="text-sm">Name</label>
            <input class="input w-full" [(ngModel)]="program.name"/>
          </div>
          <div>
            <label class="text-sm">State</label>
            <select class="input w-full" [ngModel]="selectedState" (ngModelChange)="onStateChange($event)">
              <option *ngFor="let s of states" [ngValue]="s">{{s}}</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="text-sm">Description</label>
            <textarea class="input w-full" rows="3" [(ngModel)]="program.description"></textarea>
          </div>
        </div>
        <div *ngIf="selectedState==='ACTIVE' && !hasValidRules(program?.rulesJson)" class="mt-2 text-sm text-red-700">
          Cannot activate without valid eligibility rules—please add rules in the Rules tab.
        </div>
        <div class="mt-3">
          <button mat-raised-button color="primary" (click)="saveMeta()" [disabled]="savingMeta">
            <mat-icon class="mr-1">save</mat-icon>
            {{ savingMeta ? 'Saving…' : 'Save meta' }}
          </button>
        </div>
      </div>

      <!-- RULES -->
      <div *ngIf="section==='RULES'" class="section">
        <h3 class="flex items-center gap-2"><mat-icon>rule</mat-icon> Eligibility rules</h3>
        <app-rules-builder [value]="program.rulesJson || ''" (jsonChange)="onRules($event)"></app-rules-builder>
        <div class="mt-2 flex gap-2 items-center">
          <button mat-raised-button color="primary" (click)="saveRules()" [disabled]="savingRules">
            <mat-icon class="mr-1">save</mat-icon>
            {{ savingRules ? 'Saving…' : 'Save rules' }}
          </button>
          <span class="text-xs text-gray-600" *ngIf="pendingJson">Will save {{ (pendingJson?.length||0) }} chars of JSON</span>
          <span class="text-xs text-gray-600" *ngIf="!pendingJson && program?.rulesJson">Rules are saved.</span>
        </div>
      </div>

      <!-- BENEFICIARIES -->
      <div *ngIf="section==='BENEFICIARIES'" class="section">
        <h3 class="flex items-center gap-2"><mat-icon>group</mat-icon> Beneficiaries</h3>

        <div class="flex flex-wrap gap-2 items-center mb-3">
          <label class="text-sm">Status</label>
          <select class="input" [(ngModel)]="benefStatus" (change)="loadBeneficiaries()">
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <span class="flex-1"></span>
          <input class="input min-w-[220px]" placeholder="Search username…" [(ngModel)]="q" />
        </div>

        <div class="flex items-center justify-center py-8" *ngIf="loadingBenefs">
          <mat-progress-spinner mode="indeterminate" diameter="28"></mat-progress-spinner>
        </div>

        <div *ngIf="!loadingBenefs && !filteredBeneficiaries.length" class="empty">
          No beneficiaries found for the current filter.
        </div>

        <div *ngIf="!loadingBenefs && filteredBeneficiaries.length">
          <table class="min-w-full text-sm">
            <thead>
            <tr class="border-b bg-gray-50">
              <th class="p-3 text-left">Username</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr *ngFor="let b of filteredBeneficiaries; trackBy: trackBenef" class="border-b">
              <td class="p-3">{{ b.username || b.citizenUsername || '—' }}</td>
              <td class="p-3 text-center">
                <span class="chip" [ngClass]="statusClass(b.status)">{{ b.status }}</span>
              </td>
              <td class="p-3">
                <div class="flex gap-1 justify-end">
                  <button mat-button color="primary" (click)="approve(b.enrollmentId)" *ngIf="b.status==='PENDING'">Approve</button>
                  <button mat-button color="warn" (click)="reject(b.enrollmentId)" *ngIf="b.status==='PENDING'">Reject</button>
                  <button mat-stroked-button (click)="openProfile(b.username || b.citizenUsername)">
                    View profile
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

    </ng-container>

    <!-- Loading page -->
    <ng-template #loadingPage>
      <div class="flex items-center justify-center py-20">
        <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
      </div>
    </ng-template>
  `
})
export class AdminProgramDetailPage {
  id = Number(this.route.snapshot.paramMap.get('id'));
  program?: Program;

  // sections
  section: Section = 'DETAILS';
  setSection(s: Section) { this.section = s; }
  saveCurrent() {
    if (this.section === 'DETAILS') this.saveMeta();
    if (this.section === 'RULES') this.saveRules();
  }

  // UI/helper state
  states: ProgramState[] = ['DRAFT','ACTIVE','INACTIVE','ARCHIVED'];
  selectedState: ProgramState = 'DRAFT';
  pendingJson = '';
  savingMeta = false;
  savingRules = false;

  // Beneficiaries
  beneficiaries: any[] = [];
  benefStatus?: EnrollmentStatus | '';
  loadingBenefs = false;
  q = '';

  constructor(
    private route: ActivatedRoute,
    private api: ProgramsApi,
    private enrollApi: EnrollmentApi,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() { this.reloadProgram(); }

  private reloadProgram() {
    this.api.getProgram(this.id).subscribe(p => {
      this.program = p;
      this.selectedState = p.state;
      this.loadBeneficiaries();
    });
  }

  // ---------- Rules ----------
  onRules(json: string) { this.pendingJson = json; }

  saveMeta() {
    if (!this.program) return;
    if (!this.program.rulesJson || !this.hasValidRules(this.program.rulesJson)) {
      this.snack.open('Please add valid eligibility rules before saving program meta.', 'Close', { duration: 2000 });
      return;
    }
    this.savingMeta = true;
    this.api.updateProgram(this.program.id, { name: this.program.name, description: this.program.description })
      .subscribe({
        next: p => { this.program = p; this.savingMeta = false; this.snack.open('Program meta updated.', 'Close', { duration: 1500 }); },
        error: _ => this.savingMeta = false
      });
  }

  saveRules() {
    if (!this.program) return;
    const text = (this.pendingJson && this.pendingJson.trim().length)
      ? this.pendingJson.trim()
      : (this.program.rulesJson || '').toString().trim();

    if (!this.hasValidRules(text)) {
      this.snack.open('Rules JSON is invalid. Please fix and try again.', 'Close', { duration: 2500 });
      return;
    }

    this.savingRules = true;
    this.api.updateRules(this.id, text).subscribe({
      next: _ => { this.pendingJson = ''; this.savingRules = false; this.snack.open('Rules saved.', 'Close', { duration: 1200 }); this.reloadProgram(); },
      error: _ => this.savingRules = false
    });
  }

  onStateChange(next: ProgramState) {
    if (!this.program) return;

    if (next === 'ACTIVE' && !this.hasValidRules(this.program.rulesJson)) {
      this.snack.open('Cannot activate without valid eligibility rules.', 'Close', { duration: 2200 });
      this.selectedState = this.program.state;
      return;
    }

    const prev = this.program.state;
    this.selectedState = next; // optimistic UI
    this.api.changeProgramState(this.program.id, next).subscribe({
      next: p => { this.program = p; this.selectedState = p.state; this.snack.open(`State changed to ${p.state}.`, 'Close', { duration: 1200 }); },
      error: _ => { this.selectedState = prev; }
    });
  }

  hasValidRules(text: any): boolean {
    const s = (typeof text === 'string' ? text : JSON.stringify(text ?? '')).trim();
    if (!s) return false;
    try { const parsed = JSON.parse(s); return parsed && typeof parsed === 'object'; }
    catch { return false; }
  }

  // ---------- Beneficiaries ----------
  loadBeneficiaries() {
    this.loadingBenefs = true;
    this.enrollApi.beneficiaries(this.id, this.benefStatus || undefined).subscribe({
      next: x => { this.beneficiaries = x; this.loadingBenefs = false; },
      error: _ => { this.beneficiaries = []; this.loadingBenefs = false; }
    });
  }

  get filteredBeneficiaries() {
    const q = this.q.trim().toLowerCase();
    return this.beneficiaries.filter(b => {
      const u = (b.username || b.citizenUsername || '').toLowerCase();
      return !q || u.includes(q);
    });
  }

  approve(enrollmentId: number) {
    this.enrollApi.approve(enrollmentId).subscribe(() => {
      this.snack.open('Enrollment approved.', 'Close', { duration: 1000 });
      this.loadBeneficiaries();
    });
  }

  reject(enrollmentId: number) {
    const note = prompt('Reason?')||'';
    this.enrollApi.reject(enrollmentId, note).subscribe(() => {
      this.snack.open('Enrollment rejected.', 'Close', { duration: 1000 });
      this.loadBeneficiaries();
    });
  }

  openProfile(username?: string) {
    const u = (username || '').trim();
    if (!u) { this.snack.open('No username on this row.', 'Close', { duration: 1200 }); return; }
    this.dialog.open(AdminProfileDialogComponent, { data: { username: u } });
  }

  // ---------- UI helpers ----------
  stateClass(s: ProgramState) {
    return s === 'ACTIVE' ? 'chip-success'
      : s === 'INACTIVE' ? 'chip-warn'
        : s === 'ARCHIVED' ? 'chip-muted'
          : 'chip-info';
  }
  statusClass(s: EnrollmentStatus) {
    return s === 'APPROVED' ? 'chip-success'
      : s === 'REJECTED' ? 'chip-muted'
        : 'chip-info';
  }
  trackBenef = (_: number, b: any) => b?.enrollmentId ?? _;
}
