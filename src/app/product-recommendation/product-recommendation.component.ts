import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
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
export class ProductRecommendationComponent implements OnInit, OnDestroy {
  productName: string | null = null;
  productPrice: string | null = null;
  productImageUrl: string | null = null;
  errorMessage: string | null = null;
  public manualProduct: string = '';
  recommendations: { vendor: string; price: string; productPageUrl: string; }[] = [];

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    // Initial extraction on popup open
    this.extractFromActiveTab();

    // Re-extract when tab changes or updates
    chrome.tabs.onActivated.addListener(this.extractFromActiveTab);
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate);

    // Listen for product info from content script
    chrome.runtime.onMessage.addListener(this.handleProductInfo);
  }

  ngOnDestroy(): void {
    chrome.runtime.onMessage.removeListener(this.handleProductInfo);
    chrome.tabs.onActivated.removeListener(this.extractFromActiveTab);
    chrome.tabs.onUpdated.removeListener(this.handleTabUpdate);
  }

  handleProductInfo = (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message.type === 'PRODUCT_INFO') {
      this.ngZone.run(() => {
        this.productName = message.payload.name || 'Not found';
        this.productPrice = message.payload.price || 'Not found';
        this.productImageUrl = message.payload.image || 'https://pngimg.com/d/iphone16_PNG2.png';
        this.generateMockRecommendations(this.productName || 'Product');
        if (message.payload.error) {
          this.errorMessage = `Error: ${message.payload.error}`;
        }
      });
    }
  };

  // Called on tab activation or manually
  extractFromActiveTab = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ['assets/scripts/extract-product-info.js']
          },
          () => {
            if (chrome.runtime.lastError) {
              this.errorMessage = `Injection failed: ${chrome.runtime.lastError.message}`;
            }
          }
        );
      } else {
        this.errorMessage = 'No active tab found.';
      }
    });
  };

  // Optional: handle page refresh or navigation inside tab
  handleTabUpdate = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (changeInfo.status === 'complete') {
      this.extractFromActiveTab();
    }
  };

  generateMockRecommendations(productName: string): void {
    const vendors = ['emag.bg', 'technopolis.bg', 'ozone.bg', 'plesio.bg', 'desktop.bg'];
    const basePrice = parseFloat(this.productPrice?.replace(/[^\d.]/g, '') || '1000');
  
    this.recommendations = vendors.map((vendor, index) => {
      const priceOffset = Math.round((Math.random() * 100 - 50)); // ±50 range
      const price = (basePrice + priceOffset).toFixed(2);
      const currency = this.productPrice?.includes('лв') ? 'лв.' : 'BGN';
  
      return {
        vendor,
        price: `${price} ${currency}`,
        productPageUrl: `https://${vendor}/search?q=${encodeURIComponent(productName)}`
      };
    });
  
    // Sort from cheapest to most expensive
    this.recommendations.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }
}
