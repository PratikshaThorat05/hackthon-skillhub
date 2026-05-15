import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, HRStats } from '../../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>HR Dashboard</h2>
        <p>Organization talent overview</p>
      </div>
      @if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-num">{{ stats()!.totalProfiles }}</div>
            <div class="stat-label">Total Profiles</div>
          </div>
          <div class="stat-card pending">
            <div class="stat-icon">⏳</div>
            <div class="stat-num">{{ stats()!.pendingCount }}</div>
            <div class="stat-label">Pending Review</div>
          </div>
          <div class="stat-card approved">
            <div class="stat-icon">✅</div>
            <div class="stat-num">{{ stats()!.approvedCount }}</div>
            <div class="stat-label">Approved</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📄</div>
            <div class="stat-num">{{ stats()!.totalResumes }}</div>
            <div class="stat-label">Resumes Uploaded</div>
          </div>
        </div>
        <div class="skills-section">
          <h3>Top Skills in Organization</h3>
          @for (s of stats()!.topSkills; track s.skillName) {
            <div class="skill-bar-row">
              <span class="skill-name">{{ s.skillName }}</span>
              <div class="bar-wrap">
                <div class="bar" [style.width.%]="(s.employeeCount / stats()!.totalProfiles) * 100 || 10"></div>
              </div>
              <span class="count">{{ s.employeeCount }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:900px; margin:0 auto; padding:2rem 1.5rem; }
    .page-header { margin-bottom:2rem; }
    h2 { font-size:1.5rem; font-weight:700; color:#0f172a; margin:0 0 .25rem; }
    .page-header p { color:#64748b; font-size:.9rem; margin:0; }
    h3 { font-size:.8rem; font-weight:700; color:#64748b; margin:0 0 1rem; text-transform:uppercase; letter-spacing:.06em; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:white; border-radius:12px; padding:1.25rem 1.5rem; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .stat-icon { font-size:1.25rem; margin-bottom:.5rem; }
    .stat-num { font-size:2rem; font-weight:700; color:#0f172a; line-height:1; }
    .stat-label { font-size:.78rem; color:#64748b; margin-top:.35rem; font-weight:500; }
    .stat-card.pending .stat-num { color:#d97706; }
    .stat-card.approved .stat-num { color:#059669; }
    .skills-section { background:white; border-radius:12px; padding:1.5rem; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .skill-bar-row { display:flex; align-items:center; gap:1rem; margin-bottom:.85rem; }
    .skill-bar-row:last-child { margin-bottom:0; }
    .skill-name { width:130px; font-size:.85rem; color:#374151; flex-shrink:0; font-weight:500; }
    .bar-wrap { flex:1; background:#f1f5f9; border-radius:9999px; height:7px; overflow:hidden; }
    .bar { background:linear-gradient(90deg, #6366f1, #4f46e5); border-radius:9999px; height:7px; min-width:4px; transition:.8s ease; }
    .count { font-size:.8rem; color:#94a3b8; width:28px; text-align:right; font-weight:600; }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<HRStats | null>(null);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ApiResponse<HRStats>>(`${environment.apiUrl}/hr/stats`).subscribe({
      next: res => { if (res.success) this.stats.set(res.data!); }
    });
  }
}
