import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt') || '';
  const username = localStorage.getItem('username') || '';
  let roles: string[] = [];
  try { roles = JSON.parse(localStorage.getItem('roles') || '[]') || []; } catch {}

  if (!token && !username && !roles.length) {
    return next(req);
  }

  const setHeaders: Record<string, string> = {};
  if (token) setHeaders['Authorization'] = `Bearer ${token}`;
  if (username) setHeaders['X-Auth-User'] = username;
  if (roles.length) setHeaders['X-Auth-Roles'] = roles.join(',');

  return next(req.clone({ setHeaders }));
};
