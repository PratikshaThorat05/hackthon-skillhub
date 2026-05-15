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
      <h2>HR Dashboard</h2>
      @if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num">{{ stats()!.totalProfiles }}</div>
            <div class="stat-label">Total Profiles</div>
          </div>
          <div class="stat-card pending">
            <div class="stat-num">{{ stats()!.pendingCount }}</div>
            <div class="stat-label">Pending Review</div>
          </div>
          <div class="stat-card approved">
            <div class="stat-num">{{ stats()!.approvedCount }}</div>
            <div class="stat-label">Approved</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{{ stats()!.totalResumes }}</div>
            <div class="stat-label">Resumes Uploaded</div>
          </div>
        </div>
        <div class="section">
          <h3>Top Skills in Organization</h3>
          <div class="skills-list">
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
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:800px; margin:2rem auto; padding:0 1rem; }
    h2 { font-size:1.5rem; color:#1a1a2e; margin-bottom:1.5rem; }
    h3 { font-size:1rem; color:#374151; margin-bottom:1rem; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:white; border-radius:12px; padding:1.25rem; border:1.5px solid #e5e7eb; text-align:center; }
    .stat-card.pending { border-color:#fef9c3; background:#fffbeb; }
    .stat-card.approved { border-color:#dcfce7; background:#f0fdf4; }
    .stat-num { font-size:2rem; font-weight:700; color:#1a1a2e; }
    .stat-label { font-size:.8rem; color:#64748b; margin-top:.25rem; }
    .skills-list { background:white; border-radius:12px; padding:1.5rem; border:1.5px solid #e5e7eb; }
    .skill-bar-row { display:flex; align-items:center; gap:1rem; margin-bottom:.75rem; }
    .skill-name { width:120px; font-size:.85rem; color:#374151; flex-shrink:0; }
    .bar-wrap { flex:1; background:#f1f5f9; border-radius:9999px; height:8px; }
    .bar { background:#4f46e5; border-radius:9999px; height:8px; min-width:8px; transition:.5s; }
    .count { font-size:.8rem; color:#64748b; width:30px; text-align:right; }
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
