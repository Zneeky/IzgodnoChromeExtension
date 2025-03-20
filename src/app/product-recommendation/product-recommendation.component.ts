import { Component } from '@angular/core';
import { ChromeExtensionService } from '../chrome.service';

@Component({
  selector: 'app-product-recommendation',
  imports: [],
  templateUrl: './product-recommendation.component.html',
  styleUrl: './product-recommendation.component.scss'
})
export class ProductRecommendationComponent {
  constructor(private chromeExtensionService: ChromeExtensionService) {}

  openProductPage() {
    this.chromeExtensionService.openPage('https://example.com');
  }
}
