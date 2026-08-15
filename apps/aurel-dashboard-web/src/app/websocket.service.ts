import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export interface DashboardEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly eventsSubject = new Subject<DashboardEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private readonly zone: NgZone) {}

  connect(token?: string): void {
    if (this.socket?.connected) return;

    const wsUrl = 'http://localhost:3003';
    
    this.socket = io(`${wsUrl}/dashboard`, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      console.log('[WebSocket] Connected to dashboard');
      this.socket?.emit('subscribe', { topics: ['plans', 'tasks', 'subagents', 'metrics'] });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      this.reconnectAttempts++;
      console.error('[WebSocket] Connection error:', error.message);
    });

    this.socket.on('event', (event: DashboardEvent) => {
      this.zone.run(() => {
        this.eventsSubject.next(event);
      });
    });

    this.socket.on('connected', (data: any) => {
      console.log('[WebSocket] Server confirmed connection:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get events$(): Observable<DashboardEvent> {
    return this.eventsSubject.asObservable();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  subscribe(topics: string[]): void {
    this.socket?.emit('subscribe', { topics });
  }

  unsubscribe(topics: string[]): void {
    this.socket?.emit('unsubscribe', { topics });
  }

  requestStateSync(): void {
    this.socket?.emit('get-state', {});
  }
}