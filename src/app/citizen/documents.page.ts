import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileApi } from '../api/profile.api';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  styles: [`
    :host { display:block; }
    .dropzone {
      border: 1px dashed rgba(0,0,0,.2);
      border-radius: 0.75rem;
      padding: 1rem;
      transition: border-color .15s ease, background-color .15s ease;
    }
    .dropzone.dragover {
      border-color: rgba(59,130,246,.7);
      background: rgba(59,130,246,.06);
    }
    table thead th { text-transform: uppercase; font-size: .75rem; letter-spacing: .04em; color: #64748b; }
    tbody tr:hover { background: rgba(0,0,0,.025); }
  `],
  template: `
    <mat-card class="p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xl font-semibold">My Documents</h2>
        <button mat-stroked-button (click)="refresh()" [disabled]="loadingList">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <!-- Upload area -->
      <div
        class="dropzone mb-3"
        [class.dragover]="dragOver"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <div class="flex flex-wrap items-center gap-3">
          <input #fileInput type="file" class="hidden" (change)="onFileChange($event)" />
          <button mat-stroked-button (click)="openPicker()" [disabled]="uploading">
            <mat-icon>attach_file</mat-icon>
            Choose file
          </button>

          <div *ngIf="file" class="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
               style="background: rgba(0,0,0,.05);">
            <mat-icon>insert_drive_file</mat-icon>
            <span class="truncate max-w-[40ch]">{{ file?.name }}</span>
            <span class="text-gray-500">• {{ bytes(file?.size) }}</span>
            <button mat-icon-button (click)="clearFile()" [disabled]="uploading" matTooltip="Clear file">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <span class="text-xs text-gray-600">Max size 20 MB per file.</span>

          <span class="flex-1"></span>

          <button mat-stroked-button (click)="upload('ID')" [disabled]="!file || uploading" matTooltip="Upload and mark as ID document">
            {{ uploading ? 'Uploading…' : 'Upload as ID' }}
          </button>
          <button mat-raised-button color="primary" (click)="upload('OTHER')" [disabled]="!file || uploading">
            {{ uploading ? 'Uploading…' : 'Upload' }}
          </button>
        </div>
      </div>

      <mat-progress-bar *ngIf="uploading" mode="indeterminate" class="mb-3"></mat-progress-bar>

      <mat-divider class="my-4"></mat-divider>

      <!-- List -->
      <ng-container *ngIf="!loadingList; else loadingTpl">
        <ng-container *ngIf="docs?.length; else emptyTpl">
          <div class="overflow-auto rounded-lg border border-gray-200">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr class="border-b">
                <th class="text-left p-3">Name</th>
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
                  <button mat-icon-button color="warn" matTooltip="Delete"
                          (click)="remove(d.id)" [disabled]="deletingId===d.id">
                    <mat-icon *ngIf="deletingId!==d.id">delete</mat-icon>
                    <mat-icon *ngIf="deletingId===d.id">hourglass_top</mat-icon>
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
      </ng-container>

      <ng-template #loadingTpl>
        <div class="flex items-center gap-2 text-gray-600">
          <mat-progress-bar mode="indeterminate" class="flex-1"></mat-progress-bar>
        </div>
      </ng-template>

      <ng-template #emptyTpl>
        <div class="p-6 rounded-lg border border-dashed text-center text-gray-600">
          <mat-icon>folder_open</mat-icon>
          <div class="mt-1">No documents yet. Pick a file above to upload.</div>
        </div>
      </ng-template>
    </mat-card>
  `,
})
export class DocumentsPage {
  docs: any[] = [];
  file?: File;
  uploading = false;
  deletingId?: number;
  loadingList = false;
  dragOver = false;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  constructor(private api: ProfileApi, private snack: MatSnackBar) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loadingList = true;
    this.api.listDocs().subscribe({
      next: (d) => { this.docs = Array.isArray(d) ? d : []; this.loadingList = false; },
      error: () => { this.docs = []; this.loadingList = false; this.snack.open('Failed to load documents.', 'Close', { duration: 2000 }); }
    });
  }

  // ---- Upload helpers
  openPicker() { this.fileInput?.nativeElement.click(); }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.file = input.files?.[0] || undefined;
  }

  clearFile() {
    this.file = undefined;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      if (f.size > 20 * 1024 * 1024) {
        this.snack.open('File too large (max 20 MB).', 'Close', { duration: 2000 });
        return;
      }
      this.file = f;
    }
  }

  upload(type: string) {
    if (!this.file || this.uploading) return;
    if (this.file.size > 20 * 1024 * 1024) {
      this.snack.open('File too large (max 20 MB).', 'Close', { duration: 2000 });
      return;
    }
    this.uploading = true;
    this.api.uploadDoc(this.file, (type || 'OTHER').toUpperCase()).subscribe({
      next: () => {
        this.clearFile();
        this.snack.open('Uploaded', 'Close', { duration: 1500 });
        this.refresh();
        this.uploading = false;
      },
      error: () => { this.uploading = false; this.snack.open('Upload failed.', 'Close', { duration: 2000 }); }
    });
  }

  // ---- Actions
  preview(id: number) {
    this.api.downloadDoc(id).subscribe({
      next: (res) => {
        const blob = res.body as Blob;
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: () => this.snack.open('Failed to preview document.', 'Close', { duration: 2000 })
    });
  }

  download(id: number) {
    this.api.downloadDoc(id).subscribe({
      next: (res) => {
        const blob = res.body as Blob;
        if (!blob) return;
        const dispo = res.headers.get('Content-Disposition') || '';
        const m = /filename="?([^"]+)"?/.exec(dispo);
        const filename = m?.[1] || 'document';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snack.open('Download failed.', 'Close', { duration: 2000 })
    });
  }

  remove(id: number) {
    if (this.deletingId) return;
    if (!confirm('Delete this document?')) return;
    this.deletingId = id;
    this.api.deleteDoc(id).subscribe({
      next: () => {
        this.snack.open('Deleted', 'Close', { duration: 1200 });
        this.deletingId = undefined;
        this.refresh();
      },
      error: () => { this.deletingId = undefined; this.snack.open('Delete failed.', 'Close', { duration: 2000 }); }
    });
  }

  // ---- Utils
  trackDoc = (_: number, d: any) => d?.id ?? _;
  bytes(n?: number): string {
    if (n === undefined || n === null) return '—';
    const u = ['B','KB','MB','GB','TB']; let i = 0; let v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    const f = (v < 10 && i > 0) ? 1 : 0;
    return `${v.toFixed(f)} ${u[i]}`;
  }
}
