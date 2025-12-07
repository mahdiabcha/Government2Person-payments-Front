import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type NotificationStatus = 'NEW' | 'READ';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  recipientUsername?: string | null;
  audienceRole?: string | null;
  status: NotificationStatus;
  createdAt: string;             // ISO
  metadata?: any;                // parsed from metadataJson (if present)
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page index (0-based)
}

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  constructor(private http: HttpClient) {}

  /** GET /notifications/me/count → { count: number } */
  countMy() {
    return this.http.get<{count: number}>('/notifications/me/count');
  }

  /** GET /notifications/me?page&size → Page<Notification> */
  listMy(page = 0, size = 20): Observable<Page<NotificationItem>> {
    return this.http.get<Page<any>>(`/notifications/me?page=${page}&size=${size}`).pipe(
      map((p) => ({
        ...p,
        content: (p.content ?? []).map(this.mapOne)
      }))
    );
  }

  private mapOne = (n: any): NotificationItem => ({
    id: Number(n?.id),
    type: String(n?.type ?? ''),
    title: String(n?.title ?? ''),
    body: String(n?.body ?? ''),
    recipientUsername: n?.recipientUsername ?? null,
    audienceRole: n?.audienceRole ?? null,
    status: (n?.status ?? 'NEW') as NotificationStatus,
    createdAt: n?.createdAt ?? new Date().toISOString(),
    metadata: this.safeParse(n?.metadataJson)
  });

  private safeParse(txt: any) {
    if (!txt || typeof txt !== 'string') return undefined;
    try { return JSON.parse(txt); } catch { return undefined; }
  }
}
