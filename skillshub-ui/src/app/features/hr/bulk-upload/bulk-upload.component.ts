import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/models';

interface FileEntry {
  file: File;
  email: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  error: string;
}

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div>
          <h1>Bulk Import</h1>
          <p>Upload multiple resumes at once — each gets AI-processed and assigned to an employee account.</p>
        </div>
        <a routerLink="/hr/upload" class="btn-single">Single Upload</a>
      </div>

      @if (entries().length === 0) {
        <div class="drop-zone" [class.dragging]="dragging"
             (click)="fileInput.click()"
             (dragover)="$event.preventDefault(); dragging=true"
             (dragleave)="dragging=false"
             (drop)="onDrop($event)">
          <div class="drop-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
          <p class="drop-title">Drop multiple resume files here</p>
          <p class="drop-sub">or <span class="browse-link">click to browse</span> — hold Ctrl/Cmd to select multiple</p>
          <p class="drop-formats">PDF, DOCX, TXT &middot; Max 5MB each &middot; Up to 50 files</p>
        </div>
        <input #fileInput type="file" accept=".pdf,.docx,.txt" multiple (change)="onFilesSelected($event)" hidden />
      } @else {
        <div class="files-card">
          <div class="files-header">
            <div class="files-count">
              <span class="count-badge">{{ entries().length }}</span> files selected
            </div>
            <div class="header-actions">
              <button class="btn-add-more" (click)="fileInput.click()" [disabled]="processing()">
                + Add more files
              </button>
              <button class="btn-clear" (click)="clearAll()" [disabled]="processing()">Clear all</button>
            </div>
          </div>
          <input #fileInput type="file" accept=".pdf,.docx,.txt" multiple (change)="onFilesSelected($event)" hidden />

          <div class="csv-hint">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
            Enter employee email for each resume. If the email doesn't exist, an account will be created automatically.
          </div>

          <div class="table-wrap">
            <table class="files-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>File</th>
                  <th>Size</th>
                  <th>Employee Email *</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (entry of entries(); track entry.file.name; let i = $index) {
                  <tr [class.row-done]="entry.status === 'done'" [class.row-error]="entry.status === 'error'">
                    <td class="col-num">{{ i + 1 }}</td>
                    <td class="col-file">
                      <span class="file-icon">📄</span>
                      <span class="file-name" [title]="entry.file.name">{{ entry.file.name }}</span>
                    </td>
                    <td class="col-size">{{ (entry.file.size / 1024).toFixed(0) }}KB</td>
                    <td class="col-email">
                      <input type="email" [(ngModel)]="entry.email"
                             placeholder="employee@company.com"
                             [disabled]="entry.status !== 'pending' || processing()"
                             [class.has-value]="entry.email" />
                    </td>
                    <td class="col-status">
                      @if (entry.status === 'pending') { <span class="chip pending">Pending</span> }
                      @if (entry.status === 'uploading') { <span class="chip uploading"><span class="mini-spin"></span> Uploading</span> }
                      @if (entry.status === 'processing') { <span class="chip processing"><span class="mini-spin"></span> Processing</span> }
                      @if (entry.status === 'done') { <span class="chip done">Done</span> }
                      @if (entry.status === 'error') { <span class="chip error" [title]="entry.error">Failed</span> }
                    </td>
                    <td class="col-remove">
                      @if (entry.status === 'pending' && !processing()) {
                        <button class="remove-btn" (click)="removeEntry(i)">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (summary()) {
            <div class="summary-bar" [class.has-errors]="errorCount() > 0">
              <span>{{ doneCount() }} processed</span>
              @if (errorCount() > 0) { <span class="err-count">{{ errorCount() }} failed</span> }
              @if (processing()) { <span class="proc-note">Processing {{ pendingCount() }} remaining...</span> }
              @if (!processing() && doneCount() > 0) {
                <a routerLink="/hr/profiles" class="view-profiles-link">View Profiles →</a>
              }
            </div>
          }

          <div class="card-footer">
            @if (!processing()) {
              <button class="btn-process" (click)="processAll()" [disabled]="!canProcess()">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
                Process {{ readyCount() }} Resume{{ readyCount() === 1 ? '' : 's' }}
              </button>
            } @else {
              <button class="btn-process" disabled>
                <span class="btn-spinner"></span>
                Processing...
              </button>
            }
            <span class="footer-hint">{{ readyCount() }} of {{ entries().length }} files have valid emails</span>
          </div>
        </div>
      }

      <div class="tips-card">
        <h3>Tips for bulk import</h3>
        <ul>
          <li>Name files by employee email (e.g. <code>john.doe&#64;company.com.pdf</code>) — emails will be pre-filled automatically</li>
          <li>Resumes are processed in parallel — all AI analysis runs concurrently</li>
          <li>Files without a valid email will be skipped</li>
          <li>After import, go to <a routerLink="/hr/profiles">Profiles</a> to review and approve</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.75rem; gap: 1rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 .3rem; }
    .page-header p { color: #64748b; font-size: .9rem; margin: 0; }
    .btn-single { padding: .5rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white; color: #4f46e5; font-size: .85rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .btn-single:hover { background: #f5f3ff; border-color: #a5b4fc; }

    .drop-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 4rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: .2s;
      background: white;
      margin-bottom: 1.25rem;
    }
    .drop-zone:hover, .drop-zone.dragging { border-color: #4f46e5; background: #f5f3ff; }
    .drop-icon-wrap { width: 64px; height: 64px; background: #f1f5f9; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #64748b; }
    .drop-icon-wrap svg { width: 32px; height: 32px; }
    .drop-title { font-size: 1.1rem; font-weight: 600; color: #0f172a; margin: 0 0 .4rem; }
    .drop-sub { font-size: .875rem; color: #64748b; margin: 0 0 .5rem; }
    .browse-link { color: #4f46e5; font-weight: 600; }
    .drop-formats { font-size: .78rem; color: #94a3b8; margin: 0; }

    .files-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.06); margin-bottom: 1.25rem; overflow: hidden; }
    .files-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
    .files-count { display: flex; align-items: center; gap: .5rem; font-size: .9rem; font-weight: 600; color: #0f172a; }
    .count-badge { background: #4f46e5; color: white; border-radius: 9999px; padding: .15rem .55rem; font-size: .78rem; font-weight: 700; }
    .header-actions { display: flex; gap: .5rem; }
    .btn-add-more { padding: .4rem .85rem; background: #f5f3ff; color: #4f46e5; border: 1.5px solid #a5b4fc; border-radius: 7px; font-size: .82rem; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-add-more:disabled { opacity: .5; cursor: not-allowed; }
    .btn-clear { padding: .4rem .85rem; background: white; color: #94a3b8; border: 1.5px solid #e2e8f0; border-radius: 7px; font-size: .82rem; cursor: pointer; font-family: inherit; }
    .btn-clear:hover:not(:disabled) { color: #dc2626; border-color: #fca5a5; }
    .btn-clear:disabled { opacity: .5; cursor: not-allowed; }

    .csv-hint { display: flex; align-items: center; gap: .5rem; font-size: .8rem; color: #64748b; background: #f8fafc; padding: .65rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
    .csv-hint svg { width: 15px; height: 15px; color: #94a3b8; flex-shrink: 0; }

    .table-wrap { overflow-x: auto; }
    .files-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
    .files-table th { padding: .6rem 1rem; text-align: left; font-size: .72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .files-table td { padding: .7rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .files-table tr:last-child td { border-bottom: none; }
    .files-table tr.row-done td { background: #f0fdf4; }
    .files-table tr.row-error td { background: #fef2f2; }

    .col-num { width: 40px; color: #94a3b8; font-weight: 600; }
    .col-file { max-width: 220px; }
    .col-size { width: 70px; color: #94a3b8; white-space: nowrap; }
    .col-email { min-width: 220px; }
    .col-status { width: 130px; }
    .col-remove { width: 40px; }

    .file-icon { margin-right: .4rem; }
    .file-name { font-weight: 500; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; max-width: 180px; vertical-align: middle; }

    .col-email input {
      width: 100%;
      padding: .45rem .7rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      font-size: .82rem;
      font-family: inherit;
      color: #0f172a;
      box-sizing: border-box;
    }
    .col-email input:focus { outline: none; border-color: #4f46e5; }
    .col-email input.has-value { border-color: #a5b4fc; }
    .col-email input:disabled { background: #f8fafc; color: #94a3b8; }

    .chip { display: inline-flex; align-items: center; gap: .35rem; padding: .25rem .65rem; border-radius: 9999px; font-size: .72rem; font-weight: 700; white-space: nowrap; }
    .chip.pending { background: #f1f5f9; color: #64748b; }
    .chip.uploading { background: #dbeafe; color: #1e40af; }
    .chip.processing { background: #fef9c3; color: #92400e; }
    .chip.done { background: #dcfce7; color: #166534; }
    .chip.error { background: #fee2e2; color: #dc2626; cursor: help; }
    .mini-spin { width: 10px; height: 10px; border: 1.5px solid rgba(0,0,0,.15); border-top-color: currentColor; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .remove-btn { width: 26px; height: 26px; background: none; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
    .remove-btn:hover { background: #fee2e2; color: #dc2626; }
    .remove-btn svg { width: 14px; height: 14px; }

    .summary-bar { display: flex; align-items: center; gap: 1rem; padding: .75rem 1.25rem; background: #f0fdf4; border-top: 1px solid #bbf7d0; font-size: .85rem; color: #166534; flex-wrap: wrap; }
    .summary-bar.has-errors { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .err-count { color: #dc2626; font-weight: 600; }
    .proc-note { color: #64748b; }
    .view-profiles-link { margin-left: auto; color: #4f46e5; font-weight: 600; text-decoration: none; }
    .view-profiles-link:hover { text-decoration: underline; }

    .card-footer { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-top: 1px solid #f1f5f9; }
    .btn-process { display: flex; align-items: center; gap: .5rem; padding: .65rem 1.5rem; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: .9rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s; }
    .btn-process:hover:not(:disabled) { background: #4338ca; }
    .btn-process:disabled { opacity: .6; cursor: not-allowed; }
    .btn-process svg { width: 16px; height: 16px; }
    .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
    .footer-hint { font-size: .8rem; color: #94a3b8; }

    .tips-card { background: white; border-radius: 12px; padding: 1.25rem 1.5rem; border: 1px solid #e2e8f0; }
    .tips-card h3 { font-size: .78rem; font-weight: 700; color: #64748b; margin: 0 0 .75rem; text-transform: uppercase; letter-spacing: .06em; }
    .tips-card ul { margin: 0; padding: 0 0 0 1.1rem; display: flex; flex-direction: column; gap: .4rem; }
    .tips-card li { font-size: .85rem; color: #4b5563; line-height: 1.5; }
    .tips-card code { background: #f1f5f9; padding: .1rem .35rem; border-radius: 4px; font-size: .82em; }
    .tips-card a { color: #4f46e5; }
  `]
})
export class BulkUploadComponent {
  dragging = false;
  processing = signal(false);
  entries = signal<FileEntry[]>([]);
  summary = signal(false);

  constructor(private http: HttpClient) {}

  readyCount() { return this.entries().filter(e => e.email.trim() && e.status === 'pending').length; }
  doneCount() { return this.entries().filter(e => e.status === 'done').length; }
  errorCount() { return this.entries().filter(e => e.status === 'error').length; }
  pendingCount() { return this.entries().filter(e => e.status === 'pending' || e.status === 'uploading' || e.status === 'processing').length; }

  canProcess(): boolean { return this.readyCount() > 0 && !this.processing(); }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault(); this.dragging = false;
    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
  }

  private addFiles(files: File[]) {
    const existing = new Set(this.entries().map(e => e.file.name));
    const newEntries = files
      .filter(f => !existing.has(f.name))
      .map(f => ({
        file: f,
        email: this.guessEmail(f.name),
        status: 'pending' as const,
        error: ''
      }));
    this.entries.update(list => [...list, ...newEntries]);
  }

  private guessEmail(filename: string): string {
    const base = filename.replace(/\.(pdf|docx|txt)$/i, '');
    return base.includes('@') ? base : '';
  }

  removeEntry(index: number) {
    this.entries.update(list => list.filter((_, i) => i !== index));
  }

  clearAll() {
    this.entries.set([]);
    this.summary.set(false);
  }

  processAll() {
    const toProcess = this.entries().filter(e => e.email.trim() && e.status === 'pending');
    if (toProcess.length === 0) return;

    this.processing.set(true);
    this.summary.set(true);

    let completed = 0;
    toProcess.forEach(entry => {
      this.updateEntry(entry, { status: 'uploading' });
      const form = new FormData();
      form.append('file', entry.file);
      form.append('employeeEmail', entry.email.trim().toLowerCase());

      this.http.post<ApiResponse<any>>(`${environment.apiUrl}/hr/upload`, form).subscribe({
        next: res => {
          if (res.success) {
            this.updateEntry(entry, { status: 'processing' });
            setTimeout(() => {
              this.updateEntry(entry, { status: 'done' });
              completed++;
              if (completed === toProcess.length) this.processing.set(false);
            }, 12000);
          } else {
            this.updateEntry(entry, { status: 'error', error: res.error ?? 'Upload failed' });
            completed++;
            if (completed === toProcess.length) this.processing.set(false);
          }
        },
        error: err => {
          this.updateEntry(entry, { status: 'error', error: err.error?.error ?? 'Upload failed' });
          completed++;
          if (completed === toProcess.length) this.processing.set(false);
        }
      });
    });
  }

  private updateEntry(entry: FileEntry, patch: Partial<FileEntry>) {
    this.entries.update(list => list.map(e => e.file.name === entry.file.name ? { ...e, ...patch } : e));
  }
}
