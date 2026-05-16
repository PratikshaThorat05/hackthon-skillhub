import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, HRStats } from '../../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-text">
          <h1>HR Dashboard</h1>
          <p>Organization-wide talent overview and insights</p>
        </div>
        <div class="header-actions">
          <a routerLink="/hr/upload" class="btn-primary" aria-label="Upload new resume">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            Upload Resume
          </a>
          <a routerLink="/hr/search" class="btn-secondary" aria-label="Search talent">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
            Search Talent
          </a>
        </div>
      </div>

      @if (!stats()) {
        <!-- Loading skeleton -->
        <div class="stats-grid" aria-busy="true" aria-label="Loading statistics">
          @for (i of [1,2,3,4]; track i) {
            <div class="stat-card skeleton-card">
              <div class="skel skel-icon"></div>
              <div class="skel skel-num"></div>
              <div class="skel skel-label"></div>
            </div>
          }
        </div>
        <div class="section-card skeleton-section">
          <div class="skel skel-heading"></div>
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skel skel-bar-row"></div>
          }
        </div>
      }

      @if (stats()) {
        <!-- KPI Cards -->
        <div class="stats-grid" role="list" aria-label="Key statistics">
          <div class="stat-card indigo" role="listitem">
            <div class="stat-top">
              <div class="stat-icon-wrap indigo-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
              </div>
              <span class="stat-trend neutral" aria-label="All employees">All</span>
            </div>
            <div class="stat-num" [attr.aria-label]="stats()!.totalProfiles + ' total profiles'">{{ stats()!.totalProfiles }}</div>
            <div class="stat-label">Total Profiles</div>
            <div class="stat-bar"><div class="stat-bar-fill indigo-fill" style="width:100%"></div></div>
          </div>

          <div class="stat-card amber" role="listitem">
            <div class="stat-top">
              <div class="stat-icon-wrap amber-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
              </div>
              @if (stats()!.totalProfiles > 0) {
                <span class="stat-trend amber-trend" [attr.aria-label]="pendingPct() + '% pending'">{{ pendingPct() }}%</span>
              }
            </div>
            <div class="stat-num amber-num" [attr.aria-label]="stats()!.pendingCount + ' pending review'">{{ stats()!.pendingCount }}</div>
            <div class="stat-label">Pending Review</div>
            <div class="stat-bar"><div class="stat-bar-fill amber-fill" [style.width.%]="pendingPct()"></div></div>
          </div>

          <div class="stat-card emerald" role="listitem">
            <div class="stat-top">
              <div class="stat-icon-wrap emerald-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              </div>
              @if (stats()!.totalProfiles > 0) {
                <span class="stat-trend emerald-trend" [attr.aria-label]="approvedPct() + '% approved'">{{ approvedPct() }}%</span>
              }
            </div>
            <div class="stat-num emerald-num" [attr.aria-label]="stats()!.approvedCount + ' approved'">{{ stats()!.approvedCount }}</div>
            <div class="stat-label">Approved</div>
            <div class="stat-bar"><div class="stat-bar-fill emerald-fill" [style.width.%]="approvedPct()"></div></div>
          </div>

          <div class="stat-card violet" role="listitem">
            <div class="stat-top">
              <div class="stat-icon-wrap violet-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>
              </div>
              <span class="stat-trend neutral" aria-label="Resumes uploaded">Docs</span>
            </div>
            <div class="stat-num violet-num" [attr.aria-label]="stats()!.totalResumes + ' resumes uploaded'">{{ stats()!.totalResumes }}</div>
            <div class="stat-label">Resumes Uploaded</div>
            <div class="stat-bar"><div class="stat-bar-fill violet-fill" style="width:100%"></div></div>
          </div>
        </div>

        <div class="bottom-grid">
          <!-- Top Skills -->
          <div class="section-card">
            <div class="section-header">
              <div>
                <h2 class="section-title">Top Skills</h2>
                <p class="section-sub">Most common skills across the organization</p>
              </div>
              <div class="ai-chip" aria-label="AI-powered insights">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.121.025-.243.025-.368V10c0-1.83-1.115-3.399-2.71-4.069A1 1 0 008 7v3H6V7a1 1 0 00-1.315-.95C3.115 6.6 2 8.17 2 10v3.632c0 .125.01.247.025.368H2v2h16v-2h-.025z"/></svg>
                AI Insights
              </div>
            </div>

            <div class="skills-list" role="list" aria-label="Top skills by employee count">
              @for (s of stats()!.topSkills; track s.skillName; let i = $index) {
                <div class="skill-row" role="listitem">
                  <div class="skill-rank" aria-hidden="true">{{ i + 1 }}</div>
                  <span class="skill-name">{{ s.skillName }}</span>
                  <div class="bar-track" role="progressbar" [attr.aria-valuenow]="s.employeeCount" [attr.aria-valuemax]="stats()!.totalProfiles" [attr.aria-label]="s.skillName + ': ' + s.employeeCount + ' employees'">
                    <div class="bar-fill" [style.width.%]="barWidth(s.employeeCount)"></div>
                  </div>
                  <span class="skill-count" aria-hidden="true">{{ s.employeeCount }}</span>
                </div>
              }
              @if (stats()!.topSkills.length === 0) {
                <p class="empty-skills">No skill data yet. Upload resumes to see insights.</p>
              }
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="section-card quick-actions-card">
            <div class="section-header">
              <div>
                <h2 class="section-title">Quick Actions</h2>
                <p class="section-sub">Common HR workflows</p>
              </div>
            </div>
            <div class="action-list" role="list">
              <a routerLink="/hr/profiles" [queryParams]="{status:'Pending'}" class="action-item" role="listitem" aria-label="Review pending profiles">
                <div class="action-icon amber-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                </div>
                <div class="action-text">
                  <strong>Review Pending</strong>
                  <span>{{ stats()!.pendingCount }} profile{{ stats()!.pendingCount !== 1 ? 's' : '' }} awaiting approval</span>
                </div>
                <svg class="action-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
              </a>
              <a routerLink="/hr/search" class="action-item" role="listitem" aria-label="Search talent with AI">
                <div class="action-icon indigo-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
                </div>
                <div class="action-text">
                  <strong>AI Talent Search</strong>
                  <span>Find candidates with natural language</span>
                </div>
                <svg class="action-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
              </a>
              <a routerLink="/hr/upload" class="action-item" role="listitem" aria-label="Upload a resume">
                <div class="action-icon emerald-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                </div>
                <div class="action-text">
                  <strong>Upload Resume</strong>
                  <span>Single or bulk employee import</span>
                </div>
                <svg class="action-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
              </a>
              <a routerLink="/hr/directory" class="action-item" role="listitem" aria-label="View employee directory">
                <div class="action-icon violet-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
                </div>
                <div class="action-text">
                  <strong>Employee Directory</strong>
                  <span>Browse all {{ stats()!.totalProfiles }} employee profiles</span>
                </div>
                <svg class="action-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }

    /* Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    h1 { font-size: 1.625rem; font-weight: 800; color: #0f172a; margin: 0 0 .25rem; letter-spacing: -.02em; }
    .page-header p { color: #64748b; font-size: .9rem; margin: 0; }
    .header-actions { display: flex; gap: .625rem; flex-shrink: 0; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .55rem 1.1rem; background: #4f46e5; color: white;
      border-radius: 8px; font-size: .82rem; font-weight: 600;
      text-decoration: none; transition: background .15s;
    }
    .btn-primary:hover { background: #4338ca; }
    .btn-primary svg { width: 14px; height: 14px; }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .55rem 1.1rem; background: white; color: #374151;
      border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: .82rem; font-weight: 600; text-decoration: none; transition: all .15s;
    }
    .btn-secondary:hover { border-color: #a5b4fc; color: #4f46e5; background: #f5f3ff; }
    .btn-secondary svg { width: 14px; height: 14px; }

    /* Skeleton */
    .skel { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .skeleton-card { padding: 1.25rem 1.5rem; }
    .skel-icon { width: 40px; height: 40px; border-radius: 10px; margin-bottom: .75rem; }
    .skel-num { width: 60px; height: 32px; margin-bottom: .5rem; }
    .skel-label { width: 100px; height: 14px; }
    .skeleton-section { padding: 1.5rem; margin-bottom: 1.5rem; }
    .skel-heading { width: 160px; height: 18px; margin-bottom: 1.25rem; }
    .skel-bar-row { height: 20px; margin-bottom: .85rem; }

    /* Stats grid */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }

    .stat-card {
      background: white;
      border-radius: 14px;
      padding: 1.25rem 1.375rem 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
      position: relative;
      overflow: hidden;
      transition: box-shadow .15s, transform .1s;
    }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }
    .stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: .875rem; }

    .stat-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-wrap svg { width: 20px; height: 20px; }
    .indigo-icon { background: rgba(99,102,241,.12); color: #4f46e5; }
    .amber-icon  { background: rgba(245,158,11,.12); color: #d97706; }
    .emerald-icon { background: rgba(16,185,129,.12); color: #059669; }
    .violet-icon { background: rgba(139,92,246,.12); color: #7c3aed; }

    .stat-trend {
      font-size: .72rem; font-weight: 700; padding: .15rem .5rem;
      border-radius: 9999px;
    }
    .neutral { background: #f1f5f9; color: #64748b; }
    .amber-trend { background: #fef3c7; color: #92400e; }
    .emerald-trend { background: #d1fae5; color: #065f46; }

    .stat-num { font-size: 2.25rem; font-weight: 800; line-height: 1; letter-spacing: -.02em; color: #0f172a; margin-bottom: .3rem; }
    .amber-num  { color: #d97706; }
    .emerald-num { color: #059669; }
    .violet-num { color: #7c3aed; }
    .stat-label { font-size: .78rem; font-weight: 500; color: #64748b; margin-bottom: .875rem; }

    .stat-bar { height: 3px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
    .stat-bar-fill { height: 3px; border-radius: 9999px; transition: width .8s ease; }
    .indigo-fill  { background: #6366f1; }
    .amber-fill   { background: #f59e0b; }
    .emerald-fill { background: #10b981; }
    .violet-fill  { background: #8b5cf6; }

    /* Bottom grid */
    .bottom-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.25rem; }
    @media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }

    .section-card {
      background: white; border-radius: 14px; padding: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .section-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; gap: .75rem; flex-wrap: wrap; }
    .section-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 .2rem; }
    .section-sub { font-size: .8rem; color: #64748b; margin: 0; }

    .ai-chip {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: .3rem .7rem;
      background: linear-gradient(135deg, rgba(124,58,237,.1), rgba(79,70,229,.1));
      border: 1px solid rgba(99,102,241,.2);
      border-radius: 9999px;
      font-size: .72rem; font-weight: 700; color: #6366f1;
      flex-shrink: 0;
    }
    .ai-chip svg { width: 13px; height: 13px; }

    /* Skills list */
    .skills-list { display: flex; flex-direction: column; gap: .6rem; }
    .skill-row { display: flex; align-items: center; gap: .75rem; }
    .skill-rank {
      width: 22px; height: 22px; background: #f1f5f9; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: .68rem; font-weight: 700; color: #94a3b8; flex-shrink: 0;
    }
    .skill-name { width: 120px; font-size: .84rem; color: #374151; font-weight: 500; flex-shrink: 0; }
    .bar-track { flex: 1; height: 8px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
    .bar-fill { height: 8px; background: linear-gradient(90deg, #6366f1, #818cf8); border-radius: 9999px; min-width: 4px; transition: width .8s ease; }
    .skill-count { width: 28px; font-size: .8rem; color: #64748b; font-weight: 600; text-align: right; flex-shrink: 0; }
    .empty-skills { font-size: .85rem; color: #94a3b8; text-align: center; padding: 1rem 0; margin: 0; }

    /* Quick actions */
    .quick-actions-card { display: flex; flex-direction: column; }
    .action-list { display: flex; flex-direction: column; gap: .4rem; }
    .action-item {
      display: flex; align-items: center; gap: .875rem;
      padding: .875rem 1rem; border-radius: 10px;
      border: 1px solid #f1f5f9; text-decoration: none;
      transition: all .15s; color: inherit;
    }
    .action-item:hover { background: #f8fafc; border-color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .action-icon {
      width: 36px; height: 36px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .action-icon svg { width: 17px; height: 17px; }
    .action-text { flex: 1; }
    .action-text strong { display: block; font-size: .85rem; font-weight: 600; color: #0f172a; margin-bottom: .1rem; }
    .action-text span { font-size: .78rem; color: #64748b; }
    .action-chevron { width: 16px; height: 16px; color: #cbd5e1; flex-shrink: 0; }
    .action-item:hover .action-chevron { color: #94a3b8; }
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

  pendingPct(): number {
    const s = this.stats();
    if (!s || s.totalProfiles === 0) return 0;
    return Math.round((s.pendingCount / s.totalProfiles) * 100);
  }

  approvedPct(): number {
    const s = this.stats();
    if (!s || s.totalProfiles === 0) return 0;
    return Math.round((s.approvedCount / s.totalProfiles) * 100);
  }

  barWidth(count: number): number {
    const s = this.stats();
    if (!s || s.totalProfiles === 0) return 10;
    return Math.max(4, Math.round((count / s.totalProfiles) * 100));
  }
}
