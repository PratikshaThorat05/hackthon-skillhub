import { Component, OnInit, signal, computed } from '@angular/core';
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
      <!-- Header -->
      <div class="page-header">
        <div class="header-text">
          <h1>Employee Profiles</h1>
          <p>Review, approve and manage talent profiles</p>
        </div>
        @if (!loading() && totalCount() > 0) {
          <div class="count-chip" [attr.aria-label]="totalCount() + ' total profiles'">
            {{ totalCount() }} total
          </div>
        }
      </div>

      <!-- Filter tabs -->
      <div class="filter-bar" role="tablist" aria-label="Filter profiles by status">
        @for (s of statuses; track s) {
          <button
            class="filter-tab"
            [class.active]="activeStatus() === s"
            (click)="setStatus(s)"
            role="tab"
            [attr.aria-selected]="activeStatus() === s"
            [attr.id]="'tab-' + s.toLowerCase()"
          >
            <span class="tab-dot" [class]="'dot-' + s.toLowerCase()" aria-hidden="true"></span>
            {{ s }}
          </button>
        }
      </div>

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="profiles-list" aria-busy="true" aria-label="Loading profiles">
          @for (i of skeletonRows(); track i) {
            <div class="profile-row skeleton-row">
              <div class="skel skel-avatar"></div>
              <div style="flex:1">
                <div class="skel skel-name"></div>
                <div class="skel skel-sub"></div>
              </div>
              <div class="skel skel-badge"></div>
              <div class="skel skel-btn"></div>
            </div>
          }
        </div>
        <div class="pagination-bar skeleton-pagination">
          <div class="skel" style="height:36px;width:280px;border-radius:8px"></div>
        </div>
      }

      <!-- Profile list -->
      @if (!loading()) {
        @if (profiles().length === 0) {
          <div class="empty-state" role="status">
            <div class="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="#e2e8f0" stroke-width="1.5"/><path d="M20 40c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="22" r="6" stroke="#cbd5e1" stroke-width="2"/></svg>
            </div>
            <h3>No profiles found</h3>
            <p>{{ activeStatus() === 'All' ? 'Upload resumes to get started.' : 'No ' + activeStatus().toLowerCase() + ' profiles at the moment.' }}</p>
            @if (activeStatus() === 'All') {
              <a routerLink="/hr/upload" class="btn-upload" aria-label="Go to upload page">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                Upload Resumes
              </a>
            }
          </div>
        }

        @if (profiles().length > 0) {
          <div class="profiles-list" role="list" aria-label="Employee profiles" [attr.aria-labelledby]="'tab-' + activeStatus().toLowerCase()">
            @for (p of profiles(); track p.id) {
              <div class="profile-row" role="listitem" [class.pending-row]="p.status === 'Pending'">
                <div class="avatar" [class]="'avatar-' + p.status.toLowerCase()" aria-hidden="true">
                  {{ p.fullName[0].toUpperCase() }}
                </div>

                <div class="info">
                  <span class="name">{{ p.fullName }}</span>
                  <span class="title">{{ p.currentTitle || 'No title' }}</span>
                  <div class="meta-row" [attr.aria-label]="p.skillCount + ' skills, ' + p.yearsOfExperience + ' years experience'">
                    <span class="meta-chip">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
                      {{ p.skillCount }} skills
                    </span>
                    @if (p.yearsOfExperience) {
                      <span class="meta-chip">
                        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                        {{ p.yearsOfExperience }}y exp
                      </span>
                    }
                  </div>
                </div>

                <span class="status-badge" [class]="'status-' + p.status.toLowerCase()" [attr.aria-label]="'Status: ' + p.status">
                  <span class="status-dot" aria-hidden="true"></span>
                  {{ p.status }}
                </span>

                <div class="actions">
                  <a [routerLink]="['/hr/profile', p.id]" class="btn-view" [attr.aria-label]="'View profile for ' + p.fullName">
                    View
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                  </a>
                  @if (p.status === 'Pending') {
                    <button class="btn-approve" (click)="approve(p.id)" [attr.aria-label]="'Approve ' + p.fullName">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      Approve
                    </button>
                    <button class="btn-reject" (click)="reject(p.id)" [attr.aria-label]="'Reject ' + p.fullName">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                      Reject
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Pagination bar -->
          <nav class="pagination-bar" aria-label="Pagination" role="navigation">
            <!-- Results summary -->
            <span class="page-info" aria-live="polite">
              Showing <strong>{{ rangeStart() }}–{{ rangeEnd() }}</strong> of <strong>{{ totalCount() }}</strong>
            </span>

            <div class="page-controls">
              <!-- Per-page selector -->
              <div class="per-page">
                <label for="per-page-select" class="sr-only">Rows per page</label>
                <select id="per-page-select" [value]="pageSize()" (change)="setPageSize(+$any($event.target).value)" class="per-page-select" aria-label="Rows per page">
                  <option value="5">5 / page</option>
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                </select>
              </div>

              <!-- Prev -->
              <button
                class="page-btn nav-btn"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)"
                aria-label="Previous page"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              </button>

              <!-- Page numbers -->
              @for (p of pageNumbers(); track p) {
                @if (p === -1) {
                  <span class="page-ellipsis" aria-hidden="true">…</span>
                } @else {
                  <button
                    class="page-btn"
                    [class.active]="p === currentPage()"
                    (click)="goToPage(p)"
                    [attr.aria-label]="'Page ' + p"
                    [attr.aria-current]="p === currentPage() ? 'page' : null"
                  >{{ p }}</button>
                }
              }

              <!-- Next -->
              <button
                class="page-btn nav-btn"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)"
                aria-label="Next page"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
              </button>
            </div>
          </nav>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }

    /* Header */
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; }
    h1 { font-size: 1.625rem; font-weight: 800; color: #0f172a; margin: 0 0 .25rem; letter-spacing: -.02em; }
    .page-header p { color: #64748b; font-size: .875rem; margin: 0; }
    .count-chip { padding: .3rem .85rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 9999px; font-size: .78rem; font-weight: 600; color: #475569; white-space: nowrap; align-self: flex-start; margin-top: .25rem; }

    /* Filter bar */
    .filter-bar { display: flex; gap: .25rem; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: .3rem; margin-bottom: 1.25rem; width: fit-content; }
    .filter-tab { display: flex; align-items: center; gap: .4rem; padding: .4rem 1rem; border: none; border-radius: 7px; background: transparent; cursor: pointer; font-size: .82rem; font-weight: 500; color: #64748b; font-family: inherit; transition: all .15s; }
    .filter-tab:hover:not(.active) { background: #f8fafc; color: #374151; }
    .filter-tab.active { background: #4f46e5; color: white; font-weight: 600; }
    .tab-dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot-all { background: #94a3b8; }
    .filter-tab.active .tab-dot { background: white; }
    .dot-pending  { background: #f59e0b; }
    .dot-approved { background: #10b981; }
    .dot-rejected { background: #ef4444; }

    /* Skeleton */
    .skel { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .skeleton-row { pointer-events: none; }
    .skel-avatar { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; }
    .skel-name { height: 16px; width: 160px; margin-bottom: .5rem; }
    .skel-sub { height: 12px; width: 240px; }
    .skel-badge { height: 24px; width: 80px; border-radius: 9999px; }
    .skel-btn { height: 32px; width: 64px; border-radius: 8px; }
    .skeleton-pagination { justify-content: center; }

    /* Profiles list */
    .profiles-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1.25rem; }

    .profile-row { display: flex; align-items: center; gap: 1rem; background: white; padding: .875rem 1.25rem; border-radius: 12px; border: 1.5px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.04); transition: all .15s; }
    .profile-row:hover { border-color: #a5b4fc; box-shadow: 0 3px 12px rgba(79,70,229,.08); transform: translateY(-1px); }
    .pending-row { border-left: 3px solid #f59e0b; }

    .avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; }
    .avatar-approved { background: linear-gradient(135deg, #d1fae5, #a7f3d0); color: #065f46; }
    .avatar-pending  { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
    .avatar-rejected { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #991b1b; }
    .avatar-processing { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e40af; }

    .info { flex: 1; display: flex; flex-direction: column; gap: .15rem; min-width: 0; }
    .name { font-size: .9rem; font-weight: 700; color: #0f172a; }
    .title { font-size: .82rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta-row { display: flex; gap: .5rem; margin-top: .1rem; flex-wrap: wrap; }
    .meta-chip { display: inline-flex; align-items: center; gap: .25rem; font-size: .72rem; color: #94a3b8; font-weight: 500; }
    .meta-chip svg { width: 11px; height: 11px; }

    .status-badge { display: inline-flex; align-items: center; gap: .35rem; padding: .25rem .75rem; border-radius: 9999px; font-size: .73rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-approved .status-dot { background: #10b981; }
    .status-pending  { background: #fef3c7; color: #92400e; }
    .status-pending .status-dot  { background: #f59e0b; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-rejected .status-dot { background: #ef4444; }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .status-processing .status-dot { background: #3b82f6; animation: pulse 1.5s infinite; }

    .actions { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
    .btn-view { display: inline-flex; align-items: center; gap: .3rem; padding: .4rem .85rem; background: #f8fafc; color: #4f46e5; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .8rem; text-decoration: none; font-weight: 600; transition: all .15s; white-space: nowrap; }
    .btn-view:hover { background: #ede9fe; border-color: #a5b4fc; }
    .btn-view svg { width: 13px; height: 13px; }
    .btn-approve { display: inline-flex; align-items: center; gap: .3rem; padding: .4rem .85rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; font-size: .8rem; cursor: pointer; font-weight: 600; font-family: inherit; transition: opacity .15s; white-space: nowrap; }
    .btn-approve:hover { opacity: .9; }
    .btn-approve svg { width: 13px; height: 13px; }
    .btn-reject { display: inline-flex; align-items: center; gap: .3rem; padding: .4rem .85rem; background: white; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; font-size: .8rem; cursor: pointer; font-weight: 600; font-family: inherit; transition: all .15s; white-space: nowrap; }
    .btn-reject:hover { background: #fef2f2; border-color: #f87171; }
    .btn-reject svg { width: 13px; height: 13px; }

    /* Pagination */
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1.25rem;
      background: white; border: 1px solid #e2e8f0;
      border-radius: 12px; gap: 1rem; flex-wrap: wrap;
    }
    .page-info { font-size: .82rem; color: #64748b; }
    .page-info strong { color: #0f172a; }
    .page-controls { display: flex; align-items: center; gap: .35rem; }

    .per-page-select {
      padding: .35rem .65rem; border: 1px solid #e2e8f0; border-radius: 7px;
      font-size: .8rem; font-family: inherit; color: #374151;
      background: white; cursor: pointer; margin-right: .4rem;
      transition: border-color .15s;
    }
    .per-page-select:focus { outline: none; border-color: #6366f1; }

    .page-btn {
      min-width: 34px; height: 34px; padding: 0 .5rem;
      border: 1px solid #e2e8f0; border-radius: 8px;
      background: white; color: #374151; font-size: .82rem;
      font-weight: 500; font-family: inherit; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all .15s;
    }
    .page-btn:hover:not(:disabled):not(.active) { border-color: #a5b4fc; background: #f5f3ff; color: #4f46e5; }
    .page-btn.active { background: #4f46e5; border-color: #4f46e5; color: white; font-weight: 700; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .nav-btn svg { width: 16px; height: 16px; }

    .page-ellipsis { min-width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; font-size: .85rem; color: #94a3b8; }

    /* Empty state */
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { margin-bottom: 1rem; }
    .empty-icon svg { width: 72px; height: 72px; }
    .empty-state h3 { font-size: 1.1rem; font-weight: 700; color: #374151; margin: 0 0 .4rem; }
    .empty-state p { color: #64748b; font-size: .9rem; margin: 0 0 1.25rem; }
    .btn-upload { display: inline-flex; align-items: center; gap: .4rem; padding: .6rem 1.25rem; background: #4f46e5; color: white; border-radius: 9px; font-size: .875rem; font-weight: 600; text-decoration: none; transition: background .15s; }
    .btn-upload:hover { background: #4338ca; }
    .btn-upload svg { width: 15px; height: 15px; }
  `]
})
export class ProfilesComponent implements OnInit {
  profiles = signal<ProfileSummary[]>([]);
  loading = signal(true);
  activeStatus = signal('All');
  statuses = ['All', 'Pending', 'Approved', 'Rejected'];

  currentPage = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);
  totalPages = signal(0);

  rangeStart = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  rangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalCount()));

  skeletonRows = computed(() => Array.from({ length: this.pageSize() }, (_, i) => i));

  pageNumbers = computed((): number[] => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (current > 3) pages.push(-1); // left ellipsis

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push(-1); // right ellipsis
    pages.push(total);
    return pages;
  });

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: string[] = [`page=${this.currentPage()}`, `pageSize=${this.pageSize()}`];
    if (this.activeStatus() !== 'All') params.push(`status=${this.activeStatus()}`);
    const query = '?' + params.join('&');

    this.http.get<ApiResponse<PagedResponse<ProfileSummary>>>(`${environment.apiUrl}/hr/profiles${query}`).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.profiles.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setStatus(s: string) {
    this.activeStatus.set(s);
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.load();
  }

  approve(id: string) {
    this.http.patch(`${environment.apiUrl}/hr/profiles/${id}/approve`, {}).subscribe(() => this.load());
  }

  reject(id: string) {
    this.http.patch(`${environment.apiUrl}/hr/profiles/${id}/reject`, { reason: 'Rejected by HR' }).subscribe(() => this.load());
  }
}
