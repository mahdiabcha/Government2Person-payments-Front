import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../core/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value || '';
  const c = group.get('confirm')?.value || '';
  return p === c ? null : { mismatch: true };
}

@Component({
  standalone: true,
  selector: 'app-signup',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSnackBarModule, MatRadioModule, RouterLink, MatIconModule, MatProgressSpinnerModule
  ],
  styles: [`
    .bg { min-height: 80vh; display:flex; align-items:center; justify-content:center;
          background:
            radial-gradient(1200px 200px at -10% -40%, rgba(59,130,246,.12), transparent 60%),
            radial-gradient(1200px 200px at 110% 140%, rgba(16,185,129,.12), transparent 60%),
            #f8fafc; }
    mat-card { padding: 1.25rem 1.25rem 1rem; }
    .sub { color:#64748b; }
  `],
  template: `
    <div class="bg">
      <mat-card class="w-full max-w-md">
        <h2 class="text-xl font-semibold mb-1">Create your account</h2>
        <div class="text-sm sub mb-4">OpenG2P Portal</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="w-full mb-3">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" autocomplete="username" />
            <mat-hint>3–32 characters; letters, numbers, dot, underscore.</mat-hint>
            <mat-error *ngIf="fc.username.hasError('required')">Username is required.</mat-error>
            <mat-error *ngIf="fc.username.hasError('pattern')">Invalid username format.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full mb-3">
            <mat-label>National ID (8 digits)</mat-label>
            <input matInput formControlName="nationalId" inputmode="numeric" autocomplete="off" />
            <mat-error *ngIf="fc.nationalId.hasError('required')">National ID is required.</mat-error>
            <mat-error *ngIf="fc.nationalId.hasError('pattern')">Must be exactly 8 digits.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full mb-3">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPass ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
            <button mat-icon-button matSuffix type="button" (click)="showPass=!showPass" [attr.aria-label]="showPass?'Hide password':'Show password'">
              <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>Min 8 chars, at least one letter & number.</mat-hint>
            <mat-error *ngIf="fc.password.hasError('required')">Password is required.</mat-error>
            <mat-error *ngIf="fc.password.hasError('pattern')">Use 8+ chars with letters & numbers.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full mb-4">
            <mat-label>Confirm password</mat-label>
            <input matInput [type]="showConfirm ? 'text' : 'password'" formControlName="confirm" autocomplete="new-password" />
            <button mat-icon-button matSuffix type="button" (click)="showConfirm=!showConfirm" [attr.aria-label]="showConfirm?'Hide password':'Show password'">
              <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.hasError('mismatch')">Passwords do not match.</mat-error>
          </mat-form-field>

          <div class="mb-4">
            <label class="text-sm block mb-1">Sign up as</label>
            <mat-radio-group formControlName="role" class="flex gap-6">
              <mat-radio-button value="CITIZEN">Citizen</mat-radio-button>
              <mat-radio-button value="AGENT">Agent (Admin)</mat-radio-button>
            </mat-radio-group>
          </div>

          <button mat-raised-button color="primary" class="w-full"
                  [disabled]="form.invalid || loading">
            <ng-container *ngIf="!loading; else spin">Sign up</ng-container>
            <ng-template #spin>
              <mat-progress-spinner mode="indeterminate" diameter="16"></mat-progress-spinner>
            </ng-template>
          </button>
        </form>

        <div class="text-xs text-red-600 mt-2" *ngIf="form.hasError('mismatch')">Passwords do not match.</div>

        <div class="text-sm mt-4 text-center">
          Already have an account?
          <a routerLink="/login" class="text-emerald-700 font-medium hover:underline">Login</a>
        </div>
      </mat-card>
    </div>
  `,
})
export class SignupPage {
  form = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]{3,32}$/)]],
    nationalId: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)]],
    confirm: ['', Validators.required],
    role: ['CITIZEN' as 'CITIZEN' | 'AGENT', Validators.required],
  }, { validators: passwordsMatch });

  loading = false;
  showPass = false;
  showConfirm = false;

  get fc() { return this.form.controls as any; }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private snack: MatSnackBar) {}

  submit() {
    if (this.form.invalid || this.loading) return;
    const { username, password, nationalId, role } = this.form.value as any;
    const payload = {
      username: (username || '').trim(),
      password: password || '',
      nationalId: (nationalId || '').trim(),
      role
    };
    this.loading = true;
    this.auth.signup(payload).subscribe({
      next: () => {
        this.loading = false;
        this.snack.open('Account created. Please login.', 'Close', { duration: 1500 });
        this.router.navigateByUrl('/login');
      },
      error: () => { this.loading = false; }
    });
  }
}
