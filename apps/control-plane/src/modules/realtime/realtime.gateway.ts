import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import IORedis from 'ioredis';

import { getEnv } from '../../config/env';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private subscriber!: IORedis;
  private readonly runSubscriptions = new Map<string, Set<string>>(); // runId -> socketIds

  afterInit() {
    // Dedicated Redis subscriber connection
    this.subscriber = new IORedis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    // Subscribe to global channel for overview
    this.subscriber.subscribe('sf:pubsub:global', (err) => {
      if (err) this.logger.error('Failed to subscribe to global channel', err);
      else this.logger.log('Subscribed to sf:pubsub:global');
    });

    // Forward all messages to appropriate rooms
    this.subscriber.on('message', (channel: string, message: string) => {
      try {
        const event = JSON.parse(message);

        if (channel === 'sf:pubsub:global') {
          // Broadcast to all connected clients on overview room
          this.server.to('overview').emit('simulation:event', event);
        } else if (channel.startsWith('sf:pubsub:run:')) {
          const runId = channel.replace('sf:pubsub:run:', '');
          // Broadcast to clients watching this run
          this.server.to(`run:${runId}`).emit('simulation:event', event);
        }
      } catch (err) {
        this.logger.warn('Failed to parse Redis message', err);
      }
    });

    this.logger.log('RealtimeGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Auto-join overview room
    client.join('overview');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up run subscriptions
    this.runSubscriptions.forEach((sockets, runId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        // No more clients watching this run — unsubscribe from Redis
        this.subscriber
          .unsubscribe(`sf:pubsub:run:${runId}`)
          .catch((err) =>
            this.logger.warn(`Failed to unsubscribe run ${runId}`, err),
          );
        this.runSubscriptions.delete(runId);
      }
    });
  }

  @SubscribeMessage('watch:run')
  async handleWatchRun(
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { runId } = data;
    if (!runId) return;

    // Join the run room
    client.join(`run:${runId}`);

    // Subscribe to Redis channel if not already
    if (!this.runSubscriptions.has(runId)) {
      this.runSubscriptions.set(runId, new Set());
      await this.subscriber.subscribe(`sf:pubsub:run:${runId}`);
      this.logger.log(`Subscribed to run ${runId}`);
    }

    this.runSubscriptions.get(runId)!.add(client.id);

    client.emit('watch:run:ack', { runId, status: 'watching' });
    this.logger.log(`Client ${client.id} watching run ${runId}`);
  }

  @SubscribeMessage('unwatch:run')
  async handleUnwatchRun(
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { runId } = data;
    if (!runId) return;

    client.leave(`run:${runId}`);

    const sockets = this.runSubscriptions.get(runId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        await this.subscriber.unsubscribe(`sf:pubsub:run:${runId}`);
        this.runSubscriptions.delete(runId);
        this.logger.log(`Unsubscribed from run ${runId}`);
      }
    }
  }
}
