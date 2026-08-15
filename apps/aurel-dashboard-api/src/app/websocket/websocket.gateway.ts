import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';

interface DashboardEvent {
  type: 'plan.created' | 'plan.updated' | 'task.created' | 'task.started' | 'task.completed' | 'task.failed' | 'task.updated' | 'task.cancelled' | 'subagent.status.changed' | 'subagent.task.assigned' | 'subagent.task.progress' | 'subagent.task.completed' | 'metrics.collected';
  payload: any;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4203', 'http://localhost:4200'],
    credentials: true,
  },
  namespace: '/dashboard',
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DashboardGateway.name);
  @WebSocketServer() server!: Server;
  private connectedClients = new Map<string, { socket: Socket; userId?: string }>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen to orchestration events
    this.eventEmitter.on('plan.created', (plan) => this.broadcast('plan.created', plan));
    this.eventEmitter.on('plan.updated', (plan) => this.broadcast('plan.updated', plan));

    // Listen to task events
    this.eventEmitter.on('task.created', (task) => this.broadcast('task.created', task));
    this.eventEmitter.on('task.started', (task) => this.broadcast('task.started', task));
    this.eventEmitter.on('task.completed', ({ task, result }) => this.broadcast('task.completed', { task, result }));
    this.eventEmitter.on('task.failed', ({ task, error }) => this.broadcast('task.failed', { task, error }));
    this.eventEmitter.on('task.updated', (task) => this.broadcast('task.updated', task));
    this.eventEmitter.on('task.cancelled', (task) => this.broadcast('task.cancelled', task));

    // Listen to subagent events
    this.eventEmitter.on('subagent.status.changed', (data) => this.broadcast('subagent.status.changed', data));
    this.eventEmitter.on('subagent.task.assigned', (data) => this.broadcast('subagent.task.assigned', data));
    this.eventEmitter.on('subagent.task.progress', (data) => this.broadcast('subagent.task.progress', data));
    this.eventEmitter.on('subagent.task.completed', (data) => this.broadcast('subagent.task.completed', data));

    // Listen to metrics events
    this.eventEmitter.on('metrics.collected', (metrics) => this.broadcast('metrics.collected', metrics));
  }

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        this.connectedClients.set(client.id, { socket: client, userId: payload.sub });
        this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
      } catch (error) {
        this.logger.warn(`Client ${client.id} provided invalid token`);
      }
    } else {
      this.connectedClients.set(client.id, { socket: client });
      this.logger.log(`Client connected: ${client.id} (unauthenticated)`);
    }

    // Send initial connection confirmation
    client.emit('connected', { 
      message: 'Connected to Aurel Dashboard', 
      clientId: client.id,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { topics: string[] }): { success: boolean } {
    if (data.topics) {
      data.topics.forEach(topic => client.join(topic));
      this.logger.log(`Client ${client.id} subscribed to: ${data.topics.join(', ')}`);
    }
    return { success: true };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { topics: string[] }): { success: boolean } {
    if (data.topics) {
      data.topics.forEach(topic => client.leave(topic));
    }
    return { success: true };
  }

  @SubscribeMessage('get-state')
  handleGetState(@ConnectedSocket() client: Socket): { success: boolean; message: string } {
    // Client requests full state sync
    client.emit('state-sync', { message: 'Requesting full state from services' });
    return { success: true, message: 'State sync requested' };
  }

  private broadcast(eventType: DashboardEvent['type'], payload: any): void {
    const event: DashboardEvent = {
      type: eventType,
      payload,
      timestamp: new Date(),
    };

    this.server.emit('event', event);
    this.logger.debug(`Broadcasted ${eventType} to ${this.connectedClients.size} clients`);
  }

  // Public method for services to broadcast
  broadcastToAll(eventType: DashboardEvent['type'], payload: any): void {
    this.broadcast(eventType, payload);
  }

  broadcastToTopic(topic: string, eventType: DashboardEvent['type'], payload: any): void {
    const event: DashboardEvent = {
      type: eventType,
      payload,
      timestamp: new Date(),
    };
    this.server.to(topic).emit('event', event);
  }

  getConnectedCount(): number {
    return this.connectedClients.size;
  }
}