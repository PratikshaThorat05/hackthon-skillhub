import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/models';

interface DirectoryProfile {
  id: string;
  fullName: string;
  currentTitle?: string;
  department?: string;
  yearsOfExperience?: number;
  summary?: string;
  topSkills: string[];
}

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-text">
          <h1>Employee Directory</h1>
          <p>Browse all approved talent profiles in your organization</p>
        </div>
        <div class="search-wrap" role="search">
          <label for="dir-search" class="sr-only">Search employees</label>
          <span class="search-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
          </span>
          <input
            id="dir-search"
            class="search-input"
            [(ngModel)]="searchTerm"
            (input)="filter()"
            placeholder="Name, title, skill…"
            type="search"
            [attr.aria-label]="'Search ' + profiles().length + ' employees'"
          />
        </div>
      </div>

      <!-- Result count -->
      @if (!loading()) {
        <div class="result-count" role="status" aria-live="polite">
          @if (searchTerm) {
            <strong>{{ filtered().length }}</strong> result{{ filtered().length !== 1 ? 's' : '' }} for "<em>{{ searchTerm }}</em>"
          } @else {
            <strong>{{ filtered().length }}</strong> employee{{ filtered().length !== 1 ? 's' : '' }}
          }
        </div>
      }

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="grid" aria-busy="true" aria-label="Loading directory">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="card skeleton-card">
              <div class="card-header">
                <div class="skel skel-avatar"></div>
                <div style="flex:1">
                  <div class="skel skel-name"></div>
                  <div class="skel skel-title"></div>
                </div>
              </div>
              <div class="skel skel-summary"></div>
              <div class="skel skel-summary short"></div>
              <div style="display:flex;gap:.4rem;margin-top:.875rem">
                <div class="skel skel-chip"></div>
                <div class="skel skel-chip"></div>
                <div class="skel skel-chip"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Directory grid -->
      @if (!loading() && filtered().length > 0) {
        <div class="grid" role="list" aria-label="Employee directory">
          @for (p of filtered(); track p.id) {
            <article class="card" role="listitem" [attr.aria-label]="p.fullName + (p.currentTitle ? ', ' + p.currentTitle : '')">
              <div class="card-header">
                <div class="avatar" aria-hidden="true">{{ p.fullName[0].toUpperCase() }}</div>
                <div class="info">
                  <strong class="name">{{ p.fullName }}</strong>
                  @if (p.currentTitle) { <span class="title">{{ p.currentTitle }}</span> }
                  @if (p.department) {
                    <span class="dept">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                      {{ p.department }}
                    </span>
                  }
                </div>
                @if (p.yearsOfExperience) {
                  <div class="exp-badge" [attr.aria-label]="p.yearsOfExperience + ' years experience'">
                    {{ p.yearsOfExperience }}<span>y</span>
                  </div>
                }
              </div>

              @if (p.summary) {
                <p class="summary">{{ p.summary }}</p>
              }

              @if (p.topSkills.length > 0) {
                <div class="skills" aria-label="Top skills">
                  @for (skill of p.topSkills.slice(0, 6); track skill) {
                    <span class="skill-chip">{{ skill }}</span>
                  }
                  @if (p.topSkills.length > 6) {
                    <span class="skill-more" [attr.aria-label]="(p.topSkills.length - 6) + ' more skills'">+{{ p.topSkills.length - 6 }}</span>
                  }
                </div>
              }
            </article>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && filtered().length === 0) {
        <div class="empty-state" role="status">
          <div class="empty-illustration" aria-hidden="true">
            <svg viewBox="0 0 120 80" fill="none">
              <rect x="5" y="15" width="110" height="55" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
              <circle cx="30" cy="35" r="10" fill="#ede9fe" stroke="#c4b5fd" stroke-width="1.5"/>
              <path d="M45 33h30M45 40h20" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
              <circle cx="30" cy="58" r="10" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="1.5"/>
              <path d="M45 56h35M45 63h25" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          @if (searchTerm) {
            <h2>No results for "{{ searchTerm }}"</h2>
            <p>Try a different name, job title, or skill.</p>
            <button class="btn-clear" (click)="searchTerm=''; filter()" aria-label="Clear search">Clear search</button>
          } @else {
            <h2>Directory is empty</h2>
            <p>No approved employee profiles yet. Upload and approve resumes to populate the directory.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; }

    /* Header */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;
    }
    h1 { font-size: 1.625rem; font-weight: 800; color: #0f172a; margin: 0 0 .25rem; letter-spacing: -.02em; }
    .page-header p { color: #64748b; font-size: .875rem; margin: 0; }

    /* Search */
    .search-wrap {
      position: relative; display: flex; align-items: center;
      align-self: flex-start;
    }
    .search-icon {
      position: absolute; left: .875rem; color: #94a3b8; pointer-events: none;
    }
    .search-icon svg { width: 16px; height: 16px; display: block; }
    .search-input {
      padding: .65rem 1rem .65rem 2.5rem;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: .875rem; font-family: inherit; color: #0f172a;
      background: white; width: 280px;
      transition: border-color .15s, box-shadow .15s;
    }
    .search-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    .search-input::placeholder { color: #94a3b8; }

    /* Result count */
    .result-count { font-size: .875rem; color: #64748b; margin-bottom: 1.25rem; }
    .result-count strong { color: #0f172a; font-weight: 700; }
    .result-count em { font-style: italic; color: #4f46e5; }

    /* Skeleton */
    .skel { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .skel-avatar { width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; }
    .skel-name { height: 16px; width: 140px; margin-bottom: .5rem; }
    .skel-title { height: 13px; width: 180px; }
    .skel-summary { height: 13px; margin-top: .75rem; }
    .skel-summary.short { width: 60%; }
    .skel-chip { height: 24px; width: 70px; border-radius: 9999px; }
    .skeleton-card { pointer-events: none; }

    /* Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }

    /* Card */
    .card {
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 16px; padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
      transition: all .2s;
    }
    .card:hover { border-color: #a5b4fc; box-shadow: 0 6px 24px rgba(79,70,229,.1); transform: translateY(-2px); }

    /* Card header */
    .card-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .avatar {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      color: #5b21b6; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.25rem; flex-shrink: 0;
    }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .2rem; }
    .name { font-size: .95rem; font-weight: 700; color: #0f172a; }
    .title { font-size: .85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dept {
      display: inline-flex; align-items: center; gap: .25rem;
      font-size: .74rem; color: #6d28d9; background: #f5f3ff;
      padding: .15rem .5rem; border-radius: 5px;
      font-weight: 500; width: fit-content;
    }
    .dept svg { width: 11px; height: 11px; }
    .exp-badge {
      font-size: .9rem; font-weight: 800; color: #4f46e5;
      background: #ede9fe; padding: .3rem .65rem;
      border-radius: 9999px; flex-shrink: 0;
      display: flex; align-items: baseline; gap: 1px;
    }
    .exp-badge span { font-size: .7rem; font-weight: 600; }

    /* Summary */
    .summary {
      font-size: .84rem; color: #64748b; line-height: 1.6; margin: 0 0 .875rem;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }

    /* Skills */
    .skills { display: flex; flex-wrap: wrap; gap: .375rem; }
    .skill-chip {
      padding: .2rem .65rem; background: #f8fafc;
      border: 1px solid #e2e8f0; border-radius: 9999px;
      font-size: .77rem; color: #475569; font-weight: 500;
    }
    .skill-more {
      padding: .2rem .65rem; background: #ede9fe;
      border-radius: 9999px; font-size: .77rem; color: #6d28d9; font-weight: 600;
    }

    /* Empty state */
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-illustration { margin-bottom: 1.5rem; }
    .empty-illustration svg { width: 180px; height: 120px; }
    h2 { font-size: 1.15rem; font-weight: 700; color: #374151; margin: 0 0 .4rem; }
    .empty-state p { color: #64748b; font-size: .9rem; margin: 0 0 1.25rem; max-width: 360px; margin-left: auto; margin-right: auto; }
    .btn-clear {
      padding: .5rem 1.25rem; background: white; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: .875rem; font-weight: 600;
      color: #374151; cursor: pointer; font-family: inherit; transition: all .15s;
    }
    .btn-clear:hover { border-color: #a5b4fc; color: #4f46e5; background: #f5f3ff; }
  `]
})
export class DirectoryComponent implements OnInit {
  profiles = signal<DirectoryProfile[]>([]);
  filtered = signal<DirectoryProfile[]>([]);
  loading = signal(true);
  searchTerm = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ApiResponse<DirectoryProfile[]>>(`${environment.apiUrl}/profiles/directory`).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.profiles.set(res.data);
          this.filtered.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filter() {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) { this.filtered.set(this.profiles()); return; }
    this.filtered.set(this.profiles().filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      (p.currentTitle ?? '').toLowerCase().includes(q) ||
      (p.department ?? '').toLowerCase().includes(q) ||
      p.topSkills.some(s => s.toLowerCase().includes(q)) ||
      (p.summary ?? '').toLowerCase().includes(q)
    ));
  }
}
