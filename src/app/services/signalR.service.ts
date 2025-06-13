import { Injectable } from '@angular/core';
import {
    HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState
} from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private connectionId: string | null = null;

  private productResultSubject = new Subject<any>(); // You can strongly type this

  productResult$ = this.productResultSubject.asObservable(); // Expose as observable

  async connect(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      console.log('SignalR already connected.');
      return;
    }

    if (!this.hubConnection) {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl('https://localhost:7084/hubs/notification', {
          withCredentials: true,
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true
        })
        .withAutomaticReconnect([0, 2000, 50000, 100000])
        .build();

      this.hubConnection.on('ReceiveProductResult', (result) => {
        console.log('Received product result:', result);
        this.productResultSubject.next(result);
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

  async sendPing(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
        await this.hubConnection.send('Ping');
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
