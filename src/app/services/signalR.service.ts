import { Injectable } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState
} from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private connectionId: string | null = null;

  async connect(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      console.log('SignalR already connected.');
      return;
    }

    if (!this.hubConnection) {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl('https://localhost:7084/hubs/notification', {
          withCredentials: true
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection.on('ReceiveProductResult', (result) => {
        console.log('Received product result:', result);
        // TODO: emit via Subject or update UI
      });

      this.hubConnection.onreconnecting(() => {
        console.warn('SignalR reconnecting...');
      });

      this.hubConnection.onreconnected(() => {
        console.log('SignalR reconnected.');
      });

      this.hubConnection.onclose((err) => {
        console.error('SignalR connection closed:', err);
        this.connectionId = null;
      });
    }

    try {
      await this.hubConnection.start();
      console.log('SignalR connected.');
      this.connectionId = await this.hubConnection.invoke<string>('GetConnectionId');
    } catch (error) {
      console.error('SignalR connection failed:', error);
      throw error;
    }
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state !== HubConnectionState.Disconnected) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionId = null;
    }
  }
}
