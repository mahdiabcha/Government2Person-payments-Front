import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export type ProgramState = 'DRAFT'|'ACTIVE'|'INACTIVE'|'ARCHIVED';
export interface Program {
  id: number;
  name: string;
  description?: string;
  rulesJson?: any;
  state: ProgramState;
  createdAt?: string | null;
}

export type CycleState = 'DRAFT'|'TO_APPROVE'|'APPROVED'|'DISTRIBUTED'|'CANCELED'|'ENDED';
export interface Cycle {
  id: number;
  programId: number;
  name: string;
  startDate: string;
  endDate: string;
  state: CycleState;
  createdAt?: string;
}

export type EntitlementState = 'DRAFT'|'APPROVED'|'DISTRIBUTED'|'CANCELED';
export interface Entitlement {
  id: number;
  programId: number;
  cycleId: number;
  beneficiaryUsername: string;
  amount: number;
  currency: string;
  validFrom?: string;
  validUntil?: string;
  state: EntitlementState;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramsApi {
  constructor(private http: HttpClient) {}

  // -------- Programs --------
  listPrograms() { return this.http.get<Program[]>('/programs'); }
  getProgram(id: number) { return this.http.get<Program>(`/programs/${id}`); }
  createProgram(body: Partial<Program>) { return this.http.post<Program>('/programs', body); }

  /** Safely upsert by merging with current server value to avoid nulling non-provided fields */
  private safeUpsert(id: number, patch: Partial<Program>): Observable<Program> {
    return this.getProgram(id).pipe(
      switchMap(current => this.http.post<Program>('/programs', { ...current, ...patch, id }))
    );
  }

  updateProgram(id: number, body: Partial<Program>) {
    return this.safeUpsert(id, body);
  }

  /** Validate and save rules as plain JSON text (server stores string) */
  updateRules(id: number, rulesJson: any) {
    const s = (typeof rulesJson === 'string' ? rulesJson : JSON.stringify(rulesJson ?? {})).trim();
    try {
      const parsed = JSON.parse(s);
      if (!parsed || typeof parsed !== 'object') throw new Error('Rules must be a JSON object.');
    } catch (e: any) {
      return throwError(() => new Error('Invalid rules JSON.'));
    }
    return this.safeUpsert(id, { rulesJson: s });
  }

  /** State change expects body { value: 'ACTIVE'|'INACTIVE'|'ARCHIVED'|'DRAFT' } */
  changeProgramState(id: number, value: ProgramState) {
    return this.http.patch<Program>(`/programs/${id}/state`, { value });
  }

  // -------- Cycles --------
  listCycles(programId: number) { return this.http.get<Cycle[]>(`/programs/${programId}/cycles`); }
  createCycle(programId: number, body: { name: string; startDate: string; endDate: string }) {
    return this.http.post<Cycle>(`/programs/${programId}/cycles`, body);
  }
  getCycle(id: number) { return this.http.get<Cycle>(`/cycles/${id}`); }

  /** Cycle state change expects body { value } */
  changeCycleState(id: number, value: CycleState) {
    return this.http.patch<Cycle>(`/cycles/${id}/state`, { value });
  }

  // -------- Entitlements --------
  listEntitlements(cycleId: number) { return this.http.get<Entitlement[]>(`/cycles/${cycleId}/entitlements`); }
  prepareEntitlements(programId: number, cycleId: number, body: { amount: number; currency: string; validFrom?: string; validUntil?: string }) {
    return this.http.post(`/programs/${programId}/cycles/${cycleId}/entitlements/prepare-from-enrollments`, body);
  }
  generateEntitlements(programId: number, cycleId: number, items: Array<{username: string; amount: number; currency: string; validFrom?: string; validUntil?: string}>) {
    return this.http.post(`/programs/${programId}/cycles/${cycleId}/entitlements/generate`, { items });
  }
  approveAllEntitlements(cycleId: number) { return this.http.post(`/cycles/${cycleId}/entitlements/approve-all`, {}); }
  changeEntitlementState(cycleId: number, id: number, value: EntitlementState) {
    return this.http.patch(`/cycles/${cycleId}/entitlements/${id}/state`, { value });
  }
}
