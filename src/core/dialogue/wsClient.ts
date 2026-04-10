/**
 * WebSocket client for real-time chat.
 * NOT YET INTEGRATED into the main application.
 * Provides infrastructure for future WebSocket migration.
 */

const WS_BASE_URL =
  (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000').replace(/\/+$/, '');

export interface WSChatMessage {
  type: 'chat';
  userText: string;
  meta?: Record<string, unknown>;
}

export type WSServerEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; replyText: string; emotion: string; action: string }
  | { type: 'error'; message: string };

export type WSMessageHandler = (event: WSServerEvent) => void;

export class MetaHumanWSClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private messageHandler: WSMessageHandler | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect(onMessage: WSMessageHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      this.messageHandler = onMessage;
      const url = `${WS_BASE_URL}/ws?session_id=${encodeURIComponent(this.sessionId)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSServerEvent;
          this.messageHandler?.(data);
        } catch { /* ignore parse errors */ }
      };

      this.ws.onerror = (event) => reject(event);

      this.ws.onclose = () => this.attemptReconnect();
    });
  }

  send(message: WSChatMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.ws?.close();
    this.ws = null;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    setTimeout(() => {
      if (this.messageHandler) {
        this.connect(this.messageHandler).catch(() => {});
      }
    }, delay);
  }
}
