/**
 * Mock WebSocket Server for Development
 * 
 * Simulates real-time updates for testing without backend.
 * Use this to test WebSocket integration locally.
 * 
 * Features:
 * - Simulates transaction created/updated/deleted events
 * - Simulates drag & drop from other devices
 * - Configurable event frequency
 * - Random data generation
 * 
 * Usage:
 * Run this in a separate terminal:
 * ```bash
 * npm run ws-server
 * ```
 */

import { WebSocket, WebSocketServer } from 'ws';
import {
  WebSocketEventType,
  type WebSocketEvent,
  type TransactionMovedEvent,
} from './types';

const PORT = 3001;

// Mock transaction data
const categories = ['income', 'food', 'transport', 'housing', 'shopping', 'utilities', 'other'];
const mockTransactions = [
  { id: '1', note: 'Salary', amount: 5000, type: 'income' as const },
  { id: '2', note: 'Coffee', amount: 5, type: 'expense' as const },
  { id: '3', note: 'Lunch', amount: 15, type: 'expense' as const },
  { id: '4', note: 'Uber', amount: 20, type: 'expense' as const },
  { id: '5', note: 'Rent', amount: 1500, type: 'expense' as const },
];

class MockWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    console.log(`🚀 Mock WebSocket Server started on ws://localhost:${port}`);
    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('✅ Client connected');
      this.clients.add(ws);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        console.log('❌ Client disconnected');
        this.clients.delete(ws);
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection:established',
        data: { message: 'Connected to mock WebSocket server' },
      });
    });
  }

  private handleMessage(ws: WebSocket, message: { type: string }): void {
    console.log('📨 Received:', message);

    // Handle ping
    if (message.type === WebSocketEventType.PING) {
      this.sendToClient(ws, {
        type: WebSocketEventType.PONG,
        data: {},
      });
      return;
    }

    // Broadcast transaction events to all other clients (not sender)
    if (
      message.type === WebSocketEventType.TRANSACTION_MOVED ||
      message.type === WebSocketEventType.TRANSACTION_CREATED ||
      message.type === WebSocketEventType.TRANSACTION_UPDATED ||
      message.type === WebSocketEventType.TRANSACTION_DELETED
    ) {
      console.log('📢 Broadcasting to other clients:', message.type);
      
      // Broadcast to all clients EXCEPT the sender
      this.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, message);
        }
      });
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  public broadcast<T>(event: Omit<WebSocketEvent<T>, 'id' | 'timestamp'>): void {
    const fullEvent: WebSocketEvent<T> = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    } as WebSocketEvent<T>;

    console.log('📢 Broadcasting:', fullEvent.type);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, fullEvent);
      }
    });
  }

  private sendToClient(ws: WebSocket, data: unknown): void {
    ws.send(JSON.stringify(data));
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simulate random transaction moved event
   */
  public simulateTransactionMoved(): void {
    const transaction = mockTransactions[Math.floor(Math.random() * mockTransactions.length)];
    const oldCategory = categories[Math.floor(Math.random() * categories.length)];
    let newCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // Ensure different category
    while (newCategory === oldCategory) {
      newCategory = categories[Math.floor(Math.random() * categories.length)];
    }

    // Generate version for message ordering
    const version = Date.now();
    const updatedAt = Date.now();

    this.broadcast<TransactionMovedEvent>({
      type: WebSocketEventType.TRANSACTION_MOVED,
      data: {
        transactionId: transaction.id,
        transaction: {
          id: transaction.id,
          note: transaction.note,
          amount: transaction.amount,
          type: transaction.type,
          date: new Date().toISOString(),
          category: {
            id: newCategory,
            name: this.getCategoryName(newCategory),
            icon: this.getCategoryIcon(newCategory),
          },
          version, // ✅ Version for ordering
          updatedAt, // ✅ Timestamp for fallback
        },
        oldCategory,
        newCategory,
        timestamp: Date.now(),
      },
    });

    console.log(`✨ Simulated: ${transaction.note} moved from ${oldCategory} to ${newCategory} (v${version})`);
  }

  private getCategoryName(categoryId: string): string {
    const map: Record<string, string> = {
      income: 'Income',
      food: 'Food & Dining',
      transport: 'Transportation',
      housing: 'Housing',
      shopping: 'Shopping',
      utilities: 'Utilities',
      other: 'Other',
    };
    return map[categoryId] || 'Other';
  }

  private getCategoryIcon(categoryId: string): string {
    const map: Record<string, string> = {
      income: '💰',
      food: '🍔',
      transport: '🚗',
      housing: '🏠',
      shopping: '💳',
      utilities: '📱',
      other: '❓',
    };
    return map[categoryId] || '❓';
  }
}

export { MockWebSocketServer };

// Auto-start server when file is executed
const _server = new MockWebSocketServer(PORT);

// Server is ready - will broadcast events when received from clients
console.log('✅ WebSocket server ready');
console.log('💡 Waiting for connections...');
console.log('💡 Press Ctrl+C to stop');
