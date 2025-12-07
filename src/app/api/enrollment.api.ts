import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

export type EnrollmentStatus = 'PENDING'|'APPROVED'|'REJECTED'|'CANCELED';

export interface MyEnrollment {
  id: number;                          // kept for trackBy only (not displayed)
  programId?: number | null;           // used for “Open →” link
  programName?: string | null;         // display this
  status: EnrollmentStatus;
  eligibilityPassed: boolean;
  eligibilityReason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentApi {
  constructor(private http: HttpClient) {}

  checkEligibility(programId: number) {
    return this.http.get<{eligible: boolean; reason?: string}>(`/programs/${programId}/eligibility/check`);
  }

  enroll(programId: number) {
    return this.http.post(`/programs/${programId}/enroll`, {});
  }

  /** Normalize various backend shapes/typos into MyEnrollment */
  my() {
    return this.http.get<any[]>('/enrollments/my').pipe(
      map(list => (list || []).map(r => {
        const program =
          r.program ?? r.programDto ?? null; // if backend sends nested program
        const programId =
          r.programId ?? program?.id ?? r.program ?? null;
        const programName =
          r.programName ?? r.PrgramName ?? r.programeName ?? program?.name ?? null;

        const out: MyEnrollment = {
          id: r.id,
          programId,
          programName,
          status: r.status,
          eligibilityPassed: !!r.eligibilityPassed,
          eligibilityReason: r.eligibilityReason ?? undefined,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        };
        return out;
      }))
    );
  }

  beneficiaries(programId: number, status?: EnrollmentStatus) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<any[]>(`/programs/${programId}/beneficiaries${q}`);
  }

  approve(enrollmentId: number, programId?: number) {
    const body = {};
    if (programId) {
      return this.http.patch(`/programs/${programId}/enrollments/${enrollmentId}/approve`, body);
    }
    return this.http.patch(`/enrollments/${enrollmentId}/approve`, body);
  }

  reject(enrollmentId: number, note?: string, programId?: number) {
    const body = { note };
    if (programId) {
      return this.http.patch(`/programs/${programId}/enrollments/${enrollmentId}/reject`, body);
    }
    return this.http.patch(`/enrollments/${enrollmentId}/reject`, body);
  }
}
