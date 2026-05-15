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
    .page { max-width:800px; margin:2rem auto; padding:0 1rem; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    h2 { margin:0; font-size:1.4rem; color:#1a1a2e; }
    .filters { display:flex; gap:.5rem; }
    .filter-btn { padding:.3rem .8rem; border:1.5px solid #e5e7eb; border-radius:8px; background:white; cursor:pointer; font-size:.85rem; }
    .filter-btn.active { background:#4f46e5; color:white; border-color:#4f46e5; }
    .loading { text-align:center; color:#666; padding:2rem; }
    .profile-row { display:flex; align-items:center; gap:1rem; background:white; padding:1rem 1.25rem; border-radius:10px; border:1.5px solid #e5e7eb; margin-bottom:.75rem; }
    .avatar { width:40px; height:40px; background:#e0e7ff; color:#4f46e5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
    .info { flex:1; display:flex; flex-direction:column; gap:.1rem; font-size:.9rem; color:#374151; }
    .meta { font-size:.78rem; color:#9ca3af; }
    .status-badge { padding:.2rem .6rem; border-radius:9999px; font-size:.75rem; font-weight:600; }
    .status-badge.approved { background:#dcfce7; color:#166534; }
    .status-badge.pending { background:#fef9c3; color:#92400e; }
    .status-badge.rejected { background:#fee2e2; color:#dc2626; }
    .actions { display:flex; gap:.5rem; }
    .btn-view { padding:.35rem .7rem; background:#f1f5f9; color:#4f46e5; border:1px solid #e2e8f0; border-radius:6px; font-size:.82rem; text-decoration:none; font-weight:600; }
    .btn-approve { padding:.35rem .85rem; background:#059669; color:white; border:none; border-radius:6px; font-size:.82rem; cursor:pointer; }
    .btn-reject { padding:.35rem .85rem; background:#dc2626; color:white; border:none; border-radius:6px; font-size:.82rem; cursor:pointer; }
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
