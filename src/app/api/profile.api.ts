import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  firstName?: string; lastName?: string; gender?: string;
  dateOfBirth?: string; governorate?: string; district?: string;
  householdSize?: number; incomeMonthly?: number; kycVerified?: boolean;
  paymentMethod?: 'NONE'|'BANK'|'WALLET';
  bankName?: string; iban?: string; accountHolder?: string;
  walletProvider?: string; walletNumber?: string;
}

export interface DocMeta {
  id: number;
  type: string;
  filename: string;
  contentType?: string;
  size: number;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  constructor(private http: HttpClient) {}

  // ----- Citizen profile -----
  me() { return this.http.get<Profile>('/profiles/me'); }
  save(body: Partial<Profile>) { return this.http.post('/profiles/me', body); }

  // ----- Citizen documents -----
  listDocs() { return this.http.get<DocMeta[]>('/profiles/me/documents'); }

  uploadDoc(file: File, type = 'OTHER') {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`/profiles/me/documents?type=${encodeURIComponent(type)}`, fd);
  }

  downloadDoc(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`/profiles/me/documents/${id}/download`, { responseType: 'blob' as const, observe: 'response' });
  }

  deleteDoc(id: number) {
    return this.http.delete(`/profiles/me/documents/${id}`);
  }

  // ----- Admin profile -----
  getByUsername(username: string) {
    return this.http.get<Profile>(`/profiles/admin/${encodeURIComponent(username.trim())}`);
  }

  // ----- Admin documents -----
  listDocsByUsername(username: string) {
    const u = encodeURIComponent(username.trim());
    // IMPORTANT: no space after '/profiles'
    return this.http.get<DocMeta[]>(`/profiles/admin/${u}/documents`);
  }

  downloadDocFor(username: string, id: number): Observable<HttpResponse<Blob>> {
    const u = encodeURIComponent(username.trim());
    return this.http.get(`/profiles/admin/${u}/documents/${id}/download`, { responseType: 'blob' as const, observe: 'response' });
  }

  inlineDocFor(username: string, id: number): Observable<HttpResponse<Blob>> {
    const u = encodeURIComponent(username.trim());
    return this.http.get(`/profiles/admin/${u}/documents/${id}/inline`, { responseType: 'blob' as const, observe: 'response' });
  }
}
