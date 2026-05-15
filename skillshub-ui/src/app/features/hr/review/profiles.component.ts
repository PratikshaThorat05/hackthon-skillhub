import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse, ProfileSummary } from '../../../core/models/models';

@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="header">
        <h2>Employee Profiles</h2>
        <div class="filters">
          @for (s of statuses; track s) {
            <button class="filter-btn" [class.active]="activeStatus() === s" (click)="setStatus(s)">{{ s }}</button>
          }
        </div>
      </div>
      @if (loading()) { <div class="loading">Loading...</div> }
      <div class="profiles-list">
        @for (p of profiles(); track p.id) {
          <div class="profile-row">
            <div class="avatar">{{ p.fullName[0] }}</div>
            <div class="info">
              <strong>{{ p.fullName }}</strong>
              <span>{{ p.currentTitle }}</span>
              <span class="meta">{{ p.skillCount }} skills · {{ p.yearsOfExperience }}y exp</span>
            </div>
            <span class="status-badge" [class]="p.status.toLowerCase()">{{ p.status }}</span>
            <a [routerLink]="['/hr/profile', p.id]" class="btn-view">View</a>
            @if (p.status === 'Pending') {
              <div class="actions">
                <button class="btn-approve" (click)="approve(p.id)">Approve</button>
                <button class="btn-reject" (click)="reject(p.id)">Reject</button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width:900px; margin:0 auto; padding:2rem 1.5rem; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    h2 { margin:0; font-size:1.5rem; font-weight:700; color:#0f172a; }
    .filters { display:flex; gap:.4rem; background:white; border:1px solid #e2e8f0; border-radius:8px; padding:.25rem; }
    .filter-btn { padding:.35rem .85rem; border:none; border-radius:6px; background:transparent; cursor:pointer; font-size:.82rem; font-weight:500; color:#64748b; font-family:inherit; }
    .filter-btn.active { background:#4f46e5; color:white; font-weight:600; }
    .filter-btn:hover:not(.active) { background:#f1f5f9; }
    .loading { text-align:center; color:#64748b; padding:3rem; font-size:.9rem; }
    .profile-row { display:flex; align-items:center; gap:1rem; background:white; padding:1rem 1.25rem; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:.6rem; box-shadow:0 1px 2px rgba(0,0,0,.04); transition:.15s; }
    .profile-row:hover { border-color:#a5b4fc; box-shadow:0 2px 8px rgba(79,70,229,.08); }
    .avatar { width:40px; height:40px; background:#ede9fe; color:#6d28d9; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; font-size:.95rem; }
    .info { flex:1; display:flex; flex-direction:column; gap:.1rem; font-size:.875rem; color:#374151; }
    .info strong { color:#0f172a; font-size:.9rem; }
    .meta { font-size:.75rem; color:#94a3b8; }
    .status-badge { padding:.25rem .7rem; border-radius:9999px; font-size:.72rem; font-weight:700; white-space:nowrap; }
    .status-badge.approved { background:#dcfce7; color:#166534; }
    .status-badge.pending { background:#fef9c3; color:#92400e; }
    .status-badge.rejected { background:#fee2e2; color:#dc2626; }
    .status-badge.processing { background:#dbeafe; color:#1e40af; }
    .actions { display:flex; gap:.4rem; }
    .btn-view { padding:.35rem .75rem; background:#f8fafc; color:#4f46e5; border:1px solid #e2e8f0; border-radius:6px; font-size:.8rem; text-decoration:none; font-weight:600; white-space:nowrap; }
    .btn-view:hover { background:#ede9fe; border-color:#a5b4fc; }
    .btn-approve { padding:.35rem .85rem; background:#059669; color:white; border:none; border-radius:6px; font-size:.8rem; cursor:pointer; font-weight:600; font-family:inherit; }
    .btn-approve:hover { background:#047857; }
    .btn-reject { padding:.35rem .85rem; background:white; color:#dc2626; border:1px solid #fca5a5; border-radius:6px; font-size:.8rem; cursor:pointer; font-weight:600; font-family:inherit; }
    .btn-reject:hover { background:#fef2f2; }
  `]
})
export class ProfilesComponent implements OnInit {
  profiles = signal<ProfileSummary[]>([]);
  loading = signal(true);
  activeStatus = signal('All');
  statuses = ['All', 'Pending', 'Approved', 'Rejected'];

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const status = this.activeStatus() === 'All' ? '' : `?status=${this.activeStatus()}`;
    this.http.get<ApiResponse<PagedResponse<ProfileSummary>>>(`${environment.apiUrl}/hr/profiles${status}`).subscribe({
      next: res => { if (res.success) this.profiles.set(res.data!.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setStatus(s: string) { this.activeStatus.set(s); this.load(); }

  approve(id: string) {
    this.http.patch(`${environment.apiUrl}/hr/profiles/${id}/approve`, {}).subscribe(() => this.load());
  }
  reject(id: string) {
    this.http.patch(`${environment.apiUrl}/hr/profiles/${id}/reject`, { reason: 'Rejected by HR' }).subscribe(() => this.load());
  }
}
