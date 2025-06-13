import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './services/auth-guard.service';
import { HomeComponent } from './home/home.component';
export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
      path: 'home',
      component: HomeComponent,
      canActivate: [AuthGuard]
    },
    {
      path: '',
      redirectTo: '/home',
      pathMatch: 'full'
    },
    { path: '**', redirectTo: 'home' }
  ];
