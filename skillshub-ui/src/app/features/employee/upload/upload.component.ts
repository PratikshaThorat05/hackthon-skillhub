import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/models';

type Step = 'idle' | 'uploading' | 'queued' | 'processing' | 'done' | 'failed';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1>Upload Resume</h1>
        <p>AI will extract your skills, experience, certifications, and education automatically.</p>
      </div>

      @if (step() === 'idle' || step() === 'uploading') {
        <div class="upload-card">
          <div class="drop-zone" [class.has-file]="!!selectedFile" [class.dragging]="dragging"
               (click)="fileInput.click()"
               (dragover)="$event.preventDefault(); dragging=true"
               (dragleave)="dragging=false"
               (drop)="onDrop($event)">
            @if (!selectedFile) {
              <div class="drop-content">
                <div class="drop-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                  </svg>
                </div>
                <p class="drop-title">Drop your resume here</p>
                <p class="drop-sub">or <span class="browse-link">click to browse</span></p>
                <p class="drop-formats">Supports PDF, DOCX, TXT &middot; Max 5MB</p>
              </div>
            } @else {
              <div class="file-selected">
                <div class="file-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z"/><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z"/></svg>
                </div>
                <div class="file-meta">
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <span class="file-size">{{ (selectedFile.size / 1024).toFixed(0) }} KB</span>
                </div>
                <button class="remove-btn" (click)="$event.stopPropagation(); selectedFile = null">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </button>
              </div>
            }
          </div>
          <input #fileInput type="file" accept=".pdf,.docx,.txt" (change)="onFileSelect($event)" hidden />

          @if (errorMsg()) {
            <div class="alert-error">{{ errorMsg() }}</div>
          }

          <button class="btn-upload" [disabled]="!selectedFile || step() === 'uploading'" (click)="upload()">
            @if (step() === 'uploading') {
              <span class="btn-spinner"></span> Uploading...
            } @else {
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
              Upload &amp; Analyze Resume
            }
          </button>
        </div>
      }

      @if (step() !== 'idle') {
        <div class="progress-card">
          <div class="progress-title">
            @if (step() === 'done') { Resume analyzed successfully }
            @else if (step() === 'failed') { Processing failed }
            @else { Analyzing your resume... }
          </div>

          <div class="steps">
            <div class="step" [class]="getStepClass(1)">
              <div class="step-circle">
                @if (stepNum() > 1) { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 1) { <span class="step-spinner"></span> }
                @else { 1 }
              </div>
              <div class="step-info">
                <span class="step-name">Upload</span>
                <span class="step-desc">Sending file to server</span>
              </div>
            </div>

            <div class="step-connector" [class.done]="stepNum() > 1"></div>

            <div class="step" [class]="getStepClass(2)">
              <div class="step-circle">
                @if (stepNum() > 2) { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 2) { <span class="step-spinner"></span> }
                @else { 2 }
              </div>
              <div class="step-info">
                <span class="step-name">Text Extraction</span>
                <span class="step-desc">Reading resume content</span>
              </div>
            </div>

            <div class="step-connector" [class.done]="stepNum() > 2"></div>

            <div class="step" [class]="getStepClass(3)">
              <div class="step-circle">
                @if (stepNum() > 3) { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 3) { <span class="step-spinner"></span> }
                @else { 3 }
              </div>
              <div class="step-info">
                <span class="step-name">AI Analysis</span>
                <span class="step-desc">Extracting skills &amp; experience</span>
              </div>
            </div>

            <div class="step-connector" [class.done]="stepNum() > 3"></div>

            <div class="step" [class]="getStepClass(4)">
              <div class="step-circle">
                @if (step() === 'done') { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 4) { <span class="step-spinner"></span> }
                @else { 4 }
              </div>
              <div class="step-info">
                <span class="step-name">Profile Created</span>
                <span class="step-desc">Building your skill profile</span>
              </div>
            </div>
          </div>

          @if (step() === 'done') {
            <div class="done-banner">Your profile has been created. Redirecting...</div>
          }
          @if (step() === 'failed') {
            <div class="fail-banner">{{ errorMsg() || 'AI processing failed. Please try again.' }}</div>
          }
        </div>
      }

      <div class="info-card">
        <h3>What gets extracted</h3>
        <div class="info-grid">
          <div class="info-item"><span class="info-icon">🎯</span><span>Skills &amp; proficiency levels</span></div>
          <div class="info-item"><span class="info-icon">💼</span><span>Work experience history</span></div>
          <div class="info-item"><span class="info-icon">🎓</span><span>Education &amp; degrees</span></div>
          <div class="info-item"><span class="info-icon">🏆</span><span>Certifications &amp; credentials</span></div>
          <div class="info-item"><span class="info-icon">🚀</span><span>Projects &amp; tech stack</span></div>
          <div class="info-item"><span class="info-icon">📝</span><span>Professional summary</span></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { max-width: 680px; margin: 0 auto; padding: 2rem 1.5rem; }
    .page-header { margin-bottom: 1.75rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 .35rem; }
    .page-header p { color: #64748b; font-size: .9rem; margin: 0; }
    .upload-card { background: white; border-radius: 12px; padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04); border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
    .drop-zone { border: 2px dashed #cbd5e1; border-radius: 10px; padding: 2.5rem 1.5rem; text-align: center; cursor: pointer; transition: .2s; margin-bottom: 1.25rem; }
    .drop-zone:hover, .drop-zone.dragging { border-color: #4f46e5; background: #f5f3ff; }
    .drop-zone.has-file { border-style: solid; border-color: #4f46e5; background: #f5f3ff; }
    .drop-icon-wrap { width: 56px; height: 56px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto .75rem; color: #64748b; }
    .drop-icon-wrap svg { width: 28px; height: 28px; }
    .drop-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 .25rem; }
    .drop-sub { font-size: .875rem; color: #64748b; margin: 0 0 .5rem; }
    .browse-link { color: #4f46e5; font-weight: 600; }
    .drop-formats { font-size: .78rem; color: #94a3b8; margin: 0; }
    .file-selected { display: flex; align-items: center; gap: 1rem; }
    .file-icon-wrap { width: 44px; height: 44px; background: #ede9fe; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #6d28d9; flex-shrink: 0; }
    .file-icon-wrap svg { width: 22px; height: 22px; }
    .file-meta { flex: 1; text-align: left; }
    .file-name { display: block; font-weight: 600; color: #0f172a; font-size: .9rem; }
    .file-size { display: block; font-size: .78rem; color: #94a3b8; margin-top: .1rem; }
    .remove-btn { width: 32px; height: 32px; background: #fee2e2; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #dc2626; flex-shrink: 0; }
    .remove-btn svg { width: 16px; height: 16px; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: .65rem .9rem; border-radius: 8px; font-size: .85rem; margin-bottom: 1rem; }
    .btn-upload { width: 100%; padding: .8rem; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: .95rem; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: .5rem; transition: background .15s; }
    .btn-upload:hover:not(:disabled) { background: #4338ca; }
    .btn-upload:disabled { opacity: .6; cursor: not-allowed; }
    .btn-upload svg { width: 18px; height: 18px; }
    .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .progress-card { background: white; border-radius: 12px; padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04); border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
    .progress-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin-bottom: 1.75rem; }
    .steps { display: flex; align-items: flex-start; }
    .step { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; color: #94a3b8; margin-bottom: .6rem; transition: .3s; }
    .step.active .step-circle { border-color: #4f46e5; background: #ede9fe; color: #4f46e5; }
    .step.done .step-circle { border-color: #059669; background: #059669; color: white; }
    .step.done .step-circle svg { width: 16px; height: 16px; }
    .step-spinner { width: 14px; height: 14px; border: 2px solid rgba(79,70,229,.3); border-top-color: #4f46e5; border-radius: 50%; animation: spin .7s linear infinite; }
    .step-info { text-align: center; }
    .step-name { display: block; font-size: .75rem; font-weight: 600; color: #374151; }
    .step.pending .step-name { color: #94a3b8; }
    .step-desc { display: block; font-size: .68rem; color: #94a3b8; margin-top: .15rem; line-height: 1.3; }
    .step-connector { flex: 1; height: 2px; background: #e2e8f0; margin-top: 17px; transition: .3s; }
    .step-connector.done { background: #059669; }
    .done-banner { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-top: 1.5rem; text-align: center; }
    .fail-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-top: 1.5rem; text-align: center; }
    .info-card { background: white; border-radius: 12px; padding: 1.5rem 1.75rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
    .info-card h3 { font-size: .8rem; font-weight: 700; color: #64748b; margin: 0 0 1rem; text-transform: uppercase; letter-spacing: .06em; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
    .info-item { display: flex; align-items: center; gap: .6rem; font-size: .85rem; color: #4b5563; }
    .info-icon { font-size: 1rem; }
  `]
})
export class UploadComponent {
  selectedFile: File | null = null;
  dragging = false;
  step = signal<Step>('idle');
  errorMsg = signal('');
  stepNum = computed(() => {
    switch (this.step()) {
      case 'uploading': return 1;
      case 'queued': return 2;
      case 'processing': return 3;
      case 'done': return 4;
      default: return 0;
    }
  });

  constructor(private http: HttpClient, private router: Router) {}

  getStepClass(n: number): string {
    const s = this.stepNum();
    if (s > n) return 'done';
    if (s === n) return 'active';
    return 'pending';
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) { this.selectedFile = input.files[0]; this.errorMsg.set(''); }
  }

  onDrop(event: DragEvent) {
    event.preventDefault(); this.dragging = false;
    if (event.dataTransfer?.files[0]) { this.selectedFile = event.dataTransfer.files[0]; this.errorMsg.set(''); }
  }

  upload() {
    if (!this.selectedFile) return;
    this.step.set('uploading');
    this.errorMsg.set('');
    const form = new FormData();
    form.append('file', this.selectedFile);
    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/resumes/upload`, form).subscribe({
      next: res => {
        if (res.success) {
          this.step.set('queued');
          this.pollStatus();
        } else {
          this.errorMsg.set(res.error || 'Upload failed');
          this.step.set('failed');
        }
      },
      error: () => { this.errorMsg.set('Upload failed. Please try again.'); this.step.set('failed'); }
    });
  }

  private pollStatus() {
    const interval = setInterval(() => {
      this.http.get<ApiResponse<any>>(`${environment.apiUrl}/resumes/status`).subscribe(res => {
        if (res.success) {
          const status = res.data?.parseStatus;
          if (status === 'Processing') this.step.set('processing');
          if (status === 'Done') {
            clearInterval(interval);
            this.step.set('done');
            setTimeout(() => this.router.navigate(['/employee/profile']), 1800);
          } else if (status === 'Failed') {
            clearInterval(interval);
            this.errorMsg.set(res.data?.parseError ?? 'AI processing failed.');
            this.step.set('failed');
          }
        }
      });
    }, 3000);
    setTimeout(() => clearInterval(interval), 120000);
  }
}
