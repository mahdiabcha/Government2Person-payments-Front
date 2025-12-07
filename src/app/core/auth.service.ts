import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, of, switchMap, tap } from 'rxjs';

interface LoginRequest { username: string; password: string; }
interface AuthResponse { token: string; }
interface MeResponse { username: string; roles: string[]; }
export type SignupRole = 'CITIZEN'|'AGENT';
interface SignupRequest { username: string; password: string; nationalId: string; role: SignupRole; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  roles = signal<string[]>(JSON.parse(localStorage.getItem('roles') || '[]'));
  username = signal(localStorage.getItem('username') || '');
  loggedIn = computed(() => !!localStorage.getItem('jwt'));

  constructor(private http: HttpClient) {}

  /** Ensure roles/username are loaded if we have a JWT. Resolves true when ready. */
  ensureMeLoaded() {
    const hasToken = !!localStorage.getItem('jwt');
    const hasRoles = (this.roles()?.length ?? 0) > 0;
    if (!hasToken) return of(true);        // nothing to do
    if (hasRoles)   return of(true);       // already loaded
    return this.refreshMe().pipe(map(() => true));
  }

  login(req: LoginRequest) {
    return this.http.post<AuthResponse>('/auth/login', req).pipe(
      tap(res => localStorage.setItem('jwt', res.token)),
      switchMap(() => this.refreshMe()) // <- caller will only get next() after /auth/me finishes
    );
  }

  signup(req: SignupRequest) {
    return this.http.post<void>('/auth/register', req);
  }

  refreshMe() {
    return this.http.get<MeResponse>('/auth/me').pipe(
      tap(me => {
        localStorage.setItem('roles', JSON.stringify(me.roles));
        localStorage.setItem('username', me.username);
        this.roles.set(me.roles);
        this.username.set(me.username);
      })
    );
  }

  clear() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('roles');
    localStorage.removeItem('username');
    this.roles.set([]);
    this.username.set('');
  }
}
