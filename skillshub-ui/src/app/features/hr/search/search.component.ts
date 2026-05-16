import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, SearchResponse, SearchResultItem } from '../../../core/models/models';

@Component({
  selector: 'app-hr-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <!-- Search Hero -->
      <div class="search-hero">
        <div class="hero-badge" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.121.025-.243.025-.368V10c0-1.83-1.115-3.399-2.71-4.069A1 1 0 008 7v3H6V7a1 1 0 00-1.315-.95C3.115 6.6 2 8.17 2 10v3.632c0 .125.01.247.025.368H2v2h16v-2h-.025z"/></svg>
          AI-Powered
        </div>
        <h1>Talent Search</h1>
        <p>Describe the ideal candidate in plain English — AI will find the best matches from your talent pool</p>

        <div class="search-bar-wrap" role="search">
          <label for="talent-search-input" class="sr-only">Search for talent</label>
          <div class="search-bar" [class.focused]="searchFocused">
            <span class="search-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
            </span>
            <input
              id="talent-search-input"
              [(ngModel)]="query"
              placeholder="e.g. Senior React developer with AWS experience…"
              (keyup.enter)="search()"
              (focus)="searchFocused=true"
              (blur)="searchFocused=false"
              class="search-input"
              [disabled]="loading()"
              autocomplete="off"
              aria-label="Describe the talent you are looking for"
            />
            @if (query) {
              <button class="clear-btn" (click)="query=''; results.set(null)" aria-label="Clear search">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
              </button>
            }
            <button
              (click)="search()"
              [disabled]="loading() || !query.trim()"
              class="btn-search"
              [attr.aria-busy]="loading()"
              aria-label="Search talent"
            >
              @if (loading()) {
                <span class="btn-spinner" aria-hidden="true"></span>
                Searching…
              } @else {
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
                Search
              }
            </button>
          </div>
        </div>

        <!-- Quick chips -->
        <div class="chips-row" role="list" aria-label="Quick search suggestions">
          @for (q of quickQueries; track q) {
            <button class="chip" (click)="query=q; search()" role="listitem" [attr.aria-label]="'Search: ' + q">{{ q }}</button>
          }
        </div>
      </div>

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="results-area" aria-busy="true" aria-label="Loading results">
          <div class="results-meta-skel">
            <div class="skel skel-meta"></div>
          </div>
          @for (i of [1,2,3]; track i) {
            <div class="result-card skeleton-card">
              <div class="result-header">
                <div class="skel skel-avatar"></div>
                <div style="flex:1">
                  <div class="skel skel-name"></div>
                  <div class="skel skel-title" style="margin-top:.4rem"></div>
                </div>
                <div class="skel skel-score"></div>
              </div>
              <div style="display:flex;gap:.5rem;margin:.75rem 0">
                <div class="skel skel-chip"></div>
                <div class="skel skel-chip"></div>
                <div class="skel skel-chip"></div>
              </div>
              <div class="skel skel-reasoning"></div>
            </div>
          }
        </div>
      }

      <!-- Results -->
      @if (!loading() && results()) {
        <div class="results-area">
          <div class="results-meta" role="status" aria-live="polite">
            <strong>{{ results()!.totalResults }}</strong> match{{ results()!.totalResults !== 1 ? 'es' : '' }} for
            <span class="query-text">"{{ results()!.query }}"</span>
          </div>

          @if (results()!.results.length === 0) {
            <div class="no-results" role="alert">
              <div class="no-results-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="#e2e8f0" stroke-width="2"/><path d="M22 32c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/><circle cx="28" cy="30" r="1.5" fill="#94a3b8"/><circle cx="36" cy="30" r="1.5" fill="#94a3b8"/><path d="M25 40s2 2 7 2 7-2 7-2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
              </div>
              <h3>No matches found</h3>
              <p>Try different keywords or a broader description</p>
            </div>
          }

          @for (item of results()!.results; track item.profileId; let i = $index) {
            <article class="result-card" [attr.aria-label]="'Result ' + (i+1) + ': ' + item.fullName">
              <div class="result-header">
                <div class="rank-avatar" [class]="'rank-' + getRankClass(i)" aria-hidden="true">
                  {{ item.fullName[0].toUpperCase() }}
                </div>
                <div class="candidate-info">
                  <h2 class="candidate-name">{{ item.fullName }}</h2>
                  <p class="candidate-title">
                    {{ item.currentTitle }}
                    @if (item.department) { <span class="dept-sep" aria-hidden="true">·</span> {{ item.department }} }
                  </p>
                </div>
                <div class="score-block" [attr.aria-label]="item.score + '% match score'">
                  <span class="score-num" [class]="getScoreClass(item.score)">{{ item.score }}%</span>
                  <span class="score-label" aria-hidden="true">match</span>
                  <div class="score-bar-track" aria-hidden="true">
                    <div class="score-bar-fill" [class]="'bar-' + getScoreClass(item.score)" [style.width.%]="item.score"></div>
                  </div>
                </div>
              </div>

              <div class="skills-row" aria-label="Top skills">
                @for (skill of item.topSkills; track skill) {
                  <span class="skill-chip">{{ skill }}</span>
                }
                @if (item.yearsOfExperience) {
                  <span class="exp-chip">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                    {{ item.yearsOfExperience }}y exp
                  </span>
                }
              </div>

              @if (item.reasoning) {
                <div class="reasoning" role="note" aria-label="AI reasoning">
                  <span class="ai-tag" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.121.025-.243.025-.368V10c0-1.83-1.115-3.399-2.71-4.069A1 1 0 008 7v3H6V7a1 1 0 00-1.315-.95C3.115 6.6 2 8.17 2 10v3.632c0 .125.01.247.025.368H2v2h16v-2h-.025z"/></svg>
                    AI
                  </span>
                  {{ item.reasoning }}
                </div>
              }

              <div class="card-footer">
                <span class="rank-label" aria-hidden="true">#{{ i + 1 }} ranked match</span>
                <a [routerLink]="['/hr/profile', item.profileId]" class="view-btn" [attr.aria-label]="'View full profile for ' + item.fullName">
                  View Full Profile
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </a>
              </div>
            </article>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !results()) {
        <div class="empty-state" aria-label="Search prompt">
          <div class="empty-illustration" aria-hidden="true">
            <svg viewBox="0 0 120 80" fill="none">
              <rect x="10" y="20" width="100" height="50" rx="10" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1.5"/>
              <circle cx="40" cy="45" r="12" fill="#e0e7ff" stroke="#a5b4fc" stroke-width="1.5"/>
              <path d="M55 45h35M55 53h25" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
              <path d="M49 53l5 5" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
              <circle cx="77" cy="15" r="8" fill="#fef3c7" stroke="#fcd34d" stroke-width="1.5"/>
              <path d="M74 15h6M77 12v6" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h2>Find the right talent, fast</h2>
          <p>Type a role, required skills, or describe what you need — the AI understands natural language.</p>
          <div class="example-queries">
            <p class="example-label">Try asking for:</p>
            @for (q of quickQueries.slice(0,3); track q) {
              <button class="example-chip" (click)="query=q; search()" [attr.aria-label]="'Search for: ' + q">"{{ q }}"</button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }

    /* Hero */
    .search-hero { margin-bottom: 2rem; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: .3rem .75rem;
      background: linear-gradient(135deg, rgba(124,58,237,.1), rgba(79,70,229,.1));
      border: 1px solid rgba(99,102,241,.2);
      border-radius: 9999px;
      font-size: .72rem; font-weight: 700; color: #6366f1;
      margin-bottom: .875rem;
    }
    .hero-badge svg { width: 13px; height: 13px; }
    h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0 0 .4rem; letter-spacing: -.02em; }
    .search-hero > p { color: #64748b; font-size: .925rem; margin: 0 0 1.5rem; max-width: 520px; line-height: 1.55; }

    /* Search bar */
    .search-bar-wrap { margin-bottom: 1rem; }
    .search-bar {
      display: flex; align-items: center;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: .35rem .35rem .35rem .875rem;
      gap: .5rem;
      transition: border-color .15s, box-shadow .15s;
    }
    .search-bar.focused { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    .search-icon { color: #94a3b8; flex-shrink: 0; }
    .search-icon svg { width: 18px; height: 18px; display: block; }
    .search-input {
      flex: 1; border: none; outline: none; font-size: .95rem;
      font-family: inherit; color: #0f172a; background: transparent; min-width: 0;
      padding: .45rem 0;
    }
    .search-input::placeholder { color: #94a3b8; }
    .search-input:disabled { opacity: .6; }
    .clear-btn {
      width: 26px; height: 26px; border: none; background: #f1f5f9; border-radius: 50%;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #94a3b8; transition: all .15s; flex-shrink: 0;
    }
    .clear-btn:hover { background: #e2e8f0; color: #64748b; }
    .clear-btn svg { width: 14px; height: 14px; }
    .btn-search {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .65rem 1.25rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; border: none; border-radius: 10px;
      font-size: .875rem; font-weight: 600; cursor: pointer;
      white-space: nowrap; transition: opacity .15s, transform .1s;
      font-family: inherit; flex-shrink: 0;
    }
    .btn-search:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
    .btn-search:disabled { opacity: .55; cursor: not-allowed; transform: none; }
    .btn-search svg { width: 16px; height: 16px; }
    .btn-spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
      border-top-color: white; border-radius: 50%;
      animation: spin .7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Chips */
    .chips-row { display: flex; flex-wrap: wrap; gap: .4rem; }
    .chip {
      padding: .3rem .8rem; background: white; border: 1px solid #e2e8f0;
      border-radius: 9999px; font-size: .79rem; cursor: pointer;
      color: #475569; font-family: inherit; transition: all .15s;
    }
    .chip:hover { background: #ede9fe; border-color: #a5b4fc; color: #4f46e5; }

    /* Skeleton */
    .skel { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .skel-meta { height: 20px; width: 180px; margin-bottom: 1rem; }
    .skel-avatar { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; }
    .skel-name { height: 18px; width: 160px; }
    .skel-title { height: 14px; width: 220px; }
    .skel-score { width: 60px; height: 50px; border-radius: 10px; }
    .skel-chip { height: 24px; width: 72px; border-radius: 9999px; }
    .skel-reasoning { height: 52px; }
    .skeleton-card .result-header { align-items: flex-start; }

    /* Results */
    .results-area { display: flex; flex-direction: column; gap: 1rem; }
    .results-meta { font-size: .9rem; color: #64748b; margin-bottom: .25rem; }
    .results-meta strong { color: #0f172a; }
    .query-text { color: #4f46e5; font-style: italic; }
    .results-meta-skel { margin-bottom: .25rem; }

    /* Result card */
    .result-card {
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 14px; padding: 1.25rem 1.5rem;
      transition: all .15s;
    }
    .result-card:hover { border-color: #a5b4fc; box-shadow: 0 4px 20px rgba(79,70,229,.1); transform: translateY(-1px); }

    .result-header { display: flex; align-items: center; gap: 1rem; margin-bottom: .875rem; }
    .rank-avatar {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.1rem; flex-shrink: 0;
    }
    .rank-0 { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
    .rank-1 { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #475569; }
    .rank-2 { background: linear-gradient(135deg, #fed7aa, #fdba74); color: #9a3412; }
    .rank-other { background: linear-gradient(135deg, #ede9fe, #ddd6fe); color: #5b21b6; }

    .candidate-info { flex: 1; min-width: 0; }
    h2.candidate-name { margin: 0 0 .2rem; font-size: 1.05rem; font-weight: 700; color: #0f172a; }
    .candidate-title { margin: 0; font-size: .85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dept-sep { margin: 0 .25rem; opacity: .4; }

    .score-block { text-align: center; min-width: 64px; flex-shrink: 0; }
    .score-num { display: block; font-size: 1.5rem; font-weight: 800; line-height: 1; letter-spacing: -.02em; }
    .score-high   { color: #059669; }
    .score-medium { color: #d97706; }
    .score-low    { color: #dc2626; }
    .score-label { display: block; font-size: .65rem; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: .15rem 0 .35rem; }
    .score-bar-track { height: 4px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
    .score-bar-fill { height: 4px; border-radius: 9999px; transition: width .8s ease; }
    .bar-score-high   { background: #10b981; }
    .bar-score-medium { background: #f59e0b; }
    .bar-score-low    { background: #ef4444; }

    .skills-row { display: flex; flex-wrap: wrap; gap: .375rem; margin-bottom: .875rem; }
    .skill-chip {
      padding: .2rem .65rem; background: #f1f5f9; border-radius: 9999px;
      font-size: .78rem; color: #475569; font-weight: 500;
    }
    .exp-chip {
      display: inline-flex; align-items: center; gap: .25rem;
      padding: .2rem .65rem; background: #fef3c7; border-radius: 9999px;
      font-size: .78rem; color: #92400e; font-weight: 600;
    }
    .exp-chip svg { width: 11px; height: 11px; }

    .reasoning {
      display: flex; align-items: flex-start; gap: .625rem;
      background: #f5f3ff; border-left: 3px solid #8b5cf6;
      padding: .75rem 1rem; border-radius: 0 8px 8px 0;
      font-size: .85rem; color: #4c1d95; line-height: 1.55;
      margin-bottom: .875rem;
    }
    .ai-tag {
      display: inline-flex; align-items: center; gap: .25rem;
      background: #8b5cf6; color: white;
      padding: .15rem .45rem; border-radius: 4px;
      font-size: .68rem; font-weight: 700; flex-shrink: 0;
      margin-top: .05rem;
    }
    .ai-tag svg { width: 11px; height: 11px; }

    .card-footer { display: flex; align-items: center; justify-content: space-between; }
    .rank-label { font-size: .75rem; color: #94a3b8; font-weight: 500; }
    .view-btn {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: .5rem 1rem; background: #f5f3ff;
      color: #4f46e5; border-radius: 8px;
      font-size: .82rem; font-weight: 600; text-decoration: none;
      transition: all .15s;
    }
    .view-btn:hover { background: #ede9fe; }
    .view-btn svg { width: 14px; height: 14px; }

    /* No results */
    .no-results { text-align: center; padding: 3rem 2rem; }
    .no-results-icon { margin-bottom: 1rem; }
    .no-results-icon svg { width: 80px; height: 80px; }
    .no-results h3 { font-size: 1.1rem; font-weight: 700; color: #374151; margin: 0 0 .4rem; }
    .no-results p { color: #64748b; font-size: .9rem; margin: 0; }

    /* Empty state */
    .empty-state { text-align: center; padding: 3rem 2rem; }
    .empty-illustration { margin-bottom: 1.5rem; }
    .empty-illustration svg { width: 160px; height: 107px; }
    h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 .5rem; }
    .empty-state p { color: #64748b; font-size: .9rem; margin: 0 0 1.5rem; max-width: 380px; margin-left: auto; margin-right: auto; line-height: 1.55; }
    .example-queries { display: flex; flex-direction: column; align-items: center; gap: .5rem; }
    .example-label { font-size: .78rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 .25rem; }
    .example-chip {
      padding: .4rem 1rem; background: white; border: 1.5px solid #e2e8f0;
      border-radius: 9999px; font-size: .83rem; cursor: pointer;
      color: #374151; font-family: inherit; transition: all .15s;
      font-style: italic;
    }
    .example-chip:hover { background: #f5f3ff; border-color: #a5b4fc; color: #4f46e5; }
  `]
})
export class HrSearchComponent {
  query = '';
  searchFocused = false;
  loading = signal(false);
  results = signal<SearchResponse | null>(null);

  quickQueries = [
    'Senior React developer with TypeScript',
    'Backend engineer with Python and AWS',
    'Full stack developer with Node.js and SQL',
    'DevOps engineer with Kubernetes',
    'Machine learning engineer with Python'
  ];

  constructor(private http: HttpClient) {}

  search() {
    if (!this.query.trim()) return;
    this.loading.set(true);
    this.results.set(null);
    this.http.post<ApiResponse<SearchResponse>>(`${environment.apiUrl}/search`, { query: this.query, topK: 10 }).subscribe({
      next: res => { if (res.success) this.results.set(res.data!); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getRankClass(index: number): string {
    if (index === 0) return '0';
    if (index === 1) return '1';
    if (index === 2) return '2';
    return 'other';
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }
}
