import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ChromeExtensionService } from '../chrome.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-recommendation',
  templateUrl: './product-recommendation.component.html',
  styleUrl: './product-recommendation.component.scss',
  imports: [CommonModule],
  standalone: true
})
export class ProductRecommendationComponent implements OnInit, OnDestroy {
  productName: string | null = null;
  productPrice: string | null = null;
  errorMessage: string | null = null;

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
}
