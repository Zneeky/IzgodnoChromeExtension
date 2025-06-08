import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = false;

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
  }

  async checkAuth(): Promise<boolean> {
    const response = await fetch('https://localhost:7084/api/Auth/check-auth', {
      method: 'GET',
      credentials: 'include'
    });

    this.isAuthenticated = response.ok;
    return this.isAuthenticated;
  }

  async logout(): Promise<void> {
    await fetch('https://localhost:7084/api/Auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    this.isAuthenticated = false;
  }
}