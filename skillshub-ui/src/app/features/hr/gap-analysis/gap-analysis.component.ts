import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, SearchResponse } from '../../../core/models/models';

interface RequiredSkill { name: string; minLevel: number; }
interface SkillCoverage {
  skill: RequiredSkill;
  matchCount: number;
  topMatches: { name: string; title: string; score: number }[];
  loading: boolean;
}

@Component({
  selector: 'app-gap-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
          </svg>
        </div>
        <div>
          <h1>Skill Gap Analysis</h1>
          <p>Define required skills for a role or project and see how your team measures up.</p>
        </div>
      </div>

      <!-- Role Setup -->
      <div class="setup-card">
        <div class="setup-row">
          <div class="field-group">
            <label>Role / Project Name</label>
            <input [(ngModel)]="roleName" placeholder="e.g. Senior Full-Stack Engineer" class="role-input" />
          </div>
        </div>

        <div class="skills-builder">
          <label class="builder-label">Required Skills</label>
          <div class="skill-input-row">
            <input [(ngModel)]="newSkillName" placeholder="Skill name (e.g. React, AWS, Python)"
                   class="skill-name-input" (keyup.enter)="addSkill()" />
            <select [(ngModel)]="newSkillLevel" class="level-select">
              <option [value]="1">Beginner+</option>
              <option [value]="2">Basic+</option>
              <option [value]="3">Intermediate+</option>
              <option [value]="4">Advanced+</option>
              <option [value]="5">Expert</option>
            </select>
            <button class="btn-add" (click)="addSkill()" [disabled]="!newSkillName.trim()">+ Add</button>
          </div>

          @if (requiredSkills().length > 0) {
            <div class="skill-chips">
              @for (s of requiredSkills(); track s.name) {
                <div class="skill-chip">
                  <span class="chip-name">{{ s.name }}</span>
                  <span class="chip-level" [class]="levelClass(s.minLevel)">{{ levelLabel(s.minLevel) }}+</span>
                  <button class="chip-remove" (click)="removeSkill(s.name)">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <button class="btn-analyze" (click)="analyze()"
                [disabled]="requiredSkills().length === 0 || analyzing()">
          @if (analyzing()) {
            <span class="btn-spinner"></span> Analyzing...
          } @else {
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.669 0-3.218.51-4.5 1.385V4.804z"/></svg>
            Analyze Gap
          }
        </button>
      </div>

      <!-- Results -->
      @if (coverage().length > 0) {
        <div class="results-section">
          <!-- Summary banner -->
          <div class="summary-banner" [class.good]="coverageScore() >= 70" [class.warn]="coverageScore() >= 40 && coverageScore() < 70" [class.bad]="coverageScore() < 40">
            <div class="summary-left">
              <span class="summary-title">{{ roleName || 'Role' }} Coverage</span>
              <span class="summary-sub">{{ goodCoverage() }} of {{ coverage().length }} skills have sufficient employee coverage</span>
            </div>
            <div class="summary-score">{{ coverageScore() }}%</div>
          </div>

          <!-- Per-skill breakdown -->
          @for (c of coverage(); track c.skill.name) {
            <div class="skill-row">
              <div class="skill-meta">
                <span class="skill-name">{{ c.skill.name }}</span>
                <span class="skill-req-level" [class]="levelClass(c.skill.minLevel)">{{ levelLabel(c.skill.minLevel) }}+ required</span>
              </div>

              @if (c.loading) {
                <div class="row-skeleton"></div>
              } @else {
                <div class="skill-coverage">
                  <div class="coverage-bar-wrap">
                    <div class="coverage-bar" [style.width]="barPct(c.matchCount) + '%'"
                         [class.green]="c.matchCount >= 3" [class.amber]="c.matchCount === 2 || c.matchCount === 1" [class.red]="c.matchCount === 0"></div>
                  </div>
                  <span class="match-count" [class.zero]="c.matchCount === 0">
                    {{ c.matchCount }} employee{{ c.matchCount !== 1 ? 's' : '' }}
                  </span>
                  @if (c.matchCount === 0) {
                    <span class="gap-tag">GAP</span>
                  }
                </div>

                @if (c.topMatches.length > 0) {
                  <div class="top-matches">
                    @for (m of c.topMatches.slice(0,3); track m.name) {
                      <div class="match-chip">
                        <span class="match-avatar">{{ m.name[0] }}</span>
                        <span class="match-name">{{ m.name }}</span>
                        <span class="match-score">{{ m.score.toFixed(0) }}%</span>
                      </div>
                    }
                    @if (c.topMatches.length > 3) {
                      <span class="more-matches">+{{ c.topMatches.length - 3 }} more</span>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:800px; margin:0 auto; padding:2rem 1.5rem; }
    .page-header { display:flex; align-items:flex-start; gap:1rem; margin-bottom:1.75rem; }
    .header-icon { width:48px; height:48px; background:linear-gradient(135deg,#4f46e5,#7c3aed); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; box-shadow:0 4px 12px rgba(79,70,229,.3); }
    .header-icon svg { width:24px; height:24px; }
    h1 { font-size:1.4rem; font-weight:700; color:#0f172a; margin:0 0 .25rem; }
    .page-header p { color:#64748b; font-size:.9rem; margin:0; }

    .setup-card { background:white; border-radius:12px; padding:1.75rem; box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 12px rgba(0,0,0,.04); border:1px solid #e2e8f0; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
    .setup-row { display:flex; gap:1rem; }
    .field-group { flex:1; display:flex; flex-direction:column; gap:.35rem; }
    .field-group label { font-size:.8rem; font-weight:600; color:#374151; }
    .role-input { width:100%; padding:.65rem .9rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:.9rem; font-family:inherit; box-sizing:border-box; }
    .role-input:focus { outline:none; border-color:#4f46e5; }

    .builder-label { font-size:.8rem; font-weight:600; color:#374151; display:block; margin-bottom:.5rem; }
    .skill-input-row { display:flex; gap:.5rem; }
    .skill-name-input { flex:1; padding:.6rem .9rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:.875rem; font-family:inherit; }
    .skill-name-input:focus { outline:none; border-color:#4f46e5; }
    .level-select { padding:.6rem .75rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:.85rem; font-family:inherit; color:#374151; }
    .level-select:focus { outline:none; border-color:#4f46e5; }
    .btn-add { padding:.6rem 1rem; background:#4f46e5; color:white; border:none; border-radius:8px; font-size:.85rem; font-weight:600; cursor:pointer; white-space:nowrap; font-family:inherit; }
    .btn-add:disabled { opacity:.5; cursor:not-allowed; }

    .skill-chips { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.6rem; }
    .skill-chip { display:flex; align-items:center; gap:.4rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.3rem .5rem .3rem .75rem; }
    .chip-name { font-size:.85rem; font-weight:500; color:#0f172a; }
    .chip-level { font-size:.7rem; font-weight:600; padding:.1rem .4rem; border-radius:4px; }
    .chip-remove { background:none; border:none; cursor:pointer; color:#94a3b8; padding:0; display:flex; line-height:1; }
    .chip-remove svg { width:14px; height:14px; }
    .chip-remove:hover { color:#dc2626; }

    .btn-analyze { align-self:flex-start; padding:.7rem 1.5rem; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border:none; border-radius:8px; font-size:.9rem; font-weight:600; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:.5rem; box-shadow:0 2px 8px rgba(79,70,229,.3); }
    .btn-analyze:hover:not(:disabled) { opacity:.9; }
    .btn-analyze:disabled { opacity:.6; cursor:not-allowed; }
    .btn-analyze svg { width:16px; height:16px; }
    .btn-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .results-section { display:flex; flex-direction:column; gap:.75rem; }
    .summary-banner { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-radius:10px; margin-bottom:.25rem; }
    .summary-banner.good { background:#f0fdf4; border:1px solid #bbf7d0; }
    .summary-banner.warn { background:#fffbeb; border:1px solid #fde68a; }
    .summary-banner.bad { background:#fef2f2; border:1px solid #fecaca; }
    .summary-title { display:block; font-weight:700; font-size:.95rem; color:#0f172a; }
    .summary-sub { display:block; font-size:.82rem; color:#64748b; margin-top:.15rem; }
    .summary-score { font-size:2rem; font-weight:800; color:#4f46e5; }

    .skill-row { background:white; border:1px solid #e2e8f0; border-radius:10px; padding:1rem 1.25rem; }
    .skill-meta { display:flex; align-items:center; gap:.6rem; margin-bottom:.75rem; }
    .skill-name { font-size:.95rem; font-weight:600; color:#0f172a; }
    .skill-req-level { font-size:.72rem; font-weight:600; padding:.2rem .5rem; border-radius:5px; }
    .row-skeleton { height:40px; background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:6px; }
    @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }

    .skill-coverage { display:flex; align-items:center; gap:.75rem; margin-bottom:.6rem; }
    .coverage-bar-wrap { flex:1; height:8px; background:#f1f5f9; border-radius:9999px; overflow:hidden; }
    .coverage-bar { height:100%; border-radius:9999px; transition:width .5s ease; min-width:4px; }
    .coverage-bar.green { background:#059669; }
    .coverage-bar.amber { background:#d97706; }
    .coverage-bar.red { background:#dc2626; }
    .match-count { font-size:.85rem; font-weight:600; color:#374151; white-space:nowrap; }
    .match-count.zero { color:#dc2626; }
    .gap-tag { font-size:.7rem; font-weight:800; color:white; background:#dc2626; padding:.2rem .5rem; border-radius:4px; letter-spacing:.04em; }

    .top-matches { display:flex; flex-wrap:wrap; gap:.4rem; }
    .match-chip { display:flex; align-items:center; gap:.4rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.25rem .5rem .25rem .35rem; }
    .match-avatar { width:22px; height:22px; background:#4f46e5; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.65rem; font-weight:700; flex-shrink:0; }
    .match-name { font-size:.78rem; font-weight:500; color:#374151; }
    .match-score { font-size:.72rem; color:#64748b; }
    .more-matches { font-size:.78rem; color:#94a3b8; padding:.25rem 0; align-self:center; }

    .level-beginner { background:#fef9c3; color:#92400e; }
    .level-basic { background:#fef3c7; color:#d97706; }
    .level-intermediate { background:#dbeafe; color:#1e40af; }
    .level-advanced { background:#dcfce7; color:#166534; }
    .level-expert { background:#ede9fe; color:#6d28d9; }
  `]
})
export class GapAnalysisComponent {
  roleName = '';
  newSkillName = '';
  newSkillLevel = 3;
  requiredSkills = signal<RequiredSkill[]>([]);
  coverage = signal<SkillCoverage[]>([]);
  analyzing = signal(false);

  goodCoverage = computed(() => this.coverage().filter(c => c.matchCount >= 2).length);
  coverageScore = computed(() => {
    const total = this.coverage().length;
    if (!total) return 0;
    return Math.round((this.goodCoverage() / total) * 100);
  });

  constructor(private http: HttpClient) {}

  addSkill() {
    const name = this.newSkillName.trim();
    if (!name) return;
    if (this.requiredSkills().some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    this.requiredSkills.update(list => [...list, { name, minLevel: this.newSkillLevel }]);
    this.newSkillName = '';
    this.newSkillLevel = 3;
  }

  removeSkill(name: string) {
    this.requiredSkills.update(list => list.filter(s => s.name !== name));
  }

  analyze() {
    const skills = this.requiredSkills();
    if (!skills.length) return;
    this.analyzing.set(true);
    const initial: SkillCoverage[] = skills.map(s => ({ skill: s, matchCount: 0, topMatches: [], loading: true }));
    this.coverage.set(initial);

    let completed = 0;
    skills.forEach((skill, idx) => {
      const query = `${skill.name} ${this.levelLabel(skill.minLevel)} level`;
      this.http.post<ApiResponse<SearchResponse>>(`${environment.apiUrl}/search`, { query, topK: 20 }).subscribe({
        next: res => {
          const results = res.data?.results ?? [];
          const qualified = results.filter(r => r.score >= 40);
          this.coverage.update(list => list.map((c, i) => i === idx ? {
            ...c,
            loading: false,
            matchCount: qualified.length,
            topMatches: qualified.slice(0, 5).map(r => ({ name: r.fullName, title: r.currentTitle ?? '', score: r.score }))
          } : c));
        },
        error: () => {
          this.coverage.update(list => list.map((c, i) => i === idx ? { ...c, loading: false } : c));
        },
        complete: () => {
          completed++;
          if (completed === skills.length) this.analyzing.set(false);
        }
      });
    });
  }

  barPct(count: number): number {
    const max = 10;
    return Math.min(100, (count / max) * 100);
  }

  levelLabel(level: number): string {
    return ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][level] ?? '';
  }

  levelClass(level: number): string {
    return ['', 'level-beginner', 'level-basic', 'level-intermediate', 'level-advanced', 'level-expert'][level] ?? '';
  }
}
