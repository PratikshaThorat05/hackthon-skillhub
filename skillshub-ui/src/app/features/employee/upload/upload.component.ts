import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/models';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="card">
        <h2>Upload Your Resume</h2>
        <p class="desc">Upload your PDF or DOCX resume. Our AI will extract your skills, experience, and projects automatically.</p>

        <div class="dropzone" [class.dragging]="dragging" (click)="fileInput.click()"
             (dragover)="$event.preventDefault(); dragging=true"
             (dragleave)="dragging=false"
             (drop)="onDrop($event)">
          @if (!selectedFile) {
            <div class="dz-content">
              <div class="icon">📄</div>
              <p>Drop your resume here or <strong>click to browse</strong></p>
              <span class="hint">PDF, DOCX, TXT · Max 5MB</span>
            </div>
          } @else {
            <div class="dz-content">
              <div class="icon">✅</div>
              <p><strong>{{ selectedFile.name }}</strong></p>
              <span class="hint">{{ (selectedFile.size / 1024).toFixed(0) }} KB</span>
            </div>
          }
        </div>
        <input #fileInput type="file" accept=".pdf,.docx,.txt" (change)="onFileSelect($event)" hidden />

        @if (status()) {
          <div class="status" [class.success]="statusType() === 'success'" [class.error]="statusType() === 'error'">
            {{ status() }}
          </div>
        }
        @if (parseStatus() && parseStatus() !== 'Done') {
          <div class="parse-status">
            <span class="badge" [class]="parseStatus()!.toLowerCase()">{{ parseStatus() }}</span>
            AI is extracting your skills and experience...
          </div>
        }

        <button class="btn-upload" [disabled]="!selectedFile || uploading() || parseStatus() === 'Done'" (click)="upload()">
          {{ uploading() ? 'Uploading...' : 'Upload & Analyze' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; justify-content:center; padding:2rem; }
    .card { background:white; border-radius:12px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,.08); max-width:500px; width:100%; }
    h2 { font-size:1.5rem; font-weight:700; color:#1a1a2e; margin-bottom:.5rem; }
    .desc { color:#666; margin-bottom:1.5rem; font-size:.95rem; }
    .dropzone { border:2px dashed #c7d2fe; border-radius:12px; padding:2rem; cursor:pointer; text-align:center; transition:.2s; }
    .dropzone:hover, .dropzone.dragging { border-color:#4f46e5; background:#f5f3ff; }
    .dz-content .icon { font-size:2.5rem; margin-bottom:.5rem; }
    .dz-content p { margin:.25rem 0; color:#444; }
    .hint { font-size:.8rem; color:#999; }
    .btn-upload { width:100%; padding:.85rem; background:#4f46e5; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; margin-top:1.5rem; }
    .btn-upload:disabled { opacity:.6; cursor:not-allowed; }
    .status { padding:.75rem 1rem; border-radius:8px; margin-top:1rem; font-size:.9rem; }
    .status.success { background:#dcfce7; color:#166534; }
    .status.error { background:#fee2e2; color:#dc2626; }
    .parse-status { display:flex; align-items:center; gap:.5rem; margin-top:.75rem; font-size:.85rem; color:#666; }
    .badge { padding:.2rem .6rem; border-radius:9999px; font-size:.75rem; font-weight:600; }
    .badge.queued { background:#fef9c3; color:#92400e; }
    .badge.processing { background:#dbeafe; color:#1e40af; }
    .badge.done { background:#dcfce7; color:#166534; }
    .badge.failed { background:#fee2e2; color:#dc2626; }
  `]
})
export class UploadComponent {
  selectedFile: File | null = null;
  dragging = false;
  uploading = signal(false);
  status = signal('');
  statusType = signal<'success' | 'error' | ''>('');
  parseStatus = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.selectedFile = input.files[0];
  }

  onDrop(event: DragEvent) {
    event.preventDefault(); this.dragging = false;
    if (event.dataTransfer?.files[0]) this.selectedFile = event.dataTransfer.files[0];
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    const form = new FormData();
    form.append('file', this.selectedFile);
    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/resumes/upload`, form).subscribe({
      next: res => {
        if (res.success) {
          this.status.set('Resume uploaded! AI is analyzing your skills...');
          this.statusType.set('success');
          this.parseStatus.set('Queued');
          this.pollStatus();
        } else {
          this.status.set(res.error || 'Upload failed'); this.statusType.set('error');
        }
        this.uploading.set(false);
      },
      error: () => { this.status.set('Upload failed. Please try again.'); this.statusType.set('error'); this.uploading.set(false); }
    });
  }

  private pollStatus() {
    const interval = setInterval(() => {
      this.http.get<ApiResponse<any>>(`${environment.apiUrl}/resumes/status`).subscribe(res => {
        if (res.success) {
          this.parseStatus.set(res.data?.parseStatus);
          if (res.data?.parseStatus === 'Done') {
            clearInterval(interval);
            this.parseStatus.set('Done');
            this.status.set('✅ Profile created! Redirecting to your profile...');
            this.statusType.set('success');
            setTimeout(() => this.router.navigate(['/employee/profile']), 1500);
          } else if (res.data?.parseStatus === 'Failed') {
            clearInterval(interval);
            this.status.set('AI processing failed. Please try again.'); this.statusType.set('error');
          }
        }
      });
    }, 3000);
    setTimeout(() => clearInterval(interval), 120000); // stop after 2 min
  }
}
