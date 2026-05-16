import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    @if (auth.isLoggedIn()) {
      <div class="app-shell">
        <app-navbar />
        <main class="main-content" id="main-content" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    } @else {
      <router-outlet />
    }
  `
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
