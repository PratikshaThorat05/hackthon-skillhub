import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Create Account</h1>
        <p class="subtitle">Join SkillsHub</p>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="you@company.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Min 6 characters" />
          </div>
          <div class="field">
            <label>Role</label>
            <select formControlName="role">
              <option value="Employee">Employee</option>
              <option value="HR">HR</option>
            </select>
          </div>
          @if (error) { <div class="error-msg">{{ error }}</div> }
          <button type="submit" [disabled]="loading || form.invalid" class="btn-primary">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>
        <p class="link-text">Have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f4f8; }
    .auth-card { background:white; padding:2.5rem; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,.1); width:100%; max-width:400px; }
    h1 { font-size:1.8rem; font-weight:700; color:#1a1a2e; margin:0; }
    .subtitle { color:#666; margin:.25rem 0 1.5rem; }
    .field { margin-bottom:1rem; }
    label { display:block; font-size:.85rem; font-weight:600; color:#444; margin-bottom:.4rem; }
    input, select { width:100%; padding:.7rem 1rem; border:1.5px solid #ddd; border-radius:8px; font-size:.95rem; box-sizing:border-box; }
    input:focus, select:focus { outline:none; border-color:#4f46e5; }
    .btn-primary { width:100%; padding:.8rem; background:#4f46e5; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; margin-top:.5rem; }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    .error-msg { background:#fee2e2; color:#dc2626; padding:.6rem 1rem; border-radius:6px; font-size:.85rem; margin-bottom:.75rem; }
    .link-text { text-align:center; color:#666; font-size:.9rem; margin-top:1rem; }
    a { color:#4f46e5; text-decoration:none; font-weight:600; }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Employee', Validators.required]
  });
  loading = false;
  error = '';

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password, role } = this.form.value;
    this.auth.register({ email: email!, password: password!, role: role! }).subscribe({
      next: res => {
        if (res.success) this.router.navigate([role === 'HR' ? '/hr/search' : '/employee/upload']);
        else { this.error = res.error || 'Registration failed'; this.loading = false; }
      },
      error: () => { this.error = 'Registration failed.'; this.loading = false; }
    });
  }
}
