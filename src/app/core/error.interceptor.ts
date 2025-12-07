import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const msg = (err.error?.message || err.error?.error || err.statusText || 'Error');

      if (err.status === 401) {
        snack.open('Session expired or unauthorized. Please login again.', 'Close', { duration: 2500 });
        // clear local auth and redirect
        localStorage.removeItem('jwt');
        localStorage.removeItem('roles');
        localStorage.removeItem('username');
        router.navigateByUrl('/login');
      } else if (err.status === 403) {
        snack.open('Forbidden: you do not have access.', 'Close', { duration: 3000 });
      } else if (err.status === 404) {
        snack.open('Not found.', 'Close', { duration: 3000 });
      } else if (err.status === 409) {
        snack.open(`Conflict: ${msg}`, 'Close', { duration: 3500 });
      } else {
        snack.open(`${msg}`, 'Close', { duration: 3000 });
      }

      return throwError(() => err);
    })
  );
};
