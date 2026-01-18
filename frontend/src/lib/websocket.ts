/**
 * WebSocket 客户端模块
 * 用于实时接收生成任务的进度更新
 */

// ============ 类型定义 ============

export type TaskStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled';

export interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  progress: number; // 0-100
  message?: string;
  estimatedTime?: number; // 预计剩余时间（秒）
  result?: TaskResult;
  error?: string;
}

export interface TaskResult {
  type: 'image' | 'video';
  url: string;
  thumbUrl?: string;
  versionId?: number;
}

export type WebSocketMessageType =
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'connection_established'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: TaskProgress | { message: string } | null;
  timestamp: number;
}

type TaskProgressCallback = (progress: TaskProgress) => void;
type ConnectionCallback = (connected: boolean) => void;
type ErrorCallback = (error: Error) => void;

// ============ WebSocket 客户端类 ============

export class TaskWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isManualClose = false;

  // 回调函数
  private taskCallbacks: Map<string, Set<TaskProgressCallback>> = new Map();
  private globalProgressCallbacks: Set<TaskProgressCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

  constructor(baseUrl: string = 'ws://localhost:8000') {
    this.url = `${baseUrl}/ws/tasks`;
  }

  // ============ 连接管理 ============

  /**
   * 建立 WebSocket 连接
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isManualClose = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] 连接已建立');
          this.reconnectAttempts = 0;
          this.startPingInterval();
          this.notifyConnectionChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] 连接已关闭', event.code, event.reason);
          this.stopPingInterval();
          this.notifyConnectionChange(false);

          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (event) => {
          console.error('[WebSocket] 连接错误', event);
          const error = new Error('WebSocket 连接错误');
          this.notifyError(error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, '客户端主动断开');
      this.ws = null;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ============ 任务订阅 ============

  /**
   * 订阅特定任务的进度更新
   */
  subscribeToTask(taskId: string, callback: TaskProgressCallback): () => void {
    if (!this.taskCallbacks.has(taskId)) {
      this.taskCallbacks.set(taskId, new Set());
    }
    this.taskCallbacks.get(taskId)!.add(callback);

    // 发送订阅消息到服务器
    this.send({
      type: 'subscribe',
      taskId,
    });

    // 返回取消订阅函数
    return () => {
      this.unsubscribeFromTask(taskId, callback);
    };
  }

  /**
   * 取消订阅特定任务
   */
  unsubscribeFromTask(taskId: string, callback: TaskProgressCallback): void {
    const callbacks = this.taskCallbacks.get(taskId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.taskCallbacks.delete(taskId);
        // 发送取消订阅消息到服务器
        this.send({
          type: 'unsubscribe',
          taskId,
        });
      }
    }
  }

  /**
   * 订阅所有任务进度（全局监听）
   */
  onProgress(callback: TaskProgressCallback): () => void {
    this.globalProgressCallbacks.add(callback);
    return () => {
      this.globalProgressCallbacks.delete(callback);
    };
  }

  /**
   * 监听连接状态变化
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * 监听错误
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  // ============ 消息处理 ============

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      switch (message.type) {
        case 'task_progress':
        case 'task_completed':
        case 'task_failed':
          this.handleTaskProgress(message.payload as TaskProgress);
          break;

        case 'connection_established':
          console.log('[WebSocket] 服务器确认连接');
          break;

        case 'pong':
          // 心跳响应，忽略
          break;

        default:
          console.log('[WebSocket] 未知消息类型:', message.type);
      }
    } catch (error) {
      console.error('[WebSocket] 消息解析错误:', error);
    }
  }

  private handleTaskProgress(progress: TaskProgress): void {
    // 通知特定任务的订阅者
    const taskCallbacks = this.taskCallbacks.get(progress.taskId);
    if (taskCallbacks) {
      taskCallbacks.forEach((callback) => {
        try {
          callback(progress);
        } catch (error) {
          console.error('[WebSocket] 回调执行错误:', error);
        }
      });
    }

    // 通知全局订阅者
    this.globalProgressCallbacks.forEach((callback) => {
      try {
        callback(progress);
      } catch (error) {
        console.error('[WebSocket] 全局回调执行错误:', error);
      }
    });

    // 任务完成或失败时，自动清理订阅
    if (progress.status === 'success' || progress.status === 'failed' || progress.status === 'cancelled') {
      this.taskCallbacks.delete(progress.taskId);
    }
  }

  // ============ 发送消息 ============

  private send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // ============ 心跳机制 ============

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 30000); // 每 30 秒发送心跳
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // ============ 重连机制 ============

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WebSocket] 将在 ${delay}ms 后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect().catch((error) => {
          console.error('[WebSocket] 重连失败:', error);
        });
      }
    }, delay);
  }

  // ============ 通知回调 ============

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error('[WebSocket] 连接状态回调错误:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('[WebSocket] 错误回调错误:', err);
      }
    });
  }
}

// ============ 单例实例 ============

let wsClientInstance: TaskWebSocketClient | null = null;

/**
 * 获取 WebSocket 客户端单例
 */
export function getWebSocketClient(baseUrl?: string): TaskWebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new TaskWebSocketClient(baseUrl);
  }
  return wsClientInstance;
}

/**
 * 重置 WebSocket 客户端（用于测试）
 */
export function resetWebSocketClient(): void {
  if (wsClientInstance) {
    wsClientInstance.disconnect();
    wsClientInstance = null;
  }
}

export default TaskWebSocketClient;
