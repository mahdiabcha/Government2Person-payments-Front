import { Component, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Op = 'EXISTS'|'TRUE'|'FALSE'|'EQ'|'NEQ'|'GT'|'GTE'|'LT'|'LTE'|'BETWEEN'|'IN'|'NOT_IN';

type RuleNode =
  | { type: 'AND'|'OR', rules: RuleNode[] }
  | { type: 'NOT', child: RuleNode }
  | { field: string, op: Op, value?: any, min?: any, max?: any, message?: string };

@Component({
  selector: 'app-rules-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .card { @apply border rounded p-3; }
    .row  { @apply grid md:grid-cols-3 gap-2; }
    .lbl  { @apply text-xs text-gray-600; }
    .input{ @apply border rounded px-2 py-2 w-full; }
    .btn  { @apply rounded px-3 py-2 border; }
    .btnp { @apply bg-indigo-600 text-white hover:opacity-90; }
    .btno { @apply border-gray-300 hover:bg-gray-50; }
    .chip { @apply inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 text-xs; }
  `],
  template: `
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="lbl">Combine rules with</span>
        <select class="input !w-28" [(ngModel)]="groupType">
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
        <label class="inline-flex items-center gap-2 ml-4">
          <input type="checkbox" [(ngModel)]="wrapNot"/>
          <span class="lbl">Wrap with NOT</span>
        </label>

        <div class="flex-1"></div>
        <button class="btn btno" (click)="advanced = !advanced">{{ advanced ? 'Basic mode' : 'Advanced (raw JSON)' }}</button>
      </div>

      <!-- BASIC -->
      <div *ngIf="!advanced" class="space-y-4">
        <div class="card">
          <div class="row">
            <div>
              <label class="lbl">KYC verification</label>
              <label class="inline-flex items-center gap-2 mt-1">
                <input type="checkbox" [(ngModel)]="form.kycRequired" />
                <span>Require kycVerified = true</span>
              </label>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="row">
            <div>
              <label class="lbl">Age min</label>
              <input class="input" type="number" [(ngModel)]="form.ageMin" placeholder="e.g., 18">
            </div>
            <div>
              <label class="lbl">Age max</label>
              <input class="input" type="number" [(ngModel)]="form.ageMax" placeholder="e.g., 65">
            </div>
            <div class="self-end text-xs text-gray-500">Field used: <code>age</code> (inclusive)</div>
          </div>
        </div>

        <div class="card">
          <div class="row">
            <div>
              <label class="lbl">Monthly income min</label>
              <input class="input" type="number" [(ngModel)]="form.incomeMin" placeholder="e.g., 0">
            </div>
            <div>
              <label class="lbl">Monthly income max</label>
              <input class="input" type="number" [(ngModel)]="form.incomeMax" placeholder="e.g., 1000">
            </div>
            <div class="self-end text-xs text-gray-500">Field used: <code>incomeMonthly</code> (inclusive)</div>
          </div>
        </div>

        <div class="card">
          <div class="row">
            <div>
              <label class="lbl">Household size min</label>
              <input class="input" type="number" [(ngModel)]="form.hhMin" placeholder="e.g., 1">
            </div>
            <div>
              <label class="lbl">Household size max</label>
              <input class="input" type="number" [(ngModel)]="form.hhMax" placeholder="e.g., 10">
            </div>
            <div class="self-end text-xs text-gray-500">Field used: <code>householdSize</code> (inclusive)</div>
          </div>
        </div>

        <div class="card">
          <div class="row">
            <div>
              <label class="lbl">Allowed genders</label>
              <div class="flex gap-2 mt-1">
                <label class="inline-flex items-center gap-1"><input type="checkbox" [(ngModel)]="form.genderF">F</label>
                <label class="inline-flex items-center gap-1"><input type="checkbox" [(ngModel)]="form.genderM">M</label>
                <label class="inline-flex items-center gap-1"><input type="checkbox" [(ngModel)]="form.genderO">Other</label>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <label class="lbl">Allowed governorates (comma separated)</label>
          <input class="input" placeholder="Tunis, Sfax, Sousse" [(ngModel)]="form.govsCsv" (ngModelChange)="updateGovList()">
          <div class="mt-2 flex flex-wrap gap-2" *ngIf="govList().length">
            <span class="chip" *ngFor="let g of govList()">{{ g }}</span>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">Advanced rows (optional)</div>
            <button class="btn btno" (click)="addRow()">Add row</button>
          </div>

          <div class="space-y-2" *ngIf="rows.length; else norows">
            <div class="grid md:grid-cols-6 gap-2 items-end" *ngFor="let r of rows; let i = index">
              <div>
                <label class="lbl">Field</label>
                <input class="input" [(ngModel)]="r.field" placeholder="e.g., username">
              </div>
              <div>
                <label class="lbl">Op</label>
                <select class="input" [(ngModel)]="r.op">
                  <option *ngFor="let o of ops" [ngValue]="o">{{o}}</option>
                </select>
              </div>

              <ng-container [ngSwitch]="r.op">
                <div *ngSwitchCase="'BETWEEN'">
                  <label class="lbl">Min</label>
                  <input class="input" [(ngModel)]="r.min">
                </div>
                <div *ngSwitchCase="'BETWEEN'">
                  <label class="lbl">Max</label>
                  <input class="input" [(ngModel)]="r.max">
                </div>
                <div *ngSwitchCase="'IN'">
                  <label class="lbl">Values (comma)</label>
                  <input class="input" [(ngModel)]="r.value" placeholder="val1,val2">
                </div>
                <div *ngSwitchCase="'NOT_IN'">
                  <label class="lbl">Values (comma)</label>
                  <input class="input" [(ngModel)]="r.value" placeholder="val1,val2">
                </div>
                <div *ngSwitchDefault>
                  <label class="lbl">Value</label>
                  <input class="input" [(ngModel)]="r.value">
                </div>
                <div>
                  <label class="lbl">Message (optional)</label>
                  <input class="input" [(ngModel)]="r.message" placeholder="Shown if rule fails">
                </div>
              </ng-container>

              <div class="text-right">
                <button class="btn btno" (click)="rows.splice(i,1)">Remove</button>
              </div>
            </div>
          </div>
          <ng-template #norows>
            <div class="text-sm text-gray-500">No custom rows.</div>
          </ng-template>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn btnp" (click)="emitJson()">Use these rules</button>
          <span class="text-xs text-gray-600">This will overwrite rulesJson for the program.</span>
        </div>
      </div>

      <!-- RAW -->
      <div *ngIf="advanced" class="space-y-2">
        <div class="lbl">Raw rules JSON (must match backend grammar)</div>
        <textarea class="input !h-64 font-mono" [(ngModel)]="rawJson"></textarea>
        <div class="flex items-center gap-2">
          <button class="btn btnp" (click)="emitRaw()">Use raw JSON</button>
          <button class="btn btno" (click)="tryImport()">Import into builder</button>
          <span class="text-xs text-gray-600">Import supports simple AND with common fields.</span>
        </div>
      </div>

      <div class="card">
        <div class="font-medium mb-1">Preview</div>
        <pre class="text-xs whitespace-pre-wrap">{{ preview() }}</pre>
      </div>
    </div>
  `
})
export class RulesBuilderComponent implements OnChanges {
  /** When value arrives/changes, we auto-import it into the visual builder */
  @Input() set value(v: string | null | undefined) {
    this.rawJson = (v ?? '').trim();
    this.maybeAutoImport();
  }
  @Output() jsonChange = new EventEmitter<string>();

  advanced = false;
  groupType: 'AND'|'OR' = 'AND';
  wrapNot = false;

  ops: Op[] = ['EXISTS','TRUE','FALSE','EQ','NEQ','GT','GTE','LT','LTE','BETWEEN','IN','NOT_IN'];

  form = {
    kycRequired: false,
    ageMin: undefined as number|undefined,
    ageMax: undefined as number|undefined,
    incomeMin: undefined as number|undefined,
    incomeMax: undefined as number|undefined,
    hhMin: undefined as number|undefined,
    hhMax: undefined as number|undefined,
    genderF: false,
    genderM: false,
    genderO: false,
    govsCsv: ''
  };

  rows: Array<{field: string; op: Op; value?: any; min?: any; max?: any; message?: string}> = [];
  rawJson = '';

  govList = signal<string[]>([]);
  ngOnInit() { this.updateGovList(); }
  ngOnChanges(_: SimpleChanges) { this.maybeAutoImport(); }

  private maybeAutoImport() {
    // Only try to import when we actually have JSON and we’re in basic mode
    if (this.advanced) return;
    const s = (this.rawJson || '').trim();
    if (!s) {
      // Clear the visual form if there are no rules yet
      this.resetForm();
      return;
    }
    try {
      JSON.parse(s);
      this.tryImport(); // will safely ignore unsupported shapes
    } catch {
      // ignore invalid JSON
    }
  }

  private resetForm() {
    this.form = {
      kycRequired:false, ageMin:undefined, ageMax:undefined,
      incomeMin:undefined, incomeMax:undefined, hhMin:undefined, hhMax:undefined,
      genderF:false, genderM:false, genderO:false, govsCsv:''
    };
    this.rows = [];
    this.govList.set([]);
    this.groupType = 'AND'; this.wrapNot = false;
  }

  updateGovList() {
    const arr = (this.form.govsCsv || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    this.govList.set(arr);
  }

  addRow() { this.rows.push({ field: '', op: 'EQ' }); }

  // ---------- build & preview ----------
  buildNode(): RuleNode {
    const rules: RuleNode[] = [];

    if (this.form.kycRequired) {
      rules.push({ field: 'kycVerified', op: 'TRUE', message: 'KYC is required' });
    }

    if (this.form.ageMin != null) {
      rules.push({ field: 'age', op: 'GTE', value: +this.form.ageMin, message: 'Age is too low' } as any);
    }
    if (this.form.ageMax != null) {
      rules.push({ field: 'age', op: 'LTE', value: +this.form.ageMax, message: 'Age is too high' } as any);
    }

    if (this.form.incomeMin != null) {
      rules.push({ field: 'incomeMonthly', op: 'GTE', value: +this.form.incomeMin, message: 'Income too low' } as any);
    }
    if (this.form.incomeMax != null) {
      rules.push({ field: 'incomeMonthly', op: 'LTE', value: +this.form.incomeMax, message: 'Income too high' } as any);
    }

    if (this.form.hhMin != null) {
      rules.push({ field: 'householdSize', op: 'GTE', value: +this.form.hhMin, message: 'Household size too small' } as any);
    }
    if (this.form.hhMax != null) {
      rules.push({ field: 'householdSize', op: 'LTE', value: +this.form.hhMax, message: 'Household size too big' } as any);
    }

    const genders: string[] = [];
    if (this.form.genderF) genders.push('F');
    if (this.form.genderM) genders.push('M');
    if (this.form.genderO) genders.push('O');
    if (genders.length === 1)      rules.push({ field: 'gender',      op: 'EQ', value: genders[0], message: 'Gender not allowed' });
    else if (genders.length > 1)   rules.push({ field: 'gender',      op: 'IN', value: genders,    message: 'Gender not allowed' });

    const govs = this.govList();
    if (govs.length === 1)         rules.push({ field: 'governorate', op: 'EQ', value: govs[0],    message: 'Governorate not allowed' });
    else if (govs.length > 1)      rules.push({ field: 'governorate', op: 'IN', value: govs,       message: 'Governorate not allowed' });

    for (const r of this.rows) {
      if (!r.field || !r.op) continue;
      const node: any = { field: r.field, op: r.op, message: r.message };
      if (r.op === 'BETWEEN') { node.min = r.min; node.max = r.max; }
      else if (r.op === 'IN' || r.op === 'NOT_IN') {
        node.value = typeof r.value === 'string'
          ? r.value.split(',').map((x: string) => x.trim()).filter(Boolean)
          : r.value;
      } else if (r.op !== 'TRUE' && r.op !== 'FALSE' && r.op !== 'EXISTS') {
        node.value = r.value;
      }
      rules.push(node as RuleNode);
    }

    let root: RuleNode = { type: this.groupType, rules };
    if (this.wrapNot) root = { type: 'NOT', child: root };

    return root;
  }

  preview() {
    try { return JSON.stringify(this.buildNode(), null, 2); }
    catch { return 'Invalid'; }
  }

  // ---------- emit ----------
  emitJson() {
    const json = this.preview();
    this.jsonChange.emit(json);
    this.rawJson = json;
  }

  emitRaw() {
    try {
      const pretty = JSON.stringify(JSON.parse(this.rawJson || '""'), null, 2);
      this.jsonChange.emit(pretty);
      this.rawJson = pretty;
    } catch {
      this.jsonChange.emit(this.rawJson || '');
    }
  }

  // ---------- import ----------
  tryImport() {
    try {
      const node: any = JSON.parse(this.rawJson || '{}');
      this.resetForm();

      this.groupType = node?.type === 'OR' ? 'OR' : 'AND';
      this.wrapNot = node?.type === 'NOT';

      const rules: any[] =
        node?.type === 'NOT' ? (node.child?.rules ?? []) :
          node?.rules ?? [];

      const genders: string[] = [];
      const govs: string[] = [];

      for (const r of rules ?? []) {
        if (r.field === 'kycVerified' && r.op === 'TRUE') this.form.kycRequired = true;
        else if (r.field === 'age') {
          if (r.op === 'GTE') this.form.ageMin = +r.value;
          else if (r.op === 'LTE') this.form.ageMax = +r.value;
          else if (r.op === 'BETWEEN') this.rows.push(r);
        } else if (r.field === 'incomeMonthly') {
          if (r.op === 'GTE') this.form.incomeMin = +r.value;
          else if (r.op === 'LTE') this.form.incomeMax = +r.value;
          else if (r.op === 'BETWEEN') this.rows.push(r);
        } else if (r.field === 'householdSize') {
          if (r.op === 'GTE') this.form.hhMin = +r.value;
          else if (r.op === 'LTE') this.form.hhMax = +r.value;
          else if (r.op === 'BETWEEN') this.rows.push(r);
        } else if (r.field === 'gender') {
          const vals = Array.isArray(r.value) ? r.value : [r.value];
          for (const v of vals) if (typeof v === 'string') genders.push(v);
        } else if (r.field === 'governorate') {
          const vals = Array.isArray(r.value) ? r.value : [r.value];
          for (const v of vals) if (typeof v === 'string') govs.push(v);
        } else {
          this.rows.push({ field: r.field, op: r.op, value: r.value, min: r.min, max: r.max, message: r.message });
        }
      }

      this.form.genderF = genders.includes('F');
      this.form.genderM = genders.includes('M');
      this.form.genderO = genders.includes('O');
      this.form.govsCsv = govs.join(', ');
      this.updateGovList();
      this.advanced = false;
    } catch {
      // ignore import errors
    }
  }
}
