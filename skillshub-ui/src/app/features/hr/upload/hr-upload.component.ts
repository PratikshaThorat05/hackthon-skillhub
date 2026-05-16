import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/models';

type UploadTab = 'file' | 'linkedin' | 'github';

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
      <p class="subtitle">Upload a resume or import a GitHub profile on behalf of an employee. AI extracts skills automatically.</p>

      <div class="upload-card">
        <div class="tabs">
          <button class="tab" [class.active]="activeTab === 'file'" (click)="activeTab = 'file'">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
            Resume File
          </button>
          <button class="tab" [class.active]="activeTab === 'github'" (click)="activeTab = 'github'">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub Profile
          </button>
          <button class="tab" [class.active]="activeTab === 'linkedin'" (click)="activeTab = 'linkedin'">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn Profile
          </button>
        </div>

        <div class="field">
          <label>Employee Email *</label>
          <input [(ngModel)]="employeeEmail" type="email" placeholder="employee@company.com" [disabled]="uploading()" />
          <span class="hint">If the employee doesn't have an account, one will be created automatically.</span>
        </div>

        @if (activeTab === 'file') {
          <div class="field">
            <label>Resume File *</label>
            <div class="drop-zone" [class.has-file]="selectedFile" (click)="fileInput.click()"
                 (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
              @if (selectedFile) {
                <div class="file-info">
                  <span class="file-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg></span>
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <span class="file-size">{{ (selectedFile.size / 1024).toFixed(0) }} KB</span>
                  <button class="remove-file" (click)="$event.stopPropagation(); selectedFile = null" aria-label="Remove file"><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></button>
                </div>
              } @else {
                <div class="drop-hint">
                  <span class="drop-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg></span>
                  <span>Click to browse or drag &amp; drop</span>
                  <span class="formats">PDF, DOCX, TXT — max 5MB</span>
                </div>
              }
            </div>
            <input #fileInput type="file" accept=".pdf,.docx,.txt" style="display:none" (change)="onFileSelected($event)" />
          </div>
        }

        @if (activeTab === 'linkedin') {
          <div class="field">
            <label>LinkedIn Profile URL *</label>
            <div class="gh-input-wrap">
              <svg class="gh-icon" viewBox="0 0 24 24" fill="currentColor" style="color:#0077b5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <input class="gh-text-input" [(ngModel)]="linkedInUrl" type="text"
                     placeholder="https://www.linkedin.com/in/username"
                     [disabled]="uploading()" />
            </div>
            <span class="hint">AI will extract skills, experience, education, and certifications from the LinkedIn profile.</span>
          </div>
        }

        @if (activeTab === 'github') {
          <div class="field">
            <label>GitHub Profile URL or Username *</label>
            <div class="gh-input-wrap">
              <svg class="gh-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <input class="gh-text-input" [(ngModel)]="githubUrl" type="text"
                     placeholder="https://github.com/username  or just  username"
                     [disabled]="uploading()" />
            </div>
            <span class="hint">AI will analyze public repos, languages, and recent commits to infer active skills.</span>
          </div>
        }

        @if (errorMsg()) {
          <div class="error-banner">{{ errorMsg() }}</div>
        }

        <button class="btn-upload" (click)="submit()" [disabled]="uploading() || !canSubmit()">
          @if (uploading()) {
            <span class="btn-spinner"></span>
            Processing...
          } @else if (activeTab === 'linkedin') {
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Import LinkedIn Profile
          } @else if (activeTab === 'github') {
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Import GitHub Profile
          } @else {
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            Upload &amp; Process Resume
          }
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
                  @if (r.status === 'uploading') { Uploading… }
                  @if (r.status === 'processing') { AI Processing… }
                  @if (r.status === 'done') { Done }
                  @if (r.status === 'error') { Failed }
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
          <li>AI reads the profile and extracts skills, experience, certifications, and education</li>
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

    .tabs { display:flex; gap:.5rem; margin-bottom:1.5rem; border-bottom:1px solid #e2e8f0; padding-bottom:0; }
    .tab { display:flex; align-items:center; gap:.45rem; padding:.55rem 1rem; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; font-size:.875rem; font-weight:500; color:#64748b; font-family:inherit; margin-bottom:-1px; transition:.15s; }
    .tab svg { width:16px; height:16px; }
    .tab:hover { color:#4f46e5; }
    .tab.active { color:#4f46e5; border-bottom-color:#4f46e5; }

    .field { margin-bottom:1.25rem; }
    .field label { display:block; font-size:.85rem; font-weight:600; color:#374151; margin-bottom:.4rem; }
    .field input[type=email] { width:100%; padding:.6rem .9rem; border:1.5px solid #e5e7eb; border-radius:8px; font-size:.9rem; box-sizing:border-box; font-family:inherit; }
    .field input[type=email]:focus { outline:none; border-color:#4f46e5; }
    .field input:disabled { background:#f9fafb; color:#9ca3af; }
    .hint { display:block; font-size:.75rem; color:#9ca3af; margin-top:.3rem; }

    .drop-zone { border:2px dashed #e5e7eb; border-radius:10px; padding:1.5rem; text-align:center; cursor:pointer; transition:.2s; }
    .drop-zone:hover, .drop-zone.has-file { border-color:#4f46e5; background:#f5f3ff; }
    .drop-hint { display:flex; flex-direction:column; align-items:center; gap:.3rem; color:#9ca3af; }
    .drop-icon { width:40px; height:40px; color:#94a3b8; display:flex; align-items:center; justify-content:center; }
    .drop-icon svg { width:36px; height:36px; }
    .formats { font-size:.75rem; color:#c4b5fd; }
    .file-info { display:flex; align-items:center; gap:.75rem; justify-content:center; }
    .file-icon { width:28px; height:28px; color:#4f46e5; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .file-icon svg { width:24px; height:24px; }
    .file-name { font-size:.9rem; color:#4f46e5; font-weight:600; }
    .file-size { font-size:.78rem; color:#9ca3af; }
    .remove-file { background:none; border:none; color:#dc2626; cursor:pointer; padding:0 .25rem; display:flex; align-items:center; }
    .remove-file svg { width:16px; height:16px; }

    .gh-input-wrap { display:flex; align-items:center; border:1.5px solid #e5e7eb; border-radius:8px; overflow:hidden; transition:.15s; }
    .gh-input-wrap:focus-within { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.08); }
    .gh-icon { width:36px; height:36px; padding:0 10px; color:#64748b; flex-shrink:0; }
    .gh-text-input { flex:1; border:none; padding:.65rem .9rem .65rem 0; font-size:.9rem; font-family:inherit; outline:none; background:transparent; color:#0f172a; }
    .gh-text-input::placeholder { color:#94a3b8; }
    .gh-text-input:disabled { color:#9ca3af; }

    .error-banner { background:#fee2e2; color:#dc2626; padding:.75rem 1rem; border-radius:8px; font-size:.88rem; margin-bottom:1rem; }
    .btn-upload { width:100%; padding:.75rem; background:#4f46e5; color:white; border:none; border-radius:10px; font-size:.95rem; font-weight:600; cursor:pointer; transition:.2s; display:flex; align-items:center; justify-content:center; gap:.5rem; font-family:inherit; }
    .btn-upload:hover:not(:disabled) { background:#4338ca; }
    .btn-upload:disabled { opacity:.5; cursor:not-allowed; }
    .btn-upload svg { width:17px; height:17px; }
    .btn-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

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
  githubUrl = '';
  linkedInUrl = '';
  activeTab: UploadTab = 'file';
  uploading = signal(false);
  errorMsg = signal('');
  results = signal<UploadResult[]>([]);

  constructor(private http: HttpClient) {}

  canSubmit(): boolean {
    const email = this.employeeEmail.trim();
    if (!email) return false;
    if (this.activeTab === 'file') return !!this.selectedFile;
    if (this.activeTab === 'linkedin') return !!this.linkedInUrl.trim();
    return !!this.githubUrl.trim();
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

  submit() {
    if (this.activeTab === 'linkedin') this.importLinkedIn();
    else if (this.activeTab === 'github') this.importGitHub();
    else this.uploadFile();
  }

  private uploadFile() {
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
          result.status = 'processing'; result.message = 'AI is processing the resume...';
          this.results.update(r => [...r]);
          this.employeeEmail = ''; this.selectedFile = null;
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

  private importLinkedIn() {
    const email = this.employeeEmail.trim().toLowerCase();
    const url = this.linkedInUrl.trim();
    if (!email || !url) return;
    this.errorMsg.set('');
    this.uploading.set(true);

    const result: UploadResult = { email, source: url, status: 'uploading', message: '' };
    this.results.update(r => [result, ...r]);

    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/hr/upload-linkedin`, { employeeEmail: email, linkedInUrl: url }).subscribe({
      next: res => {
        this.uploading.set(false);
        if (res.success) {
          result.status = 'processing'; result.message = 'AI is extracting profile data...';
          this.results.update(r => [...r]);
          this.employeeEmail = ''; this.linkedInUrl = '';
          setTimeout(() => { result.status = 'done'; result.message = 'Profile created. Go to Profiles to review.'; this.results.update(r => [...r]); }, 12000);
        } else {
          result.status = 'error'; result.message = res.error ?? 'LinkedIn import failed';
          this.results.update(r => [...r]); this.errorMsg.set(res.error ?? 'LinkedIn import failed');
        }
      },
      error: err => {
        this.uploading.set(false);
        const msg = err.error?.error ?? 'LinkedIn import failed. Please try again.';
        result.status = 'error'; result.message = msg;
        this.results.update(r => [...r]); this.errorMsg.set(msg);
      }
    });
  }

  private importGitHub() {
    const email = this.employeeEmail.trim().toLowerCase();
    const url = this.githubUrl.trim();
    if (!email || !url) return;
    this.errorMsg.set('');
    this.uploading.set(true);

    const result: UploadResult = { email, source: url, status: 'uploading', message: '' };
    this.results.update(r => [result, ...r]);

    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/hr/upload-github`, { employeeEmail: email, gitHubUrl: url }).subscribe({
      next: res => {
        this.uploading.set(false);
        if (res.success) {
          result.status = 'processing'; result.message = 'AI is inferring skills from GitHub...';
          this.results.update(r => [...r]);
          this.employeeEmail = ''; this.githubUrl = '';
          setTimeout(() => { result.status = 'done'; result.message = 'Profile created. Go to Profiles to review.'; this.results.update(r => [...r]); }, 10000);
        } else {
          result.status = 'error'; result.message = res.error ?? 'GitHub import failed';
          this.results.update(r => [...r]); this.errorMsg.set(res.error ?? 'GitHub import failed');
        }
      },
      error: err => {
        this.uploading.set(false);
        const msg = err.error?.error ?? 'GitHub import failed. Please try again.';
        result.status = 'error'; result.message = msg;
        this.results.update(r => [...r]); this.errorMsg.set(msg);
      }
    });
  }
}
