import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ChromeExtensionService } from '../chrome.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-recommendation',
  templateUrl: './product-recommendation.component.html',
  styleUrl: './product-recommendation.component.scss',
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class ProductRecommendationComponent {
  @Input() product!: { name: string; price: string; imageUrl: string };
  @Input() offers: { vendor: string; name: string; price: string; productPageUrl: string }[] = [];

  openInNewTab(url: string): void {
    chrome.runtime.sendMessage({ action: 'openTab', url });
  }
}
