import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  badge?: string;
  iconPath: string;
}

interface NavGroup {
  id: string;
  label: string;
  iconPath: string;
  items: NavItem[];
  routes: string[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <!-- Brand -->
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="brand-name">SkillsHub</div>
          <div class="brand-tag">AI Talent Platform</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="nav">
        @if (auth.isHR()) {
          @for (group of hrGroups; track group.id) {
            <div class="group">
              <button class="group-trigger" (click)="toggle(group.id)" [class.active]="groupHasActive(group)">
                <span class="g-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path [attr.d]="group.iconPath"/></svg>
                </span>
                <span class="g-label">{{ group.label }}</span>
                <svg class="g-chevron" [class.rotated]="isOpen(group.id)" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>

              @if (isOpen(group.id)) {
                <div class="group-items">
                  @for (item of group.items; track item.route) {
                    <a [routerLink]="item.route" routerLinkActive="item-active" class="nav-item">
                      <span class="i-icon">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path [attr.d]="item.iconPath"/></svg>
                      </span>
                      <span class="i-label">{{ item.label }}</span>
                      @if (item.badge) {
                        <span class="ai-chip">{{ item.badge }}</span>
                      }
                    </a>
                  }
                </div>
              }
            </div>
          }
        }

        @if (auth.isEmployee()) {
          @for (group of employeeGroups; track group.id) {
            <div class="group">
              <button class="group-trigger" (click)="toggle(group.id)" [class.active]="groupHasActive(group)">
                <span class="g-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path [attr.d]="group.iconPath"/></svg>
                </span>
                <span class="g-label">{{ group.label }}</span>
                <svg class="g-chevron" [class.rotated]="isOpen(group.id)" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>
              @if (isOpen(group.id)) {
                <div class="group-items">
                  @for (item of group.items; track item.route) {
                    <a [routerLink]="item.route" routerLinkActive="item-active" class="nav-item">
                      <span class="i-icon">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path [attr.d]="item.iconPath"/></svg>
                      </span>
                      <span class="i-label">{{ item.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }
        }
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="user-row">
          <div class="avatar">{{ auth.currentUser()?.email?.[0]?.toUpperCase() }}</div>
          <div class="user-info">
            <span class="user-email" [title]="auth.currentUser()?.email">{{ auth.currentUser()?.email }}</span>
            <span class="role-pill" [class]="'rp-' + auth.currentUser()?.role?.toLowerCase()">{{ auth.currentUser()?.role }}</span>
          </div>
          <button class="logout-btn" (click)="auth.logout()" title="Sign out">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: contents; }

    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #111827;
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      overflow-y: auto;
      overflow-x: hidden;
      border-right: 1px solid #1f2937;
    }

    /* ── Brand ── */
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 16px 16px;
      border-bottom: 1px solid #1f2937;
      flex-shrink: 0;
    }
    .brand-logo {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 0 16px rgba(79,70,229,.35);
    }
    .brand-logo svg { width: 18px; height: 18px; }
    .brand-name { font-size: .9rem; font-weight: 700; color: #f9fafb; line-height: 1.2; }
    .brand-tag  { font-size: .6rem; color: #6366f1; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; margin-top: 1px; }

    /* ── Nav ── */
    .nav { flex: 1; padding: 8px 0 4px; overflow-y: auto; }

    /* ── Group ── */
    .group { margin: 0 8px 2px; }

    .group-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      background: none;
      border: none;
      border-radius: 7px;
      cursor: pointer;
      color: #6b7280;
      font-size: .75rem;
      font-weight: 600;
      letter-spacing: .03em;
      text-transform: uppercase;
      transition: background .12s, color .12s;
      text-align: left;
    }
    .group-trigger:hover {
      background: #1f2937;
      color: #9ca3af;
    }
    .group-trigger.active { color: #a5b4fc; }

    .g-icon { width: 14px; height: 14px; flex-shrink: 0; display: flex; align-items: center; }
    .g-icon svg { width: 14px; height: 14px; }
    .g-label { flex: 1; }
    .g-chevron { width: 12px; height: 12px; flex-shrink: 0; transition: transform .2s ease; }
    .g-chevron.rotated { transform: rotate(90deg); }

    /* ── Items container ── */
    .group-items {
      position: relative;
      margin: 2px 0 4px 12px;
      padding-left: 12px;
      border-left: 1px solid #1f2937;
    }

    /* ── Individual nav item ── */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 7px 10px;
      margin: 1px 0;
      color: #6b7280;
      text-decoration: none;
      font-size: .825rem;
      font-weight: 500;
      border-radius: 6px;
      transition: background .12s, color .12s;
    }
    .nav-item:hover {
      background: #1f2937;
      color: #d1d5db;
    }
    .nav-item.item-active {
      background: rgba(99,102,241,.15);
      color: #e0e7ff;
    }
    .nav-item.item-active .i-icon { color: #818cf8; }

    .i-icon { width: 15px; height: 15px; flex-shrink: 0; display: flex; align-items: center; opacity: .7; }
    .nav-item.item-active .i-icon { opacity: 1; }
    .i-icon svg { width: 15px; height: 15px; }
    .i-label { flex: 1; }

    .ai-chip {
      font-size: .55rem;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 4px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: #fff;
      letter-spacing: .04em;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 10px 12px;
      border-top: 1px solid #1f2937;
      flex-shrink: 0;
    }
    .user-row { display: flex; align-items: center; gap: 8px; }
    .avatar {
      width: 30px; height: 30px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-email {
      display: block; font-size: .68rem; color: #6b7280;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .role-pill {
      display: inline-block; font-size: .58rem; font-weight: 700;
      padding: 1px 6px; border-radius: 4px; margin-top: 2px; letter-spacing: .03em;
    }
    .rp-hr       { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(52,211,153,.2); }
    .rp-employee { background: rgba(99,102,241,.12); color: #818cf8; border: 1px solid rgba(129,140,248,.2); }
    .rp-admin    { background: rgba(245,158,11,.12);  color: #fbbf24; border: 1px solid rgba(251,191,36,.2); }

    .logout-btn {
      width: 28px; height: 28px;
      background: none; border: 1px solid #1f2937;
      border-radius: 6px; cursor: pointer; color: #4b5563;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: all .12s;
    }
    .logout-btn:hover { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.2); color: #f87171; }
    .logout-btn svg { width: 13px; height: 13px; }
  `]
})
export class NavbarComponent {
  public auth = inject(AuthService);
  private router = inject(Router);

  private openGroups = signal<Set<string>>(
    new Set(['overview', 'search', 'people', 'analytics', 'import', 'workspace'])
  );

  readonly hrGroups: NavGroup[] = [
    {
      id: 'overview',
      label: 'Overview',
      iconPath: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z',
      routes: ['/hr/dashboard'],
      items: [
        { label: 'Dashboard', route: '/hr/dashboard', iconPath: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z' }
      ]
    },
    {
      id: 'search',
      label: 'Search',
      iconPath: 'M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z',
      routes: ['/hr/search', '/hr/chat'],
      items: [
        { label: 'Talent Search', route: '/hr/search', badge: 'AI', iconPath: 'M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' },
        { label: 'Chat Search',   route: '/hr/chat',   badge: 'AI', iconPath: 'M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z' }
      ]
    },
    {
      id: 'people',
      label: 'People',
      iconPath: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z',
      routes: ['/hr/profiles', '/hr/directory', '/hr/profile/'],
      items: [
        { label: 'Review Profiles', route: '/hr/profiles',  iconPath: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' },
        { label: 'Directory',       route: '/hr/directory', iconPath: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      iconPath: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',
      routes: ['/hr/org-chart', '/hr/gap-analysis', '/hr/team-builder'],
      items: [
        { label: 'Org Chart',    route: '/hr/org-chart',    iconPath: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' },
        { label: 'Gap Analysis', route: '/hr/gap-analysis', iconPath: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z' },
        { label: 'Team Builder', route: '/hr/team-builder', iconPath: 'M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' }
      ]
    },
    {
      id: 'import',
      label: 'Import',
      iconPath: 'M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z',
      routes: ['/hr/upload', '/hr/bulk-upload'],
      items: [
        { label: 'Upload Resume', route: '/hr/upload',      iconPath: 'M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z' },
        { label: 'Bulk Import',   route: '/hr/bulk-upload', iconPath: 'M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z' }
      ]
    }
  ];

  readonly employeeGroups: NavGroup[] = [
    {
      id: 'workspace',
      label: 'My Workspace',
      iconPath: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
      routes: ['/employee/'],
      items: [
        { label: 'Upload Resume', route: '/employee/upload',     iconPath: 'M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z' },
        { label: 'My Profile',    route: '/employee/profile',    iconPath: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' },
        { label: 'Directory',     route: '/employee/directory',  iconPath: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' }
      ]
    }
  ];

  constructor() {
    this.router.events.subscribe(() => this.autoOpenActive());
    this.autoOpenActive();
  }

  private autoOpenActive() {
    const url = this.router.url;
    const all = [...this.hrGroups, ...this.employeeGroups];
    for (const g of all) {
      if (g.routes.some(r => url.startsWith(r))) {
        this.openGroups.update(s => { const n = new Set(s); n.add(g.id); return n; });
        break;
      }
    }
  }

  isOpen(id: string)           { return this.openGroups().has(id); }
  toggle(id: string)           { this.openGroups.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  groupHasActive(g: NavGroup)  { return g.routes.some(r => this.router.url.startsWith(r)); }
}
