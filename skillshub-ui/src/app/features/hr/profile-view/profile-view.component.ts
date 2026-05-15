import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ProfileResponse } from '../../../core/models/models';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/hr/search" class="back-link">← Back to Search</a>
      @if (loading()) { <div class="loading">Loading profile...</div> }
      @if (profile()) {
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar">{{ profile()!.fullName[0] }}</div>
            <div class="header-info">
              <h2>{{ profile()!.fullName }}</h2>
              <p class="title">{{ profile()!.currentTitle }}{{ profile()!.department ? ' · ' + profile()!.department : '' }}</p>
              <div class="meta-row">
                <span class="status-badge" [class]="profile()!.status.toLowerCase()">{{ profile()!.status }}</span>
                @if (profile()!.yearsOfExperience) {
                  <span class="years">{{ profile()!.yearsOfExperience }} yrs experience</span>
                }
                @if (profile()!.linkedInUrl) {
                  <a [href]="profile()!.linkedInUrl" target="_blank" class="linkedin">LinkedIn ↗</a>
                }
              </div>
            </div>
          </div>

          @if (profile()!.summary) {
            <div class="section">
              <h3>AI Summary</h3>
              <p class="summary-text">{{ profile()!.summary }}</p>
            </div>
          }

          @if (profile()!.skills.length > 0) {
            <div class="section">
              <h3>Skills ({{ profile()!.skills.length }})</h3>
              <div class="skills-grid">
                @for (s of profile()!.skills; track s.id) {
                  <div class="skill-item">
                    <span>{{ s.name }}</span>
                    @if (s.category) { <span class="cat">{{ s.category }}</span> }
                    <div class="prof-dots">
                      @for (i of [1,2,3,4,5]; track i) {
                        <span class="dot" [class.filled]="i <= s.proficiencyLevel"></span>
                      }
                    </div>
                    @if (s.yearsExperience) { <span class="yrs">{{ s.yearsExperience }}y</span> }
                  </div>
                }
              </div>
            </div>
          }

          @if (profile()!.experience.length > 0) {
            <div class="section">
              <h3>Experience</h3>
              @for (exp of profile()!.experience; track exp.companyName) {
                <div class="exp-item">
                  <div class="exp-header">
                    <strong>{{ exp.jobTitle }}</strong>
                    <span class="company"> at {{ exp.companyName }}</span>
                  </div>
                  <span class="date">
                    {{ exp.startDate | date:'MMM yyyy' }} –
                    {{ exp.isCurrent ? 'Present' : (exp.endDate | date:'MMM yyyy') }}
                    @if (exp.isCurrent) { <span class="current-badge">Current</span> }
                  </span>
                  @if (exp.description) { <p class="exp-desc">{{ exp.description }}</p> }
                  @if (exp.techStack.length > 0) {
                    <div class="tech-tags">
                      @for (t of exp.techStack; track t) { <span class="tech-tag">{{ t }}</span> }
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (profile()!.projects.length > 0) {
            <div class="section">
              <h3>Projects</h3>
              @for (proj of profile()!.projects; track proj.name) {
                <div class="proj-item">
                  <div class="proj-header">
                    <strong>{{ proj.name }}</strong>
                    @if (proj.gitHubUrl) { <a [href]="proj.gitHubUrl" target="_blank" class="gh-link">GitHub ↗</a> }
                  </div>
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
        <div class="empty">Profile not found.</div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:760px; margin:2rem auto; padding:0 1rem; }
    .back-link { display:inline-block; color:#4f46e5; text-decoration:none; font-size:.9rem; margin-bottom:1.25rem; }
    .back-link:hover { text-decoration:underline; }
    .loading, .empty { text-align:center; color:#666; padding:3rem; }
    .profile-card { background:white; border-radius:12px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .profile-header { display:flex; gap:1.25rem; align-items:flex-start; margin-bottom:1.75rem; }
    .avatar { width:64px; height:64px; background:#4f46e5; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; flex-shrink:0; }
    .header-info h2 { margin:0 0 .25rem; font-size:1.4rem; color:#1a1a2e; }
    .title { margin:0 0 .5rem; color:#6b7280; font-size:.95rem; }
    .meta-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
    .years { font-size:.85rem; color:#6b7280; }
    .linkedin { font-size:.82rem; color:#4f46e5; text-decoration:none; }
    .status-badge { padding:.2rem .7rem; border-radius:9999px; font-size:.75rem; font-weight:600; }
    .status-badge.approved { background:#dcfce7; color:#166534; }
    .status-badge.pending { background:#fef9c3; color:#92400e; }
    .status-badge.rejected { background:#fee2e2; color:#dc2626; }
    h3 { font-size:1rem; color:#374151; margin:0 0 .75rem; border-bottom:1px solid #f3f4f6; padding-bottom:.4rem; }
    .section { margin-bottom:1.75rem; }
    .summary-text { color:#4b5563; line-height:1.6; font-size:.95rem; }
    .skills-grid { display:flex; flex-wrap:wrap; gap:.5rem; }
    .skill-item { display:flex; align-items:center; gap:.4rem; background:#f8fafc; padding:.4rem .8rem; border-radius:8px; font-size:.82rem; }
    .cat { color:#9ca3af; font-size:.75rem; }
    .prof-dots { display:flex; gap:2px; }
    .dot { width:7px; height:7px; border-radius:50%; background:#e5e7eb; }
    .dot.filled { background:#4f46e5; }
    .yrs { color:#9ca3af; font-size:.75rem; }
    .exp-item, .proj-item, .edu-item { margin-bottom:1rem; font-size:.9rem; color:#374151; padding-bottom:.75rem; border-bottom:1px solid #f9fafb; }
    .exp-header, .proj-header { display:flex; align-items:center; gap:.25rem; flex-wrap:wrap; }
    .company { color:#6b7280; }
    .date { display:block; font-size:.8rem; color:#9ca3af; margin:.25rem 0; }
    .current-badge { background:#dcfce7; color:#166534; padding:.1rem .4rem; border-radius:4px; font-size:.72rem; font-weight:600; margin-left:.3rem; }
    .exp-desc, .proj-desc { margin:.35rem 0 .5rem; font-size:.85rem; color:#6b7280; line-height:1.5; }
    .tech-tags { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.4rem; }
    .tech-tag { padding:.15rem .5rem; background:#ede9fe; color:#6d28d9; border-radius:4px; font-size:.75rem; }
    .gh-link { font-size:.8rem; color:#4f46e5; text-decoration:none; margin-left:.5rem; }
    .edu-detail { font-weight:400; color:#6b7280; }
  `]
})
export class ProfileViewComponent implements OnInit {
  profile = signal<ProfileResponse | null>(null);
  loading = signal(true);

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.http.get<ApiResponse<ProfileResponse>>(`${environment.apiUrl}/profiles/${id}`).subscribe({
      next: res => { if (res.success) this.profile.set(res.data!); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
