// chrome-extension.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChromeExtensionService {

  constructor() {}

  openPage(url: string): void {
    chrome.tabs.create({ url });
  }
}