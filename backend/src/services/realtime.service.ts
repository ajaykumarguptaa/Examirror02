import { Response } from 'express';
import { notificationService } from './notification.service';

interface SseClient {
  id: string;
  userType: 'admin' | 'center' | 'student';
  userId?: number | null;
  res: Response;
}

class RealtimeService {
  private clients: Map<string, SseClient> = new Map();
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Send keep-alive heartbeat comments every 25 seconds to prevent proxy / browser timeout
    this.keepAliveTimer = setInterval(() => {
      this.clients.forEach((client) => {
        try {
          client.res.write(': keepalive\n\n');
        } catch (_) {
          this.removeClient(client.id);
        }
      });
    }, 25000);
  }

  public addClient(userType: 'admin' | 'center' | 'student', userId: number | null, res: Response): string {
    const clientId = `${userType}-${userId || 'global'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Set SSE HTTP response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx
    res.flushHeaders?.();

    const client: SseClient = { id: clientId, userType, userId, res };
    this.clients.set(clientId, client);

    // Initial greeting / handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, userType, userId, timestamp: new Date().toISOString() })}\n\n`);

    // Clean up when client disconnects
    res.on('close', () => {
      this.removeClient(clientId);
    });

    res.on('error', () => {
      this.removeClient(clientId);
    });

    return clientId;
  }

  public removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.res.end();
      } catch (_) {}
      this.clients.delete(clientId);
    }
  }

  public getActiveClientCount(): { total: number; admin: number; center: number } {
    let admin = 0;
    let center = 0;
    this.clients.forEach((c) => {
      if (c.userType === 'admin') admin++;
      if (c.userType === 'center') center++;
    });
    return { total: this.clients.size, admin, center };
  }

  /**
   * Broadcast an event to all connected Super Admin instances
   */
  public emitToAdmin(event: string, payload: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    this.clients.forEach((client) => {
      if (client.userType === 'admin') {
        try {
          client.res.write(message);
        } catch (_) {
          this.removeClient(client.id);
        }
      }
    });
  }

  /**
   * Send an event to a specific Center (or all centers if centerId is null)
   */
  public emitToCenter(centerId: number | string | null, event: string, payload: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    const targetId = centerId !== null && centerId !== undefined ? Number(centerId) : null;

    this.clients.forEach((client) => {
      if (client.userType === 'center') {
        if (targetId === null || client.userId === null || client.userId === undefined || client.userId === targetId) {
          try {
            client.res.write(message);
          } catch (_) {
            this.removeClient(client.id);
          }
        }
      }
    });
  }

  /**
   * Broadcast an event to all active clients (admins, centers, students)
   */
  public broadcastAll(event: string, payload: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    this.clients.forEach((client) => {
      try {
        client.res.write(message);
      } catch (_) {
        this.removeClient(client.id);
      }
    });
  }

  /**
   * Convenience helper: Creates DB notification and pushes real-time event to Super Admin
   */
  public async notifyAdmin(title: string, message: string, eventType: string = 'info', extraData: any = {}) {
    let notificationId: number | null = null;
    try {
      notificationId = await notificationService.createNotification('admin', null, title, message, eventType);
    } catch (err) {
      console.error('[Realtime] Failed to write admin notification to DB:', err);
    }

    const payload = {
      id: notificationId,
      userType: 'admin',
      title,
      message,
      type: eventType,
      extraData,
      created_at: new Date().toISOString()
    };

    // Emit general notification event
    this.emitToAdmin('notification', payload);

    // Also emit specific named event if applicable (e.g. 'franchise_new', 'wallet_request')
    if (eventType && eventType !== 'info') {
      this.emitToAdmin(eventType, payload);
    }

    return payload;
  }

  /**
   * Convenience helper: Creates DB notification and pushes real-time event to Center
   */
  public async notifyCenter(centerId: number | null, title: string, message: string, eventType: string = 'info', extraData: any = {}) {
    let notificationId: number | null = null;
    try {
      notificationId = await notificationService.createNotification('center', centerId, title, message, eventType);
    } catch (err) {
      console.error(`[Realtime] Failed to write center notification to DB for center ${centerId}:`, err);
    }

    const payload = {
      id: notificationId,
      userType: 'center',
      userId: centerId,
      title,
      message,
      type: eventType,
      extraData,
      created_at: new Date().toISOString()
    };

    // Emit general notification event
    this.emitToCenter(centerId, 'notification', payload);

    // Also emit specific named event if applicable (e.g. 'franchise_approved', 'certificate_approved')
    if (eventType && eventType !== 'info') {
      this.emitToCenter(centerId, eventType, payload);
    }

    return payload;
  }
}

export const realtimeService = new RealtimeService();
