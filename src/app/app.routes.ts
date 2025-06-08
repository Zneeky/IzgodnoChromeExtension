import { Routes } from '@angular/router';
import { ProductRecommendationComponent } from './product-recommendation/product-recommendation.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './services/auth-guard.service';
export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
      path: 'product-recommendation',
      component: ProductRecommendationComponent,
      canActivate: [AuthGuard]
    },
    {
      path: '',
      redirectTo: '/product-recommendation',
      pathMatch: 'full'
    },
    { path: '**', redirectTo: 'product-recommendation' }
  ];
