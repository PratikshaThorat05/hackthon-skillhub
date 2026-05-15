import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">S</div>
        <div class="brand-text">
          <span class="brand-name">SkillsHub</span>
          <span class="brand-sub">AI Talent Platform</span>
        </div>
      </div>

      <nav class="nav">
        @if (auth.isHR()) {
          <div class="nav-section-label">TALENT</div>
          <a routerLink="/hr/search" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
            </span>
            <span>Talent Search</span>
          </a>
          <a routerLink="/hr/profiles" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
            </span>
            <span>Profiles</span>
          </a>
          <a routerLink="/hr/directory" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
            </span>
            <span>Directory</span>
          </a>
          <div class="nav-section-label" style="margin-top:1rem">MANAGE</div>
          <a routerLink="/hr/upload" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            </span>
            <span>Upload Resume</span>
          </a>
          <a routerLink="/hr/bulk-upload" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/></svg>
            </span>
            <span>Bulk Import</span>
          </a>
          <a routerLink="/hr/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>
            </span>
            <span>Dashboard</span>
          </a>
        }
        @if (auth.isEmployee()) {
          <div class="nav-section-label">MY WORKSPACE</div>
          <a routerLink="/employee/upload" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            </span>
            <span>Upload Resume</span>
          </a>
          <a routerLink="/employee/profile" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
            </span>
            <span>My Profile</span>
          </a>
          <a routerLink="/employee/directory" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
            </span>
            <span>Directory</span>
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">{{ auth.currentUser()?.email?.[0]?.toUpperCase() }}</div>
          <div class="user-info">
            <span class="user-email">{{ auth.currentUser()?.email }}</span>
            <span class="role-chip" [class]="auth.currentUser()?.role?.toLowerCase()">{{ auth.currentUser()?.role }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="auth.logout()">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: 1.5rem 1.25rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: #4f46e5;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
      flex-shrink: 0;
    }
    .brand-name { display: block; font-size: .95rem; font-weight: 700; color: white; line-height: 1.2; }
    .brand-sub { display: block; font-size: .68rem; color: #64748b; font-weight: 400; }
    .nav { flex: 1; padding: 1.25rem 0; }
    .nav-section-label {
      padding: 0 1.25rem .4rem;
      font-size: .65rem;
      font-weight: 700;
      color: #475569;
      letter-spacing: .08em;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .6rem 1.25rem;
      color: #94a3b8;
      text-decoration: none;
      font-size: .875rem;
      font-weight: 500;
      border-radius: 0;
      transition: .15s;
      position: relative;
    }
    .nav-item:hover { color: white; background: rgba(255,255,255,.05); }
    .nav-item.active {
      color: white;
      background: rgba(79,70,229,.25);
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #4f46e5;
      border-radius: 0 2px 2px 0;
    }
    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .nav-icon svg { width: 18px; height: 18px; }
    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(255,255,255,.06);
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    .user-card { display: flex; align-items: center; gap: .6rem; flex: 1; min-width: 0; }
    .user-avatar {
      width: 32px;
      height: 32px;
      background: #4f46e5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .85rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
    .user-email { font-size: .72rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
    .role-chip {
      display: inline-block;
      padding: .1rem .4rem;
      border-radius: 4px;
      font-size: .65rem;
      font-weight: 700;
      width: fit-content;
    }
    .role-chip.hr { background: rgba(16,185,129,.2); color: #34d399; }
    .role-chip.employee { background: rgba(99,102,241,.2); color: #818cf8; }
    .role-chip.admin { background: rgba(245,158,11,.2); color: #fbbf24; }
    .logout-btn {
      width: 32px;
      height: 32px;
      background: rgba(255,255,255,.05);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      flex-shrink: 0;
      transition: .15s;
    }
    .logout-btn:hover { background: rgba(239,68,68,.15); color: #f87171; }
    .logout-btn svg { width: 16px; height: 16px; }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
