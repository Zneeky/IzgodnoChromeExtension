import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true
})
export class LoginComponent {
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  async signIn() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (err) {
      this.errorMessage = 'Authentication failed.';
      console.error(err);
    }
  }
}
