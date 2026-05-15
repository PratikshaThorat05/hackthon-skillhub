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
    <div class="search-page">
      <div class="search-header">
        <h1>Talent Search</h1>
        <p>Ask in natural language — AI finds the best matches</p>
        <div class="search-bar">
          <input [(ngModel)]="query" placeholder="e.g. Senior React developer with AWS experience in fintech"
                 (keyup.enter)="search()" class="search-input" />
          <button (click)="search()" [disabled]="loading() || !query.trim()" class="btn-search">
            {{ loading() ? 'Searching...' : '🔍 Search' }}
          </button>
        </div>
        <div class="quick-queries">
          @for (q of quickQueries; track q) {
            <button class="chip" (click)="query=q; search()">{{ q }}</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>AI is finding the best matches...</p>
        </div>
      }

      @if (results()) {
        <div class="results-section">
          <div class="results-meta">
            <strong>{{ results()!.totalResults }} matches</strong> for "{{ results()!.query }}"
          </div>
          @for (item of results()!.results; track item.profileId) {
            <div class="result-card">
              <div class="result-header">
                <div class="rank-badge">{{ item.rank }}</div>
                <div class="candidate-info">
                  <h3>{{ item.fullName }}</h3>
                  <p class="title">{{ item.currentTitle }}{{ item.department ? ' · ' + item.department : '' }}</p>
                </div>
                <div class="score-badge">
                  <span class="score">{{ item.score }}%</span>
                  <span class="score-label">match</span>
                </div>
              </div>

              <div class="skills-row">
                @for (skill of item.topSkills; track skill) {
                  <span class="skill-chip">{{ skill }}</span>
                }
                @if (item.yearsOfExperience) {
                  <span class="exp-chip">{{ item.yearsOfExperience }}y exp</span>
                }
              </div>

              @if (item.reasoning) {
                <div class="reasoning">
                  <span class="ai-badge">✨ AI</span>
                  {{ item.reasoning }}
                </div>
              }
              <div class="card-footer">
                <a [routerLink]="['/hr/profile', item.profileId]" class="view-btn">View Full Profile →</a>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && !results()) {
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Start searching for talent</h3>
          <p>Use natural language to find the right candidates for any role</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .search-page { max-width:900px; margin:0 auto; padding:2rem; }
    .search-header { margin-bottom:2rem; }
    h1 { font-size:2rem; font-weight:700; color:#1a1a2e; margin-bottom:.25rem; }
    .search-header > p { color:#666; margin-bottom:1.25rem; }
    .search-bar { display:flex; gap:.75rem; }
    .search-input { flex:1; padding:.85rem 1.25rem; border:2px solid #e5e7eb; border-radius:12px; font-size:1rem; }
    .search-input:focus { outline:none; border-color:#4f46e5; }
    .btn-search { padding:.85rem 1.75rem; background:#4f46e5; color:white; border:none; border-radius:12px; font-size:1rem; font-weight:600; cursor:pointer; white-space:nowrap; }
    .btn-search:disabled { opacity:.6; cursor:not-allowed; }
    .quick-queries { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:1rem; }
    .chip { padding:.35rem .85rem; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:9999px; font-size:.8rem; cursor:pointer; color:#475569; }
    .chip:hover { background:#e0e7ff; border-color:#a5b4fc; color:#4f46e5; }
    .loading-state { text-align:center; padding:3rem; color:#666; }
    .spinner { width:40px; height:40px; border:3px solid #e5e7eb; border-top-color:#4f46e5; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto 1rem; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .results-meta { color:#666; font-size:.9rem; margin-bottom:1rem; }
    .result-card { background:white; border:1.5px solid #e5e7eb; border-radius:12px; padding:1.25rem 1.5rem; margin-bottom:1rem; transition:.2s; }
    .result-card:hover { border-color:#a5b4fc; box-shadow:0 4px 16px rgba(79,70,229,.08); }
    .result-header { display:flex; align-items:center; gap:1rem; margin-bottom:.75rem; }
    .rank-badge { width:32px; height:32px; background:#4f46e5; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0; }
    .candidate-info { flex:1; }
    .candidate-info h3 { margin:0; font-size:1.1rem; font-weight:700; color:#1a1a2e; }
    .title { margin:.1rem 0 0; color:#666; font-size:.875rem; }
    .score-badge { text-align:center; }
    .score { display:block; font-size:1.4rem; font-weight:700; color:#059669; }
    .score-label { font-size:.7rem; color:#999; text-transform:uppercase; }
    .skills-row { display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.75rem; }
    .skill-chip { padding:.2rem .7rem; background:#f1f5f9; border-radius:9999px; font-size:.78rem; color:#475569; font-weight:500; }
    .exp-chip { padding:.2rem .7rem; background:#fef3c7; border-radius:9999px; font-size:.78rem; color:#92400e; font-weight:600; }
    .reasoning { background:#f5f3ff; border-left:3px solid #8b5cf6; padding:.75rem 1rem; border-radius:0 8px 8px 0; font-size:.875rem; color:#4c1d95; line-height:1.5; }
    .ai-badge { background:#8b5cf6; color:white; padding:.1rem .4rem; border-radius:4px; font-size:.7rem; font-weight:700; margin-right:.5rem; }
    .card-footer { margin-top:.75rem; text-align:right; }
    .view-btn { color:#4f46e5; text-decoration:none; font-size:.85rem; font-weight:600; }
    .view-btn:hover { text-decoration:underline; }
    .empty-state { text-align:center; padding:4rem 2rem; color:#999; }
    .empty-icon { font-size:3rem; margin-bottom:1rem; }
    .empty-state h3 { color:#444; margin-bottom:.5rem; }
  `]
})
export class HrSearchComponent {
  query = '';
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
}
