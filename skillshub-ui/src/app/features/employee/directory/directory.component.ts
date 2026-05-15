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
      <div class="header">
        <div>
          <h2>Employee Directory</h2>
          <p class="subtitle">{{ filtered().length }} approved employees</p>
        </div>
        <input class="search-input" [(ngModel)]="searchTerm" (input)="filter()"
               placeholder="Search by name, title, skill..." />
      </div>

      @if (loading()) { <div class="loading">Loading directory...</div> }

      <div class="grid">
        @for (p of filtered(); track p.id) {
          <div class="card">
            <div class="card-header">
              <div class="avatar">{{ p.fullName[0] }}</div>
              <div class="info">
                <strong>{{ p.fullName }}</strong>
                <span class="title">{{ p.currentTitle }}</span>
                @if (p.department) { <span class="dept">{{ p.department }}</span> }
              </div>
              @if (p.yearsOfExperience) {
                <span class="exp-badge">{{ p.yearsOfExperience }}y</span>
              }
            </div>
            @if (p.summary) {
              <p class="summary">{{ p.summary }}</p>
            }
            <div class="skills">
              @for (skill of p.topSkills; track skill) {
                <span class="skill-chip">{{ skill }}</span>
              }
            </div>
          </div>
        }
      </div>

      @if (!loading() && filtered().length === 0) {
        <div class="empty">
          <div class="empty-icon">👥</div>
          <p>No employees found{{ searchTerm ? ' matching "' + searchTerm + '"' : '' }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width:1200px; margin:0 auto; padding:2rem 1.5rem; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.75rem; gap:1rem; flex-wrap:wrap; }
    h2 { margin:0; font-size:1.5rem; font-weight:700; color:#0f172a; }
    .subtitle { margin:.25rem 0 0; font-size:.875rem; color:#94a3b8; }
    .search-input { padding:.65rem 1.1rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:.9rem; width:300px; font-family:inherit; }
    .search-input:focus { outline:none; border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.08); }
    .loading, .empty { text-align:center; color:#64748b; padding:4rem; }
    .empty-icon { font-size:3rem; margin-bottom:.75rem; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px,1fr)); gap:1.25rem; }
    .card { background:white; border:1px solid #e2e8f0; border-radius:14px; padding:1.75rem; transition:.2s; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .card:hover { border-color:#a5b4fc; box-shadow:0 6px 20px rgba(79,70,229,.1); transform:translateY(-2px); }
    .card-header { display:flex; align-items:center; gap:1rem; margin-bottom:1rem; }
    .avatar { width:52px; height:52px; background:#ede9fe; color:#6d28d9; border-radius:14px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.25rem; flex-shrink:0; }
    .info { flex:1; display:flex; flex-direction:column; gap:.2rem; }
    .info strong { font-size:1rem; color:#0f172a; font-weight:600; }
    .title { font-size:.875rem; color:#64748b; }
    .dept { font-size:.78rem; color:#6d28d9; background:#f5f3ff; padding:.2rem .5rem; border-radius:5px; width:fit-content; font-weight:500; }
    .exp-badge { font-size:.78rem; font-weight:700; color:#4f46e5; background:#e0e7ff; padding:.3rem .65rem; border-radius:9999px; flex-shrink:0; }
    .summary { font-size:.875rem; color:#64748b; line-height:1.6; margin:.25rem 0 1rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .skills { display:flex; flex-wrap:wrap; gap:.4rem; }
    .skill-chip { padding:.25rem .7rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:9999px; font-size:.78rem; color:#475569; font-weight:500; }
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
