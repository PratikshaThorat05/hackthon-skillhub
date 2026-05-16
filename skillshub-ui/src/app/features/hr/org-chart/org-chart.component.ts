import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ProfileSummary, PagedResponse, HRStats } from '../../../core/models/models';

interface DeptNode {
  name: string;
  employees: ProfileSummary[];
  topTitles: string[];
  color: string;
  lightColor: string;
  borderColor: string;
}

const DEPT_COLORS: Record<string, [string, string, string]> = {
  'Engineering':      ['#4f46e5', '#ede9fe', '#a5b4fc'],
  'Architecture':     ['#7c3aed', '#f5f3ff', '#c4b5fd'],
  'DevOps':           ['#0284c7', '#e0f2fe', '#7dd3fc'],
  'Data & Analytics': ['#059669', '#d1fae5', '#6ee7b7'],
  'QA & Testing':     ['#d97706', '#fef3c7', '#fcd34d'],
  'Design':           ['#db2777', '#fce7f3', '#f9a8d4'],
  'Product':          ['#0891b2', '#cffafe', '#67e8f9'],
  'Human Resources':  ['#16a34a', '#dcfce7', '#86efac'],
  'Finance':          ['#b45309', '#fef9c3', '#fde68a'],
  'Leadership':       ['#0f172a', '#f1f5f9', '#94a3b8'],
  'Other':            ['#64748b', '#f8fafc', '#cbd5e1'],
};

const TITLE_DEPT_MAP: [RegExp, string][] = [
  [/architect/i,                          'Architecture'],
  [/devops|sre|infrastructure|platform|cloud|kubernetes|k8s/i, 'DevOps'],
  [/data\s*(sci|engin|analy)|ml\s*engin|machine\s*learn|ai\s*engin|analytics/i, 'Data & Analytics'],
  [/qa|quality|test\s*engin|sdet/i,       'QA & Testing'],
  [/design|ux|ui\s*engin|front.?end\s*de/i, 'Design'],
  [/product\s*(manager|owner|lead)/i,     'Product'],
  [/hr\b|human\s*res|recruiter|talent\s*acq|people\s*op/i, 'Human Resources'],
  [/financ|accountant|controller/i,       'Finance'],
  [/cto|ceo|vp\s*(of\s*)?engin|director|head\s*of|vice\s*pres/i, 'Leadership'],
  [/software|developer|engineer|programmer|full.?stack|back.?end|front.?end|react|angular|node|java|python/i, 'Engineering'],
];

function inferDept(profile: { department?: string; currentTitle?: string }): string {
  const dept = profile.department?.trim();
  if (dept && dept.toLowerCase() !== 'unassigned') return dept;
  const title = profile.currentTitle ?? '';
  for (const [re, d] of TITLE_DEPT_MAP) {
    if (re.test(title)) return d;
  }
  return title ? 'Engineering' : 'Other';
}

function deptColor(name: string): [string, string, string] {
  if (DEPT_COLORS[name]) return DEPT_COLORS[name];
  const keys = Object.keys(DEPT_COLORS);
  const idx = name.charCodeAt(0) % (keys.length - 1);
  return DEPT_COLORS[keys[idx]];
}

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
          </svg>
        </div>
        <div>
          <h1>Organisation Chart</h1>
          <p>Visual breakdown of your talent pool by department with skill coverage at a glance.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-wrap">
          <div class="skel skel-top"></div>
          <div class="skel-row">
            @for (i of [1,2,3,4]; track i) { <div class="skel skel-card"></div> }
          </div>
        </div>
      }

      @if (!loading() && depts().length > 0) {
        <!-- Company root node -->
        <div class="tree">
          <div class="company-node">
            <div class="company-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
              </svg>
            </div>
            <div class="company-info">
              <span class="company-name">SkillsHub Inc.</span>
              <div class="company-stats">
                <span class="stat-pill">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 100-6 3 3 0 000 6z"/></svg>
                  {{ totalEmployees() }} employees
                </span>
                <span class="stat-pill">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 1.5A1.5 1.5 0 0 1 10 0h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h6c-.314.418-.5.937-.5 1.5v7.793L4.854 6.646a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l3.5-3.5a.5.5 0 0 0-.708-.708L8.5 9.293V1.5z"/></svg>
                  {{ depts().length }} departments
                </span>
                <span class="stat-pill">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                  {{ totalSkillSlots() }} skill entries
                </span>
              </div>
            </div>
          </div>

          <!-- Connector stem -->
          <div class="stem"></div>

          <!-- Horizontal bar -->
          <div class="branch-bar"></div>

          <!-- Department nodes -->
          <div class="dept-row">
            @for (dept of depts(); track dept.name) {
              <div class="dept-col">
                <div class="branch-drop"></div>
                <div class="dept-card" [style.border-color]="dept.borderColor">
                  <div class="dept-header" [style.background]="dept.lightColor">
                    <span class="dept-dot" [style.background]="dept.color"></span>
                    <span class="dept-name">{{ dept.name }}</span>
                    <span class="dept-count" [style.background]="dept.color">{{ dept.employees.length }}</span>
                  </div>

                  <!-- Avatar row -->
                  <div class="avatar-row">
                    @for (emp of dept.employees.slice(0, 5); track emp.id) {
                      <a class="emp-avatar" [routerLink]="['/hr/profile', emp.id]"
                         [title]="emp.fullName" [style.background]="dept.color">
                        {{ emp.fullName[0].toUpperCase() }}
                      </a>
                    }
                    @if (dept.employees.length > 5) {
                      <span class="emp-more" [style.color]="dept.color">+{{ dept.employees.length - 5 }}</span>
                    }
                  </div>

                  <!-- Avg skills bar -->
                  <div class="skills-section">
                    <div class="skills-label-row">
                      <span class="skills-label">Avg skills / person</span>
                      <span class="skills-num" [style.color]="dept.color">{{ avgSkills(dept) }}</span>
                    </div>
                    <div class="skills-bar-track">
                      <div class="skills-bar-fill"
                           [style.width]="skillBarPct(dept) + '%'"
                           [style.background]="dept.color"></div>
                    </div>
                  </div>

                  <!-- Top titles -->
                  @if (dept.topTitles.length > 0) {
                    <div class="title-tags">
                      @for (t of dept.topTitles.slice(0, 3); track t) {
                        <span class="title-tag" [style.color]="dept.color" [style.border-color]="dept.borderColor" [style.background]="dept.lightColor">{{ t }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Employee list per dept -->
        <div class="detail-section">
          <h2>Department Breakdown</h2>
          <div class="detail-grid">
            @for (dept of depts(); track dept.name) {
              <div class="detail-card" [style.border-top-color]="dept.color">
                <div class="detail-header">
                  <span class="detail-dot" [style.background]="dept.color"></span>
                  <span class="detail-dept">{{ dept.name }}</span>
                  <span class="detail-badge" [style.background]="dept.lightColor" [style.color]="dept.color">{{ dept.employees.length }} people</span>
                </div>
                <div class="emp-list">
                  @for (emp of dept.employees; track emp.id) {
                    <a class="emp-row" [routerLink]="['/hr/profile', emp.id]">
                      <span class="emp-av" [style.background]="dept.color">{{ emp.fullName[0].toUpperCase() }}</span>
                      <div class="emp-info">
                        <span class="emp-name">{{ emp.fullName }}</span>
                        <span class="emp-title">{{ emp.currentTitle ?? '—' }}</span>
                      </div>
                      <span class="emp-skills">{{ emp.skillCount }} skills</span>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (!loading() && depts().length === 0) {
        <div class="empty">No approved profiles yet. Upload and approve some profiles to see the org chart.</div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:1100px; margin:0 auto; padding:2rem 1.5rem; }
    .page-header { display:flex; align-items:flex-start; gap:1rem; margin-bottom:2rem; }
    .header-icon { width:48px; height:48px; background:linear-gradient(135deg,#0f172a,#1e1b4b); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; box-shadow:0 4px 12px rgba(15,23,42,.3); }
    .header-icon svg { width:24px; height:24px; }
    h1 { font-size:1.4rem; font-weight:700; color:#0f172a; margin:0 0 .25rem; }
    .page-header p { color:#64748b; font-size:.9rem; margin:0; }

    /* Skeleton */
    .skeleton-wrap { display:flex; flex-direction:column; align-items:center; gap:2rem; }
    .skel { background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:12px; }
    @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
    .skel-top { width:360px; height:100px; }
    .skel-row { display:flex; gap:1rem; justify-content:center; }
    .skel-card { width:200px; height:180px; }

    /* Tree layout */
    .tree { display:flex; flex-direction:column; align-items:center; margin-bottom:3rem; }

    /* Company node */
    .company-node { display:flex; align-items:center; gap:1.25rem; background:white; border:2px solid #e2e8f0; border-radius:16px; padding:1.25rem 1.75rem; box-shadow:0 4px 20px rgba(0,0,0,.08); min-width:340px; }
    .company-logo { width:52px; height:52px; background:linear-gradient(135deg,#0f172a,#4f46e5); border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; }
    .company-logo svg { width:28px; height:28px; }
    .company-name { display:block; font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:.4rem; }
    .company-stats { display:flex; gap:.4rem; flex-wrap:wrap; }
    .stat-pill { display:flex; align-items:center; gap:.3rem; font-size:.72rem; font-weight:600; background:#f8fafc; border:1px solid #e2e8f0; color:#475569; padding:.2rem .5rem; border-radius:9999px; }
    .stat-pill svg { width:11px; height:11px; }

    /* Connectors */
    .stem { width:2px; height:36px; background:linear-gradient(to bottom, #4f46e5, #cbd5e1); }
    .branch-bar { height:2px; background:#cbd5e1; align-self:stretch; margin:0 4rem; border-radius:1px; }
    .dept-row { display:flex; gap:0; justify-content:center; align-items:flex-start; width:100%; }
    .dept-col { display:flex; flex-direction:column; align-items:center; flex:1; max-width:220px; padding:0 .5rem; }
    .branch-drop { width:2px; height:28px; background:#cbd5e1; }

    /* Department card */
    .dept-card { width:100%; background:white; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:transform .2s, box-shadow .2s; }
    .dept-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.1); }
    .dept-header { display:flex; align-items:center; gap:.5rem; padding:.65rem .875rem; }
    .dept-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .dept-name { flex:1; font-size:.875rem; font-weight:700; color:#0f172a; }
    .dept-count { font-size:.72rem; font-weight:800; color:white; padding:.15rem .45rem; border-radius:9999px; }

    .avatar-row { display:flex; align-items:center; gap:-.2rem; padding:.5rem .875rem; gap:.2rem; }
    .emp-avatar { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:700; color:white; text-decoration:none; border:2px solid white; transition:.15s; flex-shrink:0; }
    .emp-avatar:hover { transform:scale(1.15); z-index:1; }
    .emp-more { font-size:.72rem; font-weight:600; color:#64748b; margin-left:.25rem; }

    .skills-section { padding:.5rem .875rem .75rem; }
    .skills-label-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:.3rem; }
    .skills-label { font-size:.7rem; color:#94a3b8; font-weight:500; }
    .skills-num { font-size:.78rem; font-weight:800; }
    .skills-bar-track { height:5px; background:#f1f5f9; border-radius:9999px; overflow:hidden; }
    .skills-bar-fill { height:100%; border-radius:9999px; transition:width .6s ease; }

    .title-tags { display:flex; flex-wrap:wrap; gap:.3rem; padding:0 .875rem .75rem; }
    .title-tag { font-size:.65rem; font-weight:600; padding:.2rem .45rem; border-radius:5px; border:1px solid; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis; }

    /* Detail section */
    .detail-section { margin-top:1rem; }
    h2 { font-size:1rem; font-weight:700; color:#0f172a; margin:0 0 1rem; }
    .detail-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem; }
    .detail-card { background:white; border:1px solid #e2e8f0; border-top:3px solid; border-radius:10px; overflow:hidden; }
    .detail-header { display:flex; align-items:center; gap:.5rem; padding:.75rem 1rem; border-bottom:1px solid #f3f4f6; }
    .detail-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .detail-dept { flex:1; font-size:.875rem; font-weight:700; color:#0f172a; }
    .detail-badge { font-size:.72rem; font-weight:700; padding:.2rem .5rem; border-radius:9999px; }
    .emp-list { display:flex; flex-direction:column; }
    .emp-row { display:flex; align-items:center; gap:.6rem; padding:.5rem 1rem; text-decoration:none; transition:.1s; border-bottom:1px solid #f8fafc; }
    .emp-row:last-child { border-bottom:none; }
    .emp-row:hover { background:#f8fafc; }
    .emp-av { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; color:white; flex-shrink:0; }
    .emp-info { flex:1; min-width:0; }
    .emp-name { display:block; font-size:.82rem; font-weight:600; color:#0f172a; }
    .emp-title { display:block; font-size:.72rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .emp-skills { font-size:.72rem; font-weight:600; color:#94a3b8; white-space:nowrap; }

    .empty { text-align:center; color:#94a3b8; padding:4rem 2rem; font-size:.9rem; background:white; border-radius:12px; border:1px solid #e2e8f0; }
  `]
})
export class OrgChartComponent implements OnInit {
  loading = signal(true);
  allProfiles = signal<ProfileSummary[]>([]);

  depts = computed((): DeptNode[] => {
    const profiles = this.allProfiles();
    const map = new Map<string, ProfileSummary[]>();
    profiles.forEach(p => {
      const key = inferDept(p);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name, emps]) => {
        const [color, lightColor, borderColor] = deptColor(name);
        const titleCounts = new Map<string, number>();
        emps.forEach(e => { if (e.currentTitle) titleCounts.set(e.currentTitle, (titleCounts.get(e.currentTitle) ?? 0) + 1); });
        const topTitles = Array.from(titleCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
        return { name, employees: emps, topTitles, color, lightColor, borderColor };
      });
  });

  totalEmployees = computed(() => this.allProfiles().length);
  totalSkillSlots = computed(() => this.allProfiles().reduce((sum, p) => sum + (p.skillCount ?? 0), 0));

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ApiResponse<PagedResponse<ProfileSummary>>>(`${environment.apiUrl}/hr/profiles?status=Approved&pageSize=200`).subscribe({
      next: res => { this.allProfiles.set(res.data?.items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  avgSkills(dept: DeptNode): string {
    if (!dept.employees.length) return '0';
    const avg = dept.employees.reduce((s, e) => s + (e.skillCount ?? 0), 0) / dept.employees.length;
    return avg.toFixed(1);
  }

  skillBarPct(dept: DeptNode): number {
    const avg = dept.employees.reduce((s, e) => s + (e.skillCount ?? 0), 0) / (dept.employees.length || 1);
    return Math.min(100, (avg / 20) * 100);
  }
}
