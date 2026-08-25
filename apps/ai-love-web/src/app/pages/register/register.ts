import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  name = '';
  surname = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  async submit(): Promise<void> {
    if (this.loading || !this.name || !this.surname || !this.email || !this.password) return;

    this.loading = true;
    this.error = '';

    try {
      await this.auth.register({
        email: this.email,
        password: this.password,
        name: this.name,
        surname: this.surname,
      });
      void this.router.navigate(['/companions']);
    } catch (err: any) {
      this.error = err.error?.message || 'Registration failed. Please try again.';
      this.loading = false;
    }
  }
}