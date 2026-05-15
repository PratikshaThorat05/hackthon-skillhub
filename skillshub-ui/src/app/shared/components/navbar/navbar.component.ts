import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="brand">
        <span class="logo">⚡</span>
        <span class="name">SkillsHub</span>
      </div>
      <div class="links">
        @if (auth.isHR()) {
          <a routerLink="/hr/search" routerLinkActive="active">Search</a>
          <a routerLink="/hr/profiles" routerLinkActive="active">Profiles</a>
          <a routerLink="/hr/dashboard" routerLinkActive="active">Dashboard</a>
        }
        @if (auth.isEmployee()) {
          <a routerLink="/employee/upload" routerLinkActive="active">Upload Resume</a>
          <a routerLink="/employee/profile" routerLinkActive="active">My Profile</a>
        }
      </div>
      <div class="user-area">
        <span class="user-email">{{ auth.currentUser()?.email }}</span>
        <span class="role-badge" [class]="auth.currentUser()?.role?.toLowerCase()">{{ auth.currentUser()?.role }}</span>
        <button class="logout-btn" (click)="auth.logout()">Sign out</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { display:flex; align-items:center; padding:.75rem 2rem; background:white; border-bottom:1px solid #e5e7eb; gap:2rem; }
    .brand { display:flex; align-items:center; gap:.5rem; }
    .logo { font-size:1.3rem; }
    .name { font-size:1.1rem; font-weight:700; color:#1a1a2e; }
    .links { display:flex; gap:1.5rem; flex:1; }
    .links a { color:#64748b; text-decoration:none; font-size:.9rem; font-weight:500; padding:.25rem 0; border-bottom:2px solid transparent; }
    .links a.active { color:#4f46e5; border-bottom-color:#4f46e5; }
    .user-area { display:flex; align-items:center; gap:.75rem; }
    .user-email { font-size:.85rem; color:#64748b; }
    .role-badge { padding:.2rem .6rem; border-radius:9999px; font-size:.75rem; font-weight:600; }
    .role-badge.hr { background:#dcfce7; color:#166534; }
    .role-badge.employee { background:#dbeafe; color:#1e40af; }
    .role-badge.admin { background:#fce7f3; color:#831843; }
    .logout-btn { padding:.4rem .9rem; background:transparent; border:1.5px solid #e5e7eb; border-radius:8px; font-size:.85rem; cursor:pointer; color:#64748b; }
    .logout-btn:hover { background:#f1f5f9; }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
