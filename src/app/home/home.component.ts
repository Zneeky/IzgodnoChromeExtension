import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ProductRecommendationComponent } from '../product-recommendation/product-recommendation.component';
import { SignalRService } from '../services/signalR.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ProductRecommendationComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
})
export class HomeComponent {
  stage: 'idle' | 'loading' | 'done' = 'idle';

  product: { name: string; price: string; imageUrl: string } | null = null;
  offers: { vendor: string; price: string; productPageUrl: string }[] = [];

  public constructor(private  signalRService: SignalRService ){

  }

  ngOnInit():void{
    this.signalRService.productResult$.subscribe(result => {
        this.offers = result.offers.map((offer: { store: any; price: number; url: any; }) => ({
          vendor: offer.store,
          price: `${offer.price.toFixed(2)} лв.`,
          productPageUrl: offer.url
        }));
      this.stage = 'done';
    });
  }

  extractFromActiveTab(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ['assets/scripts/extract-product-info.js']
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Injection failed', chrome.runtime.lastError.message);
          }
        }
      );
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'PRODUCT_INFO') {
        this.product = {
          name: message.payload.name,
          price: message.payload.price,
          imageUrl: message.payload.image || 'https://via.placeholder.com/80'
        };

        console.log(this.product)
        this.callLookup(this.product);
      }
    });
  }

  startRecommendationFlow() {
    this.stage = 'loading';
    this.extractFromActiveTab()
  }

  async callLookup(product: { name: string; price: string; imageUrl: string }) {
    this.stage = 'loading';

    const connectionId = this.signalRService.getConnectionId();

    await fetch('https://localhost:7084/api/product/lookup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: product.name,
        source: 'some source',
        connectionId
      })
    });
  }
}
