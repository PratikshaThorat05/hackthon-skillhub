import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ProfileResponse } from '../../../core/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      @if (loading()) { <div class="loading">Loading profile...</div> }
      @if (profile()) {
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar">{{ profile()!.fullName[0] }}</div>
            <div>
              <h2>{{ profile()!.fullName }}</h2>
              <p>{{ profile()!.currentTitle }}</p>
              <span class="status-badge" [class]="profile()!.status.toLowerCase()">{{ profile()!.status }}</span>
            </div>
          </div>
          @if (profile()!.summary) {
            <div class="section">
              <h3>AI Summary</h3>
              <p>{{ profile()!.summary }}</p>
            </div>
          }
          <div class="section">
            <h3>Skills ({{ profile()!.skills.length }})</h3>
            <div class="skills-grid">
              @for (s of profile()!.skills; track s.id) {
                <div class="skill-item">
                  <span>{{ s.name }}</span>
                  <div class="prof-dots">
                    @for (i of [1,2,3,4,5]; track i) {
                      <span class="dot" [class.filled]="i <= s.proficiencyLevel"></span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          @if (profile()!.experience.length > 0) {
            <div class="section">
              <h3>Experience</h3>
              @for (exp of profile()!.experience; track exp.companyName) {
                <div class="exp-item">
                  <strong>{{ exp.jobTitle }}</strong> at {{ exp.companyName }}
                  <span class="date">{{ exp.startDate | date:'MMM yyyy' }} – {{ exp.isCurrent ? 'Present' : (exp.endDate | date:'MMM yyyy') }}</span>
                  @if (exp.description) { <p class="exp-desc">{{ exp.description }}</p> }
                </div>
              }
            </div>
          }
          @if (profile()!.projects.length > 0) {
            <div class="section">
              <h3>Projects</h3>
              @for (proj of profile()!.projects; track proj.name) {
                <div class="proj-item">
                  <strong>{{ proj.name }}</strong>
                  @if (proj.description) { <p class="proj-desc">{{ proj.description }}</p> }
                  @if (proj.techStack.length > 0) {
                    <div class="tech-tags">
                      @for (t of proj.techStack; track t) { <span class="tech-tag">{{ t }}</span> }
                    </div>
                  }
                </div>
              }
            </div>
          }
          @if (profile()!.education.length > 0) {
            <div class="section">
              <h3>Education</h3>
              @for (edu of profile()!.education; track edu.institution) {
                <div class="edu-item">
                  <strong>{{ edu.institution }}</strong>
                  @if (edu.degree || edu.fieldOfStudy) {
                    <span class="edu-detail"> — {{ edu.degree }}{{ edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : '' }}</span>
                  }
                  @if (edu.graduationYear) { <span class="date">Class of {{ edu.graduationYear }}</span> }
                </div>
              }
            </div>
          }
        </div>
      }
      @if (!loading() && !profile()) {
        <div class="empty">No profile yet. <a href="/employee/upload">Upload your resume</a> to get started.</div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:700px; margin:2rem auto; padding:0 1rem; }
    .loading, .empty { text-align:center; color:#666; padding:3rem; }
    .profile-card { background:white; border-radius:12px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .profile-header { display:flex; gap:1.25rem; align-items:flex-start; margin-bottom:1.5rem; }
    .avatar { width:64px; height:64px; background:#4f46e5; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; flex-shrink:0; }
    h2 { margin:0; font-size:1.4rem; color:#1a1a2e; }
    h3 { font-size:1rem; color:#374151; margin:0 0 .75rem; border-bottom:1px solid #f3f4f6; padding-bottom:.4rem; }
    .section { margin-bottom:1.5rem; }
    .status-badge { padding:.2rem .7rem; border-radius:9999px; font-size:.78rem; font-weight:600; }
    .status-badge.approved { background:#dcfce7; color:#166534; }
    .status-badge.pending { background:#fef9c3; color:#92400e; }
    .status-badge.rejected { background:#fee2e2; color:#dc2626; }
    .skills-grid { display:flex; flex-wrap:wrap; gap:.5rem; }
    .skill-item { display:flex; align-items:center; gap:.5rem; background:#f8fafc; padding:.4rem .8rem; border-radius:8px; font-size:.85rem; }
    .prof-dots { display:flex; gap:2px; }
    .dot { width:8px; height:8px; border-radius:50%; background:#e5e7eb; }
    .dot.filled { background:#4f46e5; }
    .exp-item, .proj-item, .edu-item { margin-bottom:.75rem; font-size:.9rem; color:#374151; }
    .exp-desc, .proj-desc { margin:.3rem 0 0; font-size:.85rem; color:#6b7280; }
    .edu-detail { font-weight:400; color:#6b7280; }
    .date { display:block; font-size:.8rem; color:#9ca3af; margin-top:.2rem; }
    .tech-tags { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.4rem; }
    .tech-tag { padding:.15rem .5rem; background:#ede9fe; color:#6d28d9; border-radius:4px; font-size:.75rem; }
  `]
})
export class ProfileComponent implements OnInit {
  profile = signal<ProfileResponse | null>(null);
  loading = signal(true);
  constructor(private http: HttpClient) {}
  ngOnInit() {
    this.http.get<ApiResponse<ProfileResponse>>(`${environment.apiUrl}/profiles/me`).subscribe({
      next: res => { if (res.success) this.profile.set(res.data!); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
