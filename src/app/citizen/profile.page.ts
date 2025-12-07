import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ProfileApi, Profile } from '../api/profile.api';

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatButtonModule, MatSnackBarModule,
    MatIconModule, MatDividerModule
  ],
  styles: [`
    :host { display:block; }
    .hero {
      border-radius: 1rem;
      border: 1px solid rgba(0,0,0,.06);
      background:
        radial-gradient(1000px 180px at -10% -30%, rgba(59,130,246,.14), transparent 60%),
        radial-gradient(1000px 180px at 110% 130%, rgba(16,185,129,.14), transparent 60%),
        linear-gradient(180deg, #fff, #fafafa);
      padding: 1.25rem 1rem;
      margin-bottom: 1rem;
    }
    .hero h2 { margin: 0; }
    .muted { color:#6b7280; }

    .section {
      border: 1px solid rgba(0,0,0,.06);
      border-radius: .85rem;
      background: #fff;
      padding: 1rem;
    }
    .section h3 { margin: 0 0 .5rem 0; font-size: 1rem; font-weight: 600; }
    .hint { font-size: .8rem; color: #6b7280; }

    .chip {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.2rem .55rem; border-radius:999px; font-size:.75rem; font-weight:600;
      background: rgba(0,0,0,.05);
    }
    .chip-success { background: rgba(16,185,129,.16); color: rgb(4,120,87); }
    .chip-warn    { background: rgba(245,158,11,.16); color: rgb(180,83,9); }
    .chip-info    { background: rgba(59,130,246,.16); color: rgb(37,99,235); }

    .bar { position: relative; height: 8px; border-radius: 999px; background: #edf2f7; overflow: hidden; border: 1px solid rgba(0,0,0,.06); }
    .bar > div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #60a5fa, #34d399); transition: width .3s ease; }

    .grid-2 { display:grid; grid-template-columns: repeat(1,minmax(0,1fr)); gap: .75rem; }
    @media (min-width: 768px) { .grid-2 { grid-template-columns: repeat(2,minmax(0,1fr)); } }

    .footer { position: sticky; bottom: 0; padding-top: .75rem; background: linear-gradient(180deg, rgba(255,255,255,.2), #fff 50%); }
  `],
  template: `
    <!-- Fancy header -->
    <div class="hero">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">My Profile</h2>
          <div class="muted text-sm">Keep your information up to date so programs can verify eligibility.</div>
        </div>
        <div class="min-w-[200px]">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="muted">Completeness</span>
            <span>{{ percentComplete() }}%</span>
          </div>
          <div class="bar"><div [style.width.%]="percentComplete()"></div></div>
        </div>
      </div>
    </div>

    <!-- ✅ bind the whole content to the reactive form -->
    <form class="grid-2" [formGroup]="form">
      <!-- Basic info -->
      <div class="section">
        <h3>Basic information</h3>
        <div class="grid-2">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Gender</mat-label>
            <input matInput formControlName="gender" placeholder="F / M / Other">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date of Birth (yyyy-MM-dd)</mat-label>
            <input matInput formControlName="dateOfBirth" placeholder="1999-05-20" autocomplete="bday">
          </mat-form-field>
        </div>
        <div class="hint mt-1">Use ISO format for date (e.g., 1992-11-30).</div>
      </div>

      <!-- Location & household -->
      <div class="section">
        <h3>Location & household</h3>
        <div class="grid-2">
          <mat-form-field appearance="outline">
            <mat-label>Governorate</mat-label>
            <input matInput formControlName="governorate">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>District</mat-label>
            <input matInput formControlName="district">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Household size</mat-label>
            <input matInput type="number" formControlName="householdSize">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Monthly income</mat-label>
            <input matInput type="number" formControlName="incomeMonthly">
          </mat-form-field>
        </div>
        <div class="hint mt-1">Provide approximate amounts if unsure.</div>
      </div>

      <!-- Verification & payment -->
      <div class="section md:col-span-2">
        <div class="flex items-center justify-between">
          <h3>Verification & payment</h3>
          <div class="flex gap-2">
            <span class="chip" [ngClass]="(form.value.kycVerified ? 'chip-success':'chip-warn')">
              <mat-icon fontIcon="{{ form.value.kycVerified ? 'verified' : 'error_outline' }}"></mat-icon>
              KYC {{ form.value.kycVerified ? 'verified' : 'not verified' }}
            </span>
            <span class="chip chip-info">
              <mat-icon fontIcon="account_balance_wallet"></mat-icon>
              {{ form.value.paymentMethod || 'NONE' }}
            </span>
          </div>
        </div>

        <div class="grid-2 mt-2">
          <mat-checkbox formControlName="kycVerified">KYC verified</mat-checkbox>

          <mat-form-field appearance="outline" class="md:col-span-1">
            <mat-label>Payment method</mat-label>
            <mat-select formControlName="paymentMethod" (selectionChange)="onMethodChange()">
              <mat-option value="NONE">NONE</mat-option>
              <mat-option value="BANK">BANK</mat-option>
              <mat-option value="WALLET">WALLET</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- BANK fields -->
        <div class="grid-2 mt-2" *ngIf="form.value.paymentMethod === 'BANK'">
          <mat-form-field appearance="outline">
            <mat-label>Bank name</mat-label>
            <input matInput formControlName="bankName" autocomplete="organization">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>IBAN</mat-label>
            <input matInput formControlName="iban" placeholder="LBxx xxxx xxxx xxxx xxxx xxxx xxxx" autocomplete="off">
          </mat-form-field>

          <mat-form-field appearance="outline" class="md:col-span-2">
            <mat-label>Account holder</mat-label>
            <input matInput formControlName="accountHolder" placeholder="Exact name on the account" autocomplete="name">
          </mat-form-field>
        </div>

        <!-- WALLET fields -->
        <div class="grid-2 mt-2" *ngIf="form.value.paymentMethod === 'WALLET'">
          <mat-form-field appearance="outline">
            <mat-label>Wallet provider</mat-label>
            <input matInput formControlName="walletProvider" placeholder="e.g., OMT, Whish">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Wallet number</mat-label>
            <input matInput formControlName="walletNumber" placeholder="(+961)…">
          </mat-form-field>
        </div>

        <div class="hint mt-1" *ngIf="form.value.paymentMethod==='NONE'">
          Choose BANK or WALLET to receive disbursements.
        </div>
      </div>
    </form>

    <!-- Footer actions -->
    <div class="footer mt-4">
      <div class="flex items-center justify-between">
        <div class="muted text-sm">
          <span *ngIf="!form.dirty">All changes saved.</span>
          <span *ngIf="form.dirty">You have unsaved changes.</span>
        </div>
        <div class="flex items-center gap-2">
          <button mat-stroked-button (click)="resetPaymentExtras()" *ngIf="form.value.paymentMethod!=='NONE'">
            Clear payment fields
          </button>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="saving || !form.dirty">
            <mat-icon fontIcon="save"></mat-icon>
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfilePage {
  form = this.fb.group<Profile>({
    firstName: '', lastName: '', gender: '', dateOfBirth: '',
    governorate: '', district: '',
    householdSize: undefined, incomeMonthly: undefined,
    kycVerified: false, paymentMethod: 'NONE',
    bankName: '', iban: '', accountHolder: '',
    walletProvider: '', walletNumber: '',
  } as any);

  saving = false;

  constructor(private fb: FormBuilder, private api: ProfileApi, private snack: MatSnackBar) {}

  ngOnInit() {
    this.api.me().subscribe(p => {
      this.form.patchValue(p || {});
      this.form.markAsPristine();
    });
  }

  onMethodChange() {
    const pm = (this.form.value as any).paymentMethod;
    if (pm === 'BANK') {
      this.form.patchValue({ walletProvider: '', walletNumber: '' } as any);
    } else if (pm === 'WALLET') {
      this.form.patchValue({ bankName: '', iban: '', accountHolder: '' } as any);
    } else {
      this.resetPaymentExtras();
    }
  }

  resetPaymentExtras() {
    this.form.patchValue({
      bankName: '', iban: '', accountHolder: '',
      walletProvider: '', walletNumber: ''
    } as any);
  }

  save() {
    this.saving = true;
    const raw: any = this.form.getRawValue();
    const body: Partial<Profile> = {};
    for (const k of Object.keys(raw)) {
      const v = raw[k];
      if (v !== undefined) (body as any)[k] = v;
    }
    this.api.save(body).subscribe({
      next: () => {
        this.saving = false;
        this.form.markAsPristine();
        this.snack.open('Profile saved', 'Close', { duration: 1500 });
      },
      error: () => { this.saving = false; }
    });
  }

  percentComplete(): number {
    const v = this.form.value as any;
    const fields = [
      !!v.firstName, !!v.lastName, !!v.dateOfBirth,
      !!v.governorate, !!v.district, !!v.householdSize,
      !!v.incomeMonthly, !!v.kycVerified
    ];
    let total = fields.length;
    let done = fields.filter(Boolean).length;

    if (v.paymentMethod === 'BANK') {
      total += 3;
      if (v.bankName) done++;
      if (v.iban) done++;
      if (v.accountHolder) done++;
    } else if (v.paymentMethod === 'WALLET') {
      total += 2;
      if (v.walletProvider) done++;
      if (v.walletNumber) done++;
    }
    return Math.round((done / Math.max(total,1)) * 100);
  }

  complete() {
    const v = this.form.value as any;
    return !!(v.firstName && v.lastName && v.dateOfBirth && v.governorate && v.householdSize && v.incomeMonthly && v.kycVerified);
  }
}
