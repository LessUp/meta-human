/**
 * WebSocket client for real-time chat.
 * NOT YET INTEGRATED into the main application.
 * Provides infrastructure for future WebSocket migration.
 */

const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000').replace(/\/+$/, '');

export function getWebSocketUrl(sessionId: string): string {
  return `${WS_BASE_URL}/ws?session_id=${encodeURIComponent(sessionId)}`;
}

export function probeWebSocketEndpoint(timeoutMs = 1200): Promise<boolean> {
  if (typeof WebSocket === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const probeSessionId = `probe_${Date.now()}`;
    const ws = new WebSocket(getWebSocketUrl(probeSessionId));
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const finish = (result: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      try {
        ws.close();
      } catch {
        // ignore close errors during probe cleanup
      }

      resolve(result);
    };

    timeoutId = setTimeout(() => finish(false), timeoutMs);

    ws.onopen = () => finish(true);
    ws.onerror = () => finish(false);
    ws.onclose = () => finish(false);
  });
}

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
  private resolveConnect: (() => void) | null = null;
  private rejectConnect: ((reason?: unknown) => void) | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect(onMessage: WSMessageHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      this.messageHandler = onMessage;
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
      const url = getWebSocketUrl(this.sessionId);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.resolveConnect = null;
        this.rejectConnect = null;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSServerEvent;
          this.messageHandler?.(data);
        } catch {
          /* ignore parse errors */
        }
      };

      this.ws.onerror = (event) => {
        this.resolveConnect = null;
        this.rejectConnect = null;
        reject(event);
      };

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
    if (this.rejectConnect) {
      this.rejectConnect(new Error('WebSocket disconnected'));
      this.rejectConnect = null;
      this.resolveConnect = null;
    }
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
