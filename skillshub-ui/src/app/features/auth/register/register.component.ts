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
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-inner">
          <div class="brand-logo">S</div>
          <h1 class="brand-title">SkillsHub</h1>
          <p class="brand-tagline">AI-Powered Talent Intelligence</p>
          <div class="brand-features">
            <div class="feat"><span class="feat-icon">✦</span><span>Natural language talent search</span></div>
            <div class="feat"><span class="feat-icon">✦</span><span>AI-powered resume parsing</span></div>
            <div class="feat"><span class="feat-icon">✦</span><span>Skills gap analysis</span></div>
            <div class="feat"><span class="feat-icon">✦</span><span>Real-time talent directory</span></div>
          </div>
        </div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-inner">
          @if (success) {
            <div class="success-state">
              <div class="success-icon">✓</div>
              <h2>Account created!</h2>
              <p>Your account has been created successfully. Please sign in to continue.</p>
              <a routerLink="/login" class="btn-primary">Go to Sign In</a>
            </div>
          } @else {
            <div class="form-header">
              <h2>Create your account</h2>
              <p>Join SkillsHub to manage your talent profile</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="field">
                <label>Email address</label>
                <input type="email" formControlName="email" placeholder="you@company.com"
                       [class.invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
              </div>
              <div class="field">
                <label>Password</label>
                <input type="password" formControlName="password" placeholder="Min 6 characters"
                       [class.invalid]="form.get('password')?.invalid && form.get('password')?.touched" />
                <span class="field-hint">Must be at least 6 characters</span>
              </div>
              <div class="field">
                <label>I am joining as</label>
                <div class="role-options">
                  <label class="role-option" [class.selected]="form.get('role')?.value === 'Employee'">
                    <input type="radio" formControlName="role" value="Employee" />
                    <span class="role-label">
                      <span class="role-title">Employee</span>
                      <span class="role-desc">Upload my resume & manage my profile</span>
                    </span>
                  </label>
                  <label class="role-option" [class.selected]="form.get('role')?.value === 'HR'">
                    <input type="radio" formControlName="role" value="HR" />
                    <span class="role-label">
                      <span class="role-title">HR Manager</span>
                      <span class="role-desc">Search talent & manage team profiles</span>
                    </span>
                  </label>
                </div>
              </div>

              @if (error) {
                <div class="alert-error">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  {{ error }}
                </div>
              }

              <button type="submit" [disabled]="loading || form.invalid" class="btn-primary">
                @if (loading) {
                  <span class="btn-spinner"></span> Creating account...
                } @else {
                  Create Account
                }
              </button>
            </form>

            <p class="form-footer">Already have an account? <a routerLink="/login">Sign in</a></p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; }
    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }
    .brand-inner { max-width: 380px; }
    .brand-logo { width: 56px; height: 56px; background: #4f46e5; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; color: white; margin-bottom: 1.5rem; }
    .brand-title { font-size: 2.25rem; font-weight: 800; color: white; margin: 0 0 .5rem; }
    .brand-tagline { font-size: 1.05rem; color: #a5b4fc; margin: 0 0 2.5rem; }
    .brand-features { display: flex; flex-direction: column; gap: .9rem; }
    .feat { display: flex; align-items: center; gap: .75rem; color: #c7d2fe; font-size: .9rem; }
    .feat-icon { color: #818cf8; font-size: .75rem; }

    .auth-form-panel { width: 480px; background: white; display: flex; align-items: center; justify-content: center; padding: 3rem; }
    .auth-form-inner { width: 100%; max-width: 360px; }
    .form-header { margin-bottom: 2rem; }
    .form-header h2 { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 .35rem; }
    .form-header p { color: #64748b; font-size: .9rem; margin: 0; }

    .field { margin-bottom: 1.1rem; }
    .field label { display: block; font-size: .8rem; font-weight: 600; color: #374151; margin-bottom: .4rem; letter-spacing: .01em; }
    .field input[type=email], .field input[type=password] {
      width: 100%;
      padding: .7rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: .95rem;
      font-family: inherit;
      color: #0f172a;
      transition: border-color .15s;
    }
    .field input[type=email]:focus, .field input[type=password]:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
    .field input.invalid { border-color: #ef4444; }
    .field input::placeholder { color: #94a3b8; }
    .field-hint { display: block; font-size: .75rem; color: #94a3b8; margin-top: .3rem; }

    .role-options { display: flex; flex-direction: column; gap: .5rem; }
    .role-option {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .75rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: .15s;
    }
    .role-option input[type=radio] { display: none; }
    .role-option.selected { border-color: #4f46e5; background: #f5f3ff; }
    .role-option:hover:not(.selected) { border-color: #a5b4fc; background: #fafafe; }
    .role-label { display: flex; flex-direction: column; }
    .role-title { font-size: .875rem; font-weight: 600; color: #0f172a; }
    .role-desc { font-size: .75rem; color: #64748b; }

    .alert-error {
      display: flex;
      align-items: center;
      gap: .5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: .65rem .9rem;
      border-radius: 8px;
      font-size: .85rem;
      margin-bottom: 1rem;
    }
    .alert-error svg { width: 16px; height: 16px; flex-shrink: 0; }

    .btn-primary {
      width: 100%;
      padding: .8rem;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: .95rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .5rem;
      transition: background .15s;
      margin-top: .5rem;
      text-decoration: none;
    }
    .btn-primary:hover:not(:disabled) { background: #4338ca; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .form-footer { text-align: center; color: #64748b; font-size: .875rem; margin-top: 1.5rem; }
    .form-footer a { color: #4f46e5; text-decoration: none; font-weight: 600; }
    .form-footer a:hover { text-decoration: underline; }

    .success-state { text-align: center; padding: 1rem 0; }
    .success-icon {
      width: 64px;
      height: 64px;
      background: #dcfce7;
      color: #16a34a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 auto 1.25rem;
    }
    .success-state h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 .5rem; }
    .success-state p { color: #64748b; font-size: .9rem; margin: 0 0 1.5rem; }
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
  success = false;

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password, role } = this.form.value;
    this.auth.register({ email: email!, password: password!, role: role! }).subscribe({
      next: res => {
        this.loading = false;
        if (res.success) {
          // Clear the auto-login session so user arrives at /login logged out
          this.auth.clearSession();
          this.success = true;
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.error = res.error || 'Registration failed';
        }
      },
      error: () => { this.error = 'Registration failed.'; this.loading = false; }
    });
  }
}
