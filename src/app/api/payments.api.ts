import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export type BatchStatus = 'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED';
export type InstructionStatus = 'PENDING'|'SENT'|'SUCCESS'|'FAILED';

export interface PaymentBatch {
  id: number;
  programId?: number;
  cycleId?: number;
  createdAt?: string;
  createdBy?: string;
  status: BatchStatus;
  totalCount: number;
  successCount: number;
  failedCount: number;
}

export interface PaymentInstruction {
  id: number;
  batchId: number;
  beneficiaryUsername: string;
  amount: number;
  currency: string;
  status: InstructionStatus;
  bankRef?: string;
  failReason?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  constructor(private http: HttpClient) {}

  // --- MAPPERS (make the UI resilient to nulls / alt keys) ---
  private mapBatch = (b: any): PaymentBatch => ({
    id: Number(b?.id),
    programId: b?.programId ?? b?.program_id ?? undefined,
    cycleId: b?.cycleId ?? b?.cycle_id ?? undefined,
    createdAt: b?.createdAt ?? b?.created_at ?? undefined,
    createdBy: b?.createdBy ?? b?.created_by ?? undefined,
    status: (b?.status ?? 'PENDING') as BatchStatus,
    totalCount: Number(b?.totalCount ?? b?.total_count ?? 0),
    successCount: Number(b?.successCount ?? b?.success_count ?? 0),
    failedCount: Number(b?.failedCount ?? b?.failed_count ?? 0),
  });

  private mapInstruction = (i: any): PaymentInstruction => ({
    id: Number(i?.id),
    batchId: Number(i?.batchId ?? i?.batch_id ?? 0),
    beneficiaryUsername: i?.beneficiaryUsername ?? i?.beneficiary ?? i?.username ?? '',
    amount: Number(i?.amount ?? 0),
    currency: i?.currency ?? 'TND',
    status: (i?.status ?? 'PENDING') as InstructionStatus,
    bankRef: i?.bankRef ?? i?.bank_ref ?? undefined,
    failReason: i?.failReason ?? i?.reason ?? undefined,
  });

  // --- API CALLS ---
  createManualBatch(body: { programId: number; amount: number; currency: string; beneficiaries: string[] }) {
    return this.http.post<{ totalCount: number; batchId: number }>(`/payments/batches`, body);
  }

  createBatchFromCycle(cycleId: number, programId: number) {
    return this.http.post<{ totalCount: number; batchId: number; existing?: boolean }>(
      `/payments/batches/from-cycle?cycleId=${cycleId}&programId=${programId}`, {}
    );
  }

  listBatches() {
    return this.http.get<any[]>(`/payments/batches`).pipe(
      map(arr => (arr ?? []).map(this.mapBatch))
    );
  }

  getBatch(id: number) {
    return this.http.get<any>(`/payments/batches/${id}`).pipe(
      map(res => {
        // Support both shapes: { batch, instructions } or just the entity itself
        const batch = res?.batch ? this.mapBatch(res.batch) : this.mapBatch(res);
        const rawInstr = res?.instructions ?? res?.items ?? [];
        const instructions = Array.isArray(rawInstr) ? rawInstr.map(this.mapInstruction) : [];
        return { batch, instructions };
      })
    );
  }

  dispatch(id: number) {
    return this.http.post<{ status: string }>(`/payments/batches/${id}/dispatch`, {});
  }
}
