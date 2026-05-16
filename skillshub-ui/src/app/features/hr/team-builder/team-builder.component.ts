import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, SearchResponse, SearchResultItem } from '../../../core/models/models';

interface TeamMember extends SearchResultItem { addedAt: number; }
interface SkillStat { name: string; members: string[]; }

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
          </svg>
        </div>
        <div>
          <h1>Team Builder</h1>
          <p>Search for employees and assemble a team. See combined skill coverage instantly.</p>
        </div>
      </div>

      <div class="layout">
        <!-- Left: search & results -->
        <div class="search-col">
          <div class="search-card">
            <div class="search-bar">
              <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
              <input [(ngModel)]="query" placeholder="Search by skill, role, or name..."
                     class="search-input" (keyup.enter)="search()" />
              @if (searching()) { <span class="search-spinner"></span> }
              @else if (query.trim()) {
                <button class="clear-btn" (click)="query=''; results.set([])">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </button>
              }
              <button class="btn-search" (click)="search()" [disabled]="!query.trim() || searching()">Search</button>
            </div>
          </div>

          @if (results().length > 0) {
            <div class="results-list">
              @for (r of results(); track r.profileId) {
                <div class="result-card" [class.added]="isAdded(r.profileId)">
                  <div class="result-avatar">{{ r.fullName[0] }}</div>
                  <div class="result-info">
                    <span class="result-name">{{ r.fullName }}</span>
                    <span class="result-title">{{ r.currentTitle }}{{ r.department ? ' · ' + r.department : '' }}</span>
                    @if (r.topSkills.length > 0) {
                      <div class="result-skills">
                        @for (s of r.topSkills.slice(0,4); track s) {
                          <span class="skill-tag">{{ s }}</span>
                        }
                        @if (r.topSkills.length > 4) { <span class="skill-tag muted">+{{ r.topSkills.length - 4 }}</span> }
                      </div>
                    }
                  </div>
                  <div class="result-right">
                    <span class="score-badge" [class]="scoreClass(r.score)">{{ r.score.toFixed(0) }}%</span>
                    @if (!isAdded(r.profileId)) {
                      <button class="btn-add-member" (click)="addMember(r)">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/></svg>
                        Add
                      </button>
                    } @else {
                      <button class="btn-added" (click)="removeMember(r.profileId)">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                        Added
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right: team panel -->
        <div class="team-col">
          <div class="team-card">
            <div class="team-header">
              <h3>Team ({{ team().length }})</h3>
              @if (team().length > 0) {
                <button class="btn-clear-team" (click)="team.set([])">Clear all</button>
              }
            </div>

            @if (team().length === 0) {
              <div class="team-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
                </svg>
                <p>Add people from search results to build your team</p>
              </div>
            }

            @for (m of team(); track m.profileId) {
              <div class="team-member">
                <div class="member-avatar">{{ m.fullName[0] }}</div>
                <div class="member-info">
                  <span class="member-name">{{ m.fullName }}</span>
                  <span class="member-title">{{ m.currentTitle ?? '—' }}</span>
                </div>
                <button class="btn-remove-member" (click)="removeMember(m.profileId)" title="Remove">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </button>
              </div>
            }
          </div>

          <!-- Combined skills -->
          @if (combinedSkills().length > 0) {
            <div class="skills-card">
              <h3>Combined Skills ({{ combinedSkills().length }})</h3>
              <div class="combined-list">
                @for (s of combinedSkills().slice(0, 15); track s.name) {
                  <div class="combined-skill">
                    <span class="cs-name">{{ s.name }}</span>
                    <div class="cs-dots">
                      @for (m of s.members.slice(0,4); track m) {
                        <span class="cs-dot" [title]="m">{{ m[0] }}</span>
                      }
                      @if (s.members.length > 4) { <span class="cs-more">+{{ s.members.length - 4 }}</span> }
                    </div>
                  </div>
                }
                @if (combinedSkills().length > 15) {
                  <span class="skills-overflow">+{{ combinedSkills().length - 15 }} more skills</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width:1100px; margin:0 auto; padding:2rem 1.5rem; }
    .page-header { display:flex; align-items:flex-start; gap:1rem; margin-bottom:1.75rem; }
    .header-icon { width:48px; height:48px; background:linear-gradient(135deg,#0ea5e9,#0284c7); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; box-shadow:0 4px 12px rgba(14,165,233,.3); }
    .header-icon svg { width:24px; height:24px; }
    h1 { font-size:1.4rem; font-weight:700; color:#0f172a; margin:0 0 .25rem; }
    .page-header p { color:#64748b; font-size:.9rem; margin:0; }

    .layout { display:grid; grid-template-columns:1fr 320px; gap:1.25rem; align-items:start; }

    .search-card { background:white; border-radius:12px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,.06); border:1px solid #e2e8f0; margin-bottom:1rem; }
    .search-bar { display:flex; align-items:center; gap:.5rem; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:.4rem .5rem .4rem .75rem; }
    .search-bar:focus-within { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.08); background:white; }
    .search-icon { width:18px; height:18px; color:#94a3b8; flex-shrink:0; }
    .search-input { flex:1; border:none; background:none; font-size:.9rem; font-family:inherit; color:#0f172a; }
    .search-input:focus { outline:none; }
    .search-input::placeholder { color:#94a3b8; }
    .search-spinner { width:16px; height:16px; border:2px solid #e2e8f0; border-top-color:#4f46e5; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .clear-btn { background:none; border:none; cursor:pointer; color:#94a3b8; display:flex; padding:2px; }
    .clear-btn svg { width:16px; height:16px; }
    .clear-btn:hover { color:#64748b; }
    .btn-search { padding:.45rem 1rem; background:#4f46e5; color:white; border:none; border-radius:7px; font-size:.85rem; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; }
    .btn-search:disabled { opacity:.5; cursor:not-allowed; }

    .results-list { display:flex; flex-direction:column; gap:.5rem; }
    .result-card { display:flex; align-items:flex-start; gap:.875rem; background:white; border:1px solid #e2e8f0; border-radius:10px; padding:.875rem 1rem; transition:.15s; }
    .result-card.added { border-color:#4f46e5; background:#fafaff; }
    .result-avatar { width:40px; height:40px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:700; flex-shrink:0; }
    .result-info { flex:1; min-width:0; }
    .result-name { display:block; font-weight:600; font-size:.9rem; color:#0f172a; }
    .result-title { display:block; font-size:.8rem; color:#64748b; margin-top:.1rem; margin-bottom:.35rem; }
    .result-skills { display:flex; flex-wrap:wrap; gap:.25rem; }
    .skill-tag { font-size:.72rem; background:#f1f5f9; color:#475569; padding:.15rem .45rem; border-radius:4px; font-weight:500; }
    .skill-tag.muted { color:#94a3b8; background:#f8fafc; }
    .result-right { display:flex; flex-direction:column; align-items:flex-end; gap:.4rem; flex-shrink:0; }
    .score-badge { font-size:.75rem; font-weight:700; padding:.2rem .5rem; border-radius:5px; }
    .score-high { background:#dcfce7; color:#166534; }
    .score-mid { background:#fef9c3; color:#92400e; }
    .score-low { background:#fee2e2; color:#dc2626; }
    .btn-add-member { display:flex; align-items:center; gap:.3rem; padding:.35rem .65rem; background:#4f46e5; color:white; border:none; border-radius:7px; font-size:.78rem; font-weight:600; cursor:pointer; white-space:nowrap; }
    .btn-add-member svg { width:14px; height:14px; }
    .btn-added { display:flex; align-items:center; gap:.3rem; padding:.35rem .65rem; background:#dcfce7; color:#166534; border:1px solid #bbf7d0; border-radius:7px; font-size:.78rem; font-weight:600; cursor:pointer; white-space:nowrap; }
    .btn-added svg { width:14px; height:14px; }

    .team-card { background:white; border-radius:12px; padding:1.25rem; box-shadow:0 1px 3px rgba(0,0,0,.06); border:1px solid #e2e8f0; margin-bottom:1rem; }
    .team-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.875rem; }
    h3 { font-size:.9rem; font-weight:700; color:#0f172a; margin:0; }
    .btn-clear-team { font-size:.75rem; color:#94a3b8; background:none; border:none; cursor:pointer; padding:0; }
    .btn-clear-team:hover { color:#dc2626; }
    .team-empty { text-align:center; padding:1.5rem .5rem; color:#94a3b8; }
    .team-empty svg { width:40px; height:40px; margin:0 auto .5rem; display:block; }
    .team-empty p { font-size:.82rem; margin:0; }
    .team-member { display:flex; align-items:center; gap:.6rem; padding:.4rem 0; border-bottom:1px solid #f8fafc; }
    .team-member:last-child { border-bottom:none; }
    .member-avatar { width:32px; height:32px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; flex-shrink:0; }
    .member-info { flex:1; min-width:0; }
    .member-name { display:block; font-size:.85rem; font-weight:600; color:#0f172a; }
    .member-title { display:block; font-size:.72rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .btn-remove-member { background:none; border:none; cursor:pointer; color:#cbd5e1; display:flex; padding:2px; flex-shrink:0; }
    .btn-remove-member svg { width:14px; height:14px; }
    .btn-remove-member:hover { color:#dc2626; }

    .skills-card { background:white; border-radius:12px; padding:1.25rem; box-shadow:0 1px 3px rgba(0,0,0,.06); border:1px solid #e2e8f0; }
    .skills-card h3 { margin-bottom:.875rem; }
    .combined-list { display:flex; flex-direction:column; gap:.3rem; }
    .combined-skill { display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.3rem 0; border-bottom:1px solid #f8fafc; }
    .combined-skill:last-child { border-bottom:none; }
    .cs-name { font-size:.82rem; font-weight:500; color:#374151; }
    .cs-dots { display:flex; gap:2px; }
    .cs-dot { width:20px; height:20px; border-radius:50%; background:#4f46e5; color:white; display:flex; align-items:center; justify-content:center; font-size:.6rem; font-weight:700; }
    .cs-more { font-size:.7rem; color:#94a3b8; align-self:center; }
    .skills-overflow { font-size:.78rem; color:#94a3b8; margin-top:.25rem; display:block; }
  `]
})
export class TeamBuilderComponent {
  query = '';
  searching = signal(false);
  results = signal<SearchResultItem[]>([]);
  team = signal<TeamMember[]>([]);

  combinedSkills = computed((): SkillStat[] => {
    const members = this.team();
    if (!members.length) return [];
    const map = new Map<string, string[]>();
    members.forEach(m => {
      m.topSkills.forEach(skill => {
        if (!map.has(skill)) map.set(skill, []);
        map.get(skill)!.push(m.fullName);
      });
    });
    return Array.from(map.entries())
      .map(([name, memberList]) => ({ name, members: memberList }))
      .sort((a, b) => b.members.length - a.members.length);
  });

  constructor(private http: HttpClient) {}

  search() {
    const q = this.query.trim();
    if (!q) return;
    this.searching.set(true);
    this.http.post<ApiResponse<SearchResponse>>(`${environment.apiUrl}/search`, { query: q, topK: 10 }).subscribe({
      next: res => { this.results.set(res.data?.results ?? []); this.searching.set(false); },
      error: () => this.searching.set(false)
    });
  }

  isAdded(profileId: string): boolean {
    return this.team().some(m => m.profileId === profileId);
  }

  addMember(r: SearchResultItem) {
    if (this.isAdded(r.profileId)) return;
    this.team.update(list => [...list, { ...r, addedAt: Date.now() }]);
  }

  removeMember(profileId: string) {
    this.team.update(list => list.filter(m => m.profileId !== profileId));
  }

  scoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-mid';
    return 'score-low';
  }
}
