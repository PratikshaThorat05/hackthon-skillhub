import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/models';

interface UploadResult {
  email: string;
  source: string;
  status: 'uploading' | 'processing' | 'done' | 'error';
  message: string;
}

@Component({
  selector: 'app-hr-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <h2>Upload Employee Profile</h2>
      <p class="subtitle">Upload a resume on behalf of an employee. The AI will extract skills, experience, and certifications automatically.</p>

      <div class="upload-card">
        <div class="field">
          <label>Employee Email *</label>
          <input [(ngModel)]="employeeEmail" type="email" placeholder="employee@company.com" [disabled]="uploading()" />
          <span class="hint">If the employee doesn't have an account, one will be created automatically.</span>
        </div>

        <div class="field">
          <label>Resume File *</label>
          <div class="drop-zone" [class.has-file]="selectedFile" (click)="fileInput.click()"
               (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
            @if (selectedFile) {
              <div class="file-info">
                <span class="file-icon">📄</span>
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ (selectedFile.size / 1024).toFixed(0) }} KB</span>
                <button class="remove-file" (click)="$event.stopPropagation(); selectedFile = null">✕</button>
              </div>
            } @else {
              <div class="drop-hint">
                <span class="drop-icon">📁</span>
                <span>Click to browse or drag & drop</span>
                <span class="formats">PDF, DOCX, TXT — max 5MB</span>
              </div>
            }
          </div>
          <input #fileInput type="file" accept=".pdf,.docx,.txt" style="display:none" (change)="onFileSelected($event)" />
        </div>

        @if (errorMsg()) {
          <div class="error-banner">{{ errorMsg() }}</div>
        }

        <button class="btn-upload" (click)="uploadFile()"
                [disabled]="uploading() || !canSubmit()">
          {{ uploading() ? 'Processing...' : '⬆️ Upload & Process Resume' }}
        </button>
      </div>

      @if (results().length > 0) {
        <div class="results-section">
          <h3>History</h3>
          @for (r of results(); track r.email + r.source) {
            <div class="result-row" [class]="r.status">
              <div class="result-info">
                <span class="result-email">{{ r.email }}</span>
                <span class="result-file">{{ r.source }}</span>
              </div>
              <div class="result-right">
                <span class="status-chip" [class]="r.status">
                  @if (r.status === 'uploading') { ⏳ Uploading... }
                  @if (r.status === 'processing') { 🤖 AI Processing... }
                  @if (r.status === 'done') { ✅ Done }
                  @if (r.status === 'error') { ❌ Failed }
                </span>
                <span class="result-msg">{{ r.message }}</span>
              </div>
            </div>
          }
        </div>
      }

      <div class="tip-box">
        <strong>What happens next?</strong>
        <ol>
          <li>The AI reads the resume and extracts skills, experience, certifications, and education</li>
          <li>A profile is created with status <strong>Pending</strong></li>
          <li>Go to <a routerLink="/hr/profiles">Profiles</a> to review and approve it</li>
          <li>Once approved, the profile appears in search results</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width:680px; margin:0 auto; padding:2rem 1.5rem; }
    h2 { font-size:1.5rem; font-weight:700; color:#0f172a; margin:0 0 .4rem; }
    .subtitle { color:#64748b; font-size:.9rem; margin-bottom:1.75rem; }
    h3 { font-size:1rem; color:#374151; margin:0 0 .75rem; }
    .upload-card { background:white; border-radius:12px; padding:1.75rem; box-shadow:0 2px 12px rgba(0,0,0,.07); margin-bottom:1.5rem; }
    .field { margin-bottom:1.25rem; }
    .field label { display:block; font-size:.85rem; font-weight:600; color:#374151; margin-bottom:.4rem; }
    .field input[type=email] { width:100%; padding:.6rem .9rem; border:1.5px solid #e5e7eb; border-radius:8px; font-size:.9rem; box-sizing:border-box; }
    .field input:focus { outline:none; border-color:#4f46e5; }
    .field input:disabled { background:#f9fafb; color:#9ca3af; }
    .hint { display:block; font-size:.75rem; color:#9ca3af; margin-top:.3rem; }
    .drop-zone { border:2px dashed #e5e7eb; border-radius:10px; padding:1.5rem; text-align:center; cursor:pointer; transition:.2s; }
    .drop-zone:hover, .drop-zone.has-file { border-color:#4f46e5; background:#f5f3ff; }
    .drop-hint { display:flex; flex-direction:column; align-items:center; gap:.3rem; color:#9ca3af; }
    .drop-icon { font-size:2rem; }
    .formats { font-size:.75rem; color:#c4b5fd; }
    .file-info { display:flex; align-items:center; gap:.75rem; justify-content:center; }
    .file-icon { font-size:1.5rem; }
    .file-name { font-size:.9rem; color:#4f46e5; font-weight:600; }
    .file-size { font-size:.78rem; color:#9ca3af; }
    .remove-file { background:none; border:none; color:#dc2626; cursor:pointer; font-size:1rem; padding:0 .25rem; }
    .error-banner { background:#fee2e2; color:#dc2626; padding:.75rem 1rem; border-radius:8px; font-size:.88rem; margin-bottom:1rem; }
    .btn-upload { width:100%; padding:.75rem; background:#4f46e5; color:white; border:none; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; transition:.2s; }
    .btn-upload:hover:not(:disabled) { background:#4338ca; }
    .btn-upload:disabled { opacity:.5; cursor:not-allowed; }
    .results-section { background:white; border-radius:12px; padding:1.25rem 1.5rem; box-shadow:0 2px 12px rgba(0,0,0,.07); margin-bottom:1.5rem; }
    .result-row { display:flex; justify-content:space-between; align-items:center; padding:.6rem 0; border-bottom:1px solid #f3f4f6; font-size:.88rem; }
    .result-row:last-child { border-bottom:none; }
    .result-info { display:flex; flex-direction:column; gap:.1rem; }
    .result-email { font-weight:600; color:#1a1a2e; }
    .result-file { font-size:.78rem; color:#9ca3af; }
    .result-right { display:flex; flex-direction:column; align-items:flex-end; gap:.1rem; }
    .status-chip { font-size:.78rem; font-weight:600; }
    .status-chip.done { color:#059669; }
    .status-chip.error { color:#dc2626; }
    .status-chip.uploading, .status-chip.processing { color:#d97706; }
    .result-msg { font-size:.75rem; color:#9ca3af; }
    .tip-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:1.1rem 1.25rem; font-size:.88rem; color:#166534; }
    .tip-box ol { margin:.5rem 0 0 1.2rem; padding:0; line-height:1.8; }
    .tip-box a { color:#4f46e5; }
  `]
})
export class HrUploadComponent {
  employeeEmail = '';
  selectedFile: File | null = null;
  uploading = signal(false);
  errorMsg = signal('');
  results = signal<UploadResult[]>([]);

  constructor(private http: HttpClient) {}

  canSubmit(): boolean {
    return !!this.employeeEmail.trim() && !!this.selectedFile;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
    this.errorMsg.set('');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) { this.selectedFile = file; this.errorMsg.set(''); }
  }

  uploadFile() {
    if (!this.selectedFile || !this.employeeEmail.trim()) return;
    const email = this.employeeEmail.trim().toLowerCase();
    this.errorMsg.set('');
    this.uploading.set(true);

    const result: UploadResult = { email, source: this.selectedFile.name, status: 'uploading', message: '' };
    this.results.update(r => [result, ...r]);

    const form = new FormData();
    form.append('file', this.selectedFile);
    form.append('employeeEmail', email);

    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/hr/upload`, form).subscribe({
      next: res => {
        this.uploading.set(false);
        if (res.success) {
          result.status = 'processing';
          result.message = 'AI is processing the resume...';
          this.results.update(r => [...r]);
          this.employeeEmail = '';
          this.selectedFile = null;
          setTimeout(() => { result.status = 'done'; result.message = 'Profile created. Go to Profiles to review.'; this.results.update(r => [...r]); }, 8000);
        } else {
          result.status = 'error'; result.message = res.error ?? 'Upload failed';
          this.results.update(r => [...r]); this.errorMsg.set(res.error ?? 'Upload failed');
        }
      },
      error: err => {
        this.uploading.set(false);
        const msg = err.error?.error ?? 'Upload failed. Please try again.';
        result.status = 'error'; result.message = msg;
        this.results.update(r => [...r]); this.errorMsg.set(msg);
      }
    });
  }
}
