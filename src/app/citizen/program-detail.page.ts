import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProgramsApi, Program } from '../api/programs.api';
import { EnrollmentApi, MyEnrollment } from '../api/enrollment.api';
import { ProfileApi } from '../api/profile.api';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

type RuleNode =
  | { type: 'AND'|'OR', rules: RuleNode[] }
  | { type: 'NOT', child: RuleNode }
  | { field: string, op: string, value?: any, min?: any, max?: any, message?: string };

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  styles: [`
    :host { display: block; }
    .hero {
      background: radial-gradient(1200px 400px at -10% -20%, rgba(59,130,246,.12), transparent),
                  radial-gradient(800px 300px at 120% -10%, rgba(16,185,129,.10), transparent);
    }
    .chip {
      @apply inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium;
      background: rgba(0,0,0,.05);
    }
    .chip-info { background: rgba(59,130,246,.12); color: rgb(37,99,235); }
    .chip-warn { background: rgba(245,158,11,.12); color: rgb(217,119,6); }
    .chip-ok   { background: rgba(16,185,129,.12); color: rgb(5,150,105); }
    .card { @apply rounded-xl border border-gray-200 bg-white; }
    .card-head { @apply flex items-center justify-between px-4 py-3 border-b border-gray-100; }
    .card-body { @apply p-4; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    .callout-ok    { @apply flex items-start gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200; }
    .callout-warn  { @apply flex items-start gap-2 p-3 rounded-lg bg-amber-50  text-amber-800  border border-amber-200; }
    .callout-bad   { @apply flex items-start gap-2 p-3 rounded-lg bg-rose-50    text-rose-700    border border-rose-200; }
  `],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- HERO -->
      <div class="hero rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 class="text-2xl font-semibold leading-tight truncate">
              {{ program?.name || 'Program' }}
            </h2>
            <p class="text-sm text-gray-600 mt-1 min-h-[1.25rem]">
              {{ program?.description || 'No description.' }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="chip chip-info" *ngIf="program">
                <mat-icon inline>flag</mat-icon> State: {{ program.state }}
              </span>
              <span class="chip" *ngIf="rulesSummary.length">
                <mat-icon inline>rule</mat-icon> {{ rulesSummary.length }} rule{{ rulesSummary.length>1?'s':'' }}
              </span>

            </div>
          </div>

          <div class="shrink-0 text-right">
            <button mat-raised-button color="primary"
              (click)="enroll()"
              [disabled]="!eligible || enrolling || program?.state!=='ACTIVE' || !!enrollBlockReason">
              <mat-icon>how_to_reg</mat-icon>
              <span class="ml-1">Enroll</span>
            </button>
            <div class="text-[11px] mt-2 text-rose-600" *ngIf="enrollBlockReason">
              {{ enrollBlockReason }}
            </div>
          </div>
        </div>
      </div>

      <!-- RULES -->
      <div class="card mb-6">
        <div class="card-head">
          <div class="flex items-center gap-2">
            <mat-icon>rule</mat-icon>
            <div class="font-semibold">Eligibility rules</div>
          </div>

        </div>

        <div class="card-body">
          <div *ngIf="rulesSummary.length; else noRules" class="space-y-1">
            <div *ngFor="let line of rulesSummary" class="text-sm flex items-start gap-2">
              <mat-icon class="!text-base !leading-5">check_circle</mat-icon>
              <span>{{ line }}</span>
            </div>
          </div>
          <ng-template #noRules>
            <div class="text-sm text-gray-600">No rules defined.</div>
          </ng-template>

          <pre *ngIf="showRaw" class="mono mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs overflow-auto">
{{ prettyRules }}
          </pre>
        </div>
      </div>

      <!-- ELIGIBILITY -->
      <div class="card mb-6">
        <div class="card-head">
          <div class="flex items-center gap-2">
            <mat-icon>fact_check</mat-icon>
            <div class="font-semibold">Eligibility check</div>
          </div>
          <button mat-stroked-button (click)="check()" [disabled]="checking">
            <mat-icon>cached</mat-icon>
            <span class="ml-1">Check eligibility</span>
          </button>
        </div>

        <div class="card-body">
          <div *ngIf="checking" class="flex items-center gap-2 text-sm text-gray-600">
            <mat-progress-spinner mode="indeterminate" diameter="18"></mat-progress-spinner>
            Checking…
          </div>

          <div *ngIf="eligible === true" class="callout-ok">
            <mat-icon>verified</mat-icon>
            <div>You are eligible for this program.</div>
          </div>

          <div *ngIf="eligible === false" class="callout-bad">
            <mat-icon>error</mat-icon>
            <div>
              <div class="font-medium">Not eligible</div>
              <div class="text-sm">{{ reason || defaultReason }}</div>
            </div>
          </div>

          <div *ngIf="eligible === null && !checking" class="text-sm text-gray-600">
            Click “Check eligibility” to see your status.
          </div>
        </div>
      </div>

      <!-- FOOT ACTIONS (secondary) -->
      <div class="flex items-center gap-2">
        <button mat-stroked-button color="primary" (click)="check()" [disabled]="checking">
          <mat-icon>cached</mat-icon>
          <span class="ml-1">Re-check</span>
        </button>
        <button mat-raised-button color="primary"
          (click)="enroll()"
          [disabled]="!eligible || enrolling || program?.state!=='ACTIVE' || !!enrollBlockReason">
          <mat-icon>how_to_reg</mat-icon>
          <span class="ml-1">Enroll</span>
        </button>
        <span class="text-xs text-gray-500" *ngIf="program?.state!=='ACTIVE'">
          Program is not active.
        </span>
      </div>

      <!-- LOADING STATE -->
      <div *ngIf="!program" class="mt-10 flex items-center justify-center text-sm text-gray-600">
        <mat-progress-spinner mode="indeterminate" diameter="24" class="mr-2"></mat-progress-spinner>
        Loading program…
      </div>
    </div>
  `
})
export class ProgramDetailPage {
  id = Number(this.route.snapshot.paramMap.get('id'));
  program?: Program;

  // Rules presentation
  showRaw = false;
  prettyRules = '';
  rulesSummary: string[] = [];

  // Eligibility
  eligible: boolean|null = null;
  reason?: string;
  defaultReason = 'Your profile does not satisfy at least one rule.';
  checking = false; enrolling = false;

  // Local debug info
  age: number|null = null;

  // enrollment guard
  enrollBlockReason = '';

  constructor(
    private route: ActivatedRoute,
    private programs: ProgramsApi,
    private enrollApi: EnrollmentApi,
    private profileApi: ProfileApi
  ) {}

  ngOnInit() {
    this.programs.getProgram(this.id).subscribe(p => {
      this.program = p;
      const parsed = this.parseRules(p?.rulesJson);
      this.prettyRules = this.prettyString(p?.rulesJson);
      this.rulesSummary = this.summarize(parsed);
    });
    this.profileApi.me().subscribe(me => {
      this.age = this.computeAge(me?.dateOfBirth || '');
    });
    // Check if user already has an enrollment in this program
    this.enrollApi.my().subscribe(list => {
      const mine = list.find(e => e.programId === this.id);
      if (mine) {
        const m: Record<MyEnrollment['status'], string> = {
          PENDING: 'You already have a pending enrollment for this program.',
          APPROVED: 'You have already been approved for this program.',
          REJECTED: 'Your previous enrollment was rejected.',
          CANCELED: 'Your enrollment is canceled; contact support to reapply.'
        } as any;
        this.enrollBlockReason = m[mine.status] || 'You already have an enrollment for this program.';
      }
    });
  }

  check() {
    this.checking = true;
    this.enrollApi.checkEligibility(this.id).subscribe(
      r => { this.eligible = r.eligible; this.reason = r.reason; this.checking = false; },
      _ => { this.eligible = null; this.checking = false; }
    );
  }

  enroll() {
    if (this.enrollBlockReason) return;
    this.enrolling = true;
    this.enrollApi.enroll(this.id).subscribe(
      () => { this.enrolling = false; this.enrollBlockReason = 'Enrollment submitted.'; },
      () => this.enrolling = false
    );
  }

  // ------- rules helpers (unchanged) -------
  private parseRules(rulesJson: any): RuleNode | null {
    if (!rulesJson) return null;
    try {
      const s = typeof rulesJson === 'string' ? rulesJson : JSON.stringify(rulesJson);
      return JSON.parse(s);
    } catch { return null; }
  }
  private prettyString(rulesJson: any): string {
    try {
      const s = typeof rulesJson === 'string' ? rulesJson : JSON.stringify(rulesJson ?? '');
      return JSON.stringify(JSON.parse(s), null, 2);
    } catch { return (rulesJson ?? '').toString(); }
  }
  private summarize(node: RuleNode | null): string[] {
    if (!node) return [];
    const out: string[] = [];
    const flat = this.flatten(node);
    const toLine = (l: any) => {
      const f = l.field || 'field';
      const op = (l.op || '').toUpperCase();
      const v = Array.isArray(l.value) ? `[${l.value.join(', ')}]` : (l.value ?? '');
      switch (op) {
        case 'TRUE': return `${f} is true`;
        case 'FALSE': return `${f} is false`;
        case 'EXISTS': return `${f} exists`;
        case 'EQ': return `${f} = ${v}`;
        case 'NEQ': return `${f} ≠ ${v}`;
        case 'GT': return `${f} > ${v}`;
        case 'GTE': return `${f} ≥ ${v}`;
        case 'LT': return `${f} < ${v}`;
        case 'LTE': return `${f} ≤ ${v}`;
        case 'BETWEEN': return `${f} between ${l.min} and ${l.max}`;
        case 'IN': return `${f} in ${v}`;
        case 'NOT_IN': return `${f} not in ${v}`;
        default: return `${f} ${op || 'OP'} ${v}`;
      }
    };
    for (const r of flat) out.push(toLine(r as any));
    return Array.from(new Set(out)).filter(Boolean);
  }
  private flatten(n: RuleNode): RuleNode[] {
    const acc: RuleNode[] = [];
    const rec = (node: RuleNode) => {
      if ((node as any).type === 'AND' || (node as any).type === 'OR') (node as any).rules?.forEach(rec);
      else if ((node as any).type === 'NOT') rec((node as any).child);
      else acc.push(node);
    };
    rec(n); return acc;
  }
  private computeAge(dateStr: string): number|null {
    if (!dateStr) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) return null;
    const y = +m[1], mo = +m[2]-1, d = +m[3];
    const dob = new Date(Date.UTC(y, mo, d));
    const now = new Date();
    let age = now.getUTCFullYear() - dob.getUTCFullYear();
    const mDiff = now.getUTCMonth() - dob.getUTCMonth();
    const dDiff = now.getUTCDate() - dob.getUTCDate();
    if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age--;
    return age;
  }
}
