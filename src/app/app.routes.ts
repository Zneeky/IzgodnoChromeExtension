import { Routes } from '@angular/router';
import { ProductRecommendationComponent } from './product-recommendation/product-recommendation.component';

export const routes: Routes = [
    {
      path: '',
      redirectTo: '/product-recommendation',
      pathMatch: 'full'
    },
    {
      path: 'product-recommendation',
      component: ProductRecommendationComponent
    }
  ];
