import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSnackBarModule, RouterLink, MatIconModule, MatProgressSpinnerModule
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
        <h2 class="text-xl font-semibold mb-1">Welcome back</h2>
        <div class="text-sm sub mb-4">OpenG2P Portal</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="w-full mb-3">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" autocomplete="username" autofocus />
            <mat-error *ngIf="form.controls.username.hasError('required')">Username is required.</mat-error>
            <mat-error *ngIf="form.controls.username.hasError('pattern')">
              Use letters, numbers, dots or underscores (3–32 chars).
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full mb-4">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPass ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="showPass=!showPass" [attr.aria-label]="showPass?'Hide password':'Show password'">
              <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.controls.password.hasError('required')">Password is required.</mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" class="w-full" [disabled]="form.invalid || loading">
            <ng-container *ngIf="!loading; else spin">Login</ng-container>
            <ng-template #spin>
              <mat-progress-spinner mode="indeterminate" diameter="16"></mat-progress-spinner>
            </ng-template>
          </button>
        </form>

        <div class="text-sm mt-4 text-center">
          Don’t have an account?
          <a routerLink="/signup" class="text-emerald-700 font-medium hover:underline">Register here</a>
        </div>
      </mat-card>
    </div>
  `,
})
export class LoginPage {
  form = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]{3,32}$/)]],
    password: ['', Validators.required],
  });
  loading = false;
  showPass = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private snack: MatSnackBar) {}

  submit() {
    if (this.form.invalid || this.loading) return;
    const raw = this.form.value as any;
    const payload = {
      username: (raw.username || '').trim(),
      password: raw.password || ''
    };
    this.loading = true;
    this.auth.login(payload).subscribe({
      next: () => {
        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        this.snack.open('Welcome!', 'Close', { duration: 1200 });
        if (roles.includes('ADMIN')) this.router.navigateByUrl('/admin/programs');
        else this.router.navigateByUrl('/citizen/catalog');
        this.loading = false;
      },
      error: () => { this.loading = false; } // interceptor shows error
    });
  }
}
