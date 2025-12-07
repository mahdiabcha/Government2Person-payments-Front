import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileApi, Profile } from "../api/profile.api";

@Component({
  standalone: true,
  selector: 'app-admin-profile-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  styles: [`
    :host { display: block; }
    .header-avatar {
      @apply w-10 h-10 rounded-full flex items-center justify-center font-semibold;
      background: rgba(59,130,246,.12);
      color: rgb(37,99,235);
    }
    .chip {
      @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium;
      background: rgba(0,0,0,.05);
    }
    .chip-success { background: rgba(16,185,129,.12); color: rgb(5,150,105); }
    .chip-warn    { background: rgba(245,158,11,.12); color: rgb(217,119,6); }
    .chip-info    { background: rgba(59,130,246,.12); color: rgb(37,99,235); }
    table thead th { @apply text-xs uppercase tracking-wide text-gray-500; }
    table tbody tr:hover { background: rgba(0,0,0,.025); }
    .dialog-content { max-height: 65vh; overflow: auto; }
  `],
  template: `
    <h2 mat-dialog-title class="!m-0">
      <div class="flex items-center gap-3">
        <div class="header-avatar">{{ data?.username?.slice(0,2)?.toUpperCase() || '??' }}</div>
        <div class="min-w-0">
          <div class="text-base font-semibold leading-tight">Citizen profile</div>
          <div class="text-sm text-gray-500 truncate">{{ data?.username }}</div>
        </div>
      </div>
    </h2>

    <mat-divider class="my-3"></mat-divider>

    <mat-dialog-content class="dialog-content px-1">
      <div *ngIf="loading" class="flex items-center justify-center py-10">
        <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
      </div>

      <ng-container *ngIf="!loading">
        <ng-container *ngIf="hasData(); else noData">
          <div class="grid md:grid-cols-2 gap-3 text-sm mb-4">
            <div><span class="text-gray-500">First name:</span> <b>{{ p.firstName || '—' }}</b></div>
            <div><span class="text-gray-500">Last name:</span> <b>{{ p.lastName || '—' }}</b></div>
            <div><span class="text-gray-500">Gender:</span> <b>{{ p.gender || '—' }}</b></div>
            <div><span class="text-gray-500">DOB:</span> <b>{{ p.dateOfBirth || '—' }}</b></div>
            <div><span class="text-gray-500">Governorate:</span> <b>{{ p.governorate || '—' }}</b></div>
            <div><span class="text-gray-500">District:</span> <b>{{ p.district || '—' }}</b></div>
            <div><span class="text-gray-500">Household size:</span> <b>{{ p.householdSize ?? '—' }}</b></div>
            <div><span class="text-gray-500">Monthly income:</span> <b>{{ p.incomeMonthly ?? '—' }}</b></div>

            <div class="md:col-span-2 flex flex-wrap gap-2 pt-1">
              <span class="chip" [ngClass]="p.kycVerified ? 'chip-success' : 'chip-warn'">
                <mat-icon inline>{{ p.kycVerified ? 'verified' : 'error_outline' }}</mat-icon>
                KYC {{ p.kycVerified ? 'verified' : 'not verified' }}
              </span>
              <span class="chip chip-info">
                <mat-icon inline>account_balance_wallet</mat-icon>
                Payment: {{ p.paymentMethod || 'NONE' }}
              </span>
            </div>

            <!-- Payment details section -->
            <div class="md:col-span-2">
              <div class="rounded-lg border border-gray-200 p-3">
                <div class="flex items-center gap-2 mb-2">
                  <mat-icon>account_balance</mat-icon>
                  <b>Payment details</b>
                  <span class="chip chip-info">{{ p.paymentMethod || 'NONE' }}</span>
                </div>

                <ng-container [ngSwitch]="p.paymentMethod">
                  <div *ngSwitchCase="'BANK'" class="grid md:grid-cols-3 gap-3 text-sm">
                    <div><span class="text-gray-500">Bank:</span> <b>{{ p.bankName || '—' }}</b></div>
                    <div><span class="text-gray-500">IBAN:</span> <b>{{ p.iban || '—' }}</b></div>
                    <div><span class="text-gray-500">Account holder:</span> <b>{{ p.accountHolder || '—' }}</b></div>
                  </div>

                  <div *ngSwitchCase="'WALLET'" class="grid md:grid-cols-2 gap-3 text-sm">
                    <div><span class="text-gray-500">Provider:</span> <b>{{ p.walletProvider || '—' }}</b></div>
                    <div><span class="text-gray-500">Number:</span> <b>{{ p.walletNumber || '—' }}</b></div>
                  </div>

                  <div *ngSwitchDefault class="text-sm text-gray-500">
                    No payment details.
                  </div>
                </ng-container>
              </div>
            </div>
            <!-- /Payment details -->
          </div>

          <h3 class="font-semibold mb-2">Documents</h3>
          <div class="overflow-auto rounded-lg border border-gray-200">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr class="border-b">
                <th class="text-left p-3">Filename</th>
                <th class="text-left p-3">Type</th>
                <th class="text-left p-3">Size</th>
                <th class="text-right p-3">Actions</th>
              </tr>
              </thead>
              <tbody>
              <tr *ngFor="let d of docs; trackBy: trackDoc" class="border-b">
                <td class="p-3">{{ d.filename }}</td>
                <td class="p-3">{{ d.type }}</td>
                <td class="p-3">{{ bytes(d.size) }}</td>
                <td class="p-3 text-right">
                  <button mat-icon-button matTooltip="Preview" (click)="preview(d.id)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Download" (click)="download(d.id)">
                    <mat-icon>download</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!docs?.length">
                <td colspan="4" class="p-4 text-center text-gray-500">No documents found.</td>
              </tr>
              </tbody>
            </table>
          </div>
        </ng-container>

        <ng-template #noData>
          <div class="p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
            No profile data found for this user on the current backend.
          </div>
        </ng-template>
      </ng-container>
    </mat-dialog-content>

    <mat-divider class="my-3"></mat-divider>

    <mat-dialog-actions align="end" class="sticky bottom-0 bg-white">
      <button mat-stroked-button (click)="ref.close()">
        <mat-icon>close</mat-icon>
        Close
      </button>
    </mat-dialog-actions>
  `
})
export class AdminProfileDialogComponent {
  p: Profile = {};
  docs: any[] = [];
  loading = true;

  constructor(
    public ref: MatDialogRef<AdminProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string },
    private api: ProfileApi,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.ref.updateSize('1000px', '80vh');
    this.api.getByUsername(this.data.username).subscribe({
      next: res => { this.p = res || {}; this.loading = false; this.loadDocs(); },
      error: _ => { this.p = {}; this.loading = false; this.loadDocs(); }
    });
  }

  private loadDocs() {
    this.api.listDocsByUsername(this.data.username).subscribe({
      next: list => this.docs = Array.isArray(list) ? list : [],
      error: err => {
        console.error('admin docs load failed', err);
        this.snack.open('Failed to load documents.', 'Close', { duration: 2500 });
        this.docs = [];
      }
    });
  }

  hasData() {
    return Object.values(this.p || {}).some(v => v !== undefined && v !== null && v !== '');
  }

  trackDoc = (_: number, d: any) => d?.id ?? _;

  bytes(n: number | undefined): string {
    if (n === undefined || n === null) return '—';
    const units = ['B','KB','MB','GB','TB'];
    let i = 0; let val = n;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    const fixed = (val < 10 && i > 0) ? 1 : 0;
    return `${val.toFixed(fixed)} ${units[i]}`;
  }

  preview(id: number) {
    this.api.inlineDocFor(this.data.username, id).subscribe({
      next: res => {
        const blob = res.body as Blob;
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: _ => this.snack.open('Failed to preview document.', 'Close', { duration: 2500 })
    });
  }

  download(id: number) {
    this.api.downloadDocFor(this.data.username, id).subscribe(res => {
      const blob = res.body as Blob;
      if (!blob) return;
      const dispo = res.headers.get('Content-Disposition') || '';
      const m = /filename="?([^"]+)"?/.exec(dispo);
      const filename = m?.[1] || 'document';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    });
  }
}
