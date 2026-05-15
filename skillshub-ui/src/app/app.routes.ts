import { Routes } from '@angular/router';
import { authGuard, hrGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'employee',
    canActivate: [authGuard],
    children: [
      { path: 'upload', loadComponent: () => import('./features/employee/upload/upload.component').then(m => m.UploadComponent) },
      { path: 'profile', loadComponent: () => import('./features/employee/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  },
  {
    path: 'hr',
    canActivate: [hrGuard],
    children: [
      { path: 'search', loadComponent: () => import('./features/hr/search/search.component').then(m => m.HrSearchComponent) },
      { path: 'profiles', loadComponent: () => import('./features/hr/review/profiles.component').then(m => m.ProfilesComponent) },
      { path: 'dashboard', loadComponent: () => import('./features/hr/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile/:id', loadComponent: () => import('./features/hr/profile-view/profile-view.component').then(m => m.ProfileViewComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
