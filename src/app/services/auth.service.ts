import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SignalRService } from './signalR.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = false;

  constructor(private router: Router, private signalRService: SignalRService) {}

  async loginWithGoogle(): Promise<void> {
    const clientId = '798771494784-paefnc51m7osprf9hv7a75d908gp5jts.apps.googleusercontent.com';
    const redirectUri = chrome.identity.getRedirectURL('oauth2');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&response_type=id_token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=openid%20email` +
      `&nonce=${crypto.randomUUID()}` +
      `&prompt=select_account`;

    const idToken = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true
        },
        (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            return reject(chrome.runtime.lastError || new Error('Auth failed'));
          }

          const idTokenMatch = redirectUrl.match(/[#&]id_token=([^&]*)/);
          if (idTokenMatch && idTokenMatch[1]) {
            resolve(idTokenMatch[1]);
          } else {
            reject(new Error('No ID token found in redirect URL'));
          }
        }
      );
    });

    const response = await fetch('https://localhost:7084/api/Auth/google-login', {
      method: 'POST',
      credentials: 'include', // to store JWT cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) throw new Error('Backend authentication failed');

    this.isAuthenticated = true;
    await this.signalRService.connect();
  }

  async logout(): Promise<void> {
    await fetch('https://localhost:7084/api/Auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }

  async fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const isValid = await this.tryAuthenticate();
    if (!isValid) this.router.navigate(['/login']);

    const response = await fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    });

    return response;
  }

  async tryAuthenticate(): Promise<boolean> {
    const isAuth = await fetch('https://localhost:7084/api/Auth/check-auth', {
        method: 'GET',
        credentials: 'include',
        headers: {
        'Content-Type': 'application/json'
        }
    });

    if (isAuth.ok) {
        this.isAuthenticated = true;
        await this.signalRService.connect();
        return true;
    } 

    // Try refresh
    const refreshResponse = await fetch('https://localhost:7084/api/Auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (refreshResponse.ok) {
        this.isAuthenticated = true;
        await this.signalRService.connect();
        return true;
    }

    this.isAuthenticated = false;
    return false;
   }
}