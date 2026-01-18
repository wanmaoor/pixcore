/**
 * WebSocket 相关的 React Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getWebSocketClient,
  TaskProgress,
  TaskStatus,
  TaskWebSocketClient,
} from '../lib/websocket';

// ============ 连接状态 Hook ============

interface UseWebSocketConnectionResult {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: Error | null;
}

/**
 * 管理 WebSocket 连接状态
 */
export function useWebSocketConnection(autoConnect = true): UseWebSocketConnectionResult {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<TaskWebSocketClient | null>(null);

  useEffect(() => {
    clientRef.current = getWebSocketClient();

    const unsubConnect = clientRef.current.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
      }
    });

    const unsubError = clientRef.current.onError((err) => {
      setError(err);
    });

    if (autoConnect) {
      clientRef.current.connect().catch((err) => {
        setError(err);
      });
    }

    return () => {
      unsubConnect();
      unsubError();
    };
  }, [autoConnect]);

  const connect = useCallback(async () => {
    if (clientRef.current) {
      try {
        setError(null);
        await clientRef.current.connect();
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  return { isConnected, connect, disconnect, error };
}

// ============ 任务进度 Hook ============

interface UseTaskProgressResult {
  progress: TaskProgress | null;
  status: TaskStatus | null;
  percentage: number;
  message: string;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  result: TaskProgress['result'] | null;
  error: string | null;
}

/**
 * 订阅单个任务的进度
 */
export function useTaskProgress(taskId: string | null): UseTaskProgressResult {
  const [progress, setProgress] = useState<TaskProgress | null>(null);

  useEffect(() => {
    if (!taskId) {
      setProgress(null);
      return;
    }

    const client = getWebSocketClient();
    const unsubscribe = client.subscribeToTask(taskId, (taskProgress) => {
      setProgress(taskProgress);
    });

    return () => {
      unsubscribe();
    };
  }, [taskId]);

  return {
    progress,
    status: progress?.status ?? null,
    percentage: progress?.progress ?? 0,
    message: progress?.message ?? '',
    isRunning: progress?.status === 'running' || progress?.status === 'queued',
    isCompleted: progress?.status === 'success',
    isFailed: progress?.status === 'failed',
    result: progress?.result ?? null,
    error: progress?.error ?? null,
  };
}

// ============ 多任务进度 Hook ============

interface UseMultiTaskProgressResult {
  tasks: Map<string, TaskProgress>;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  subscribe: (taskId: string) => void;
  unsubscribe: (taskId: string) => void;
  clearCompleted: () => void;
}

/**
 * 管理多个任务的进度
 */
export function useMultiTaskProgress(): UseMultiTaskProgressResult {
  const [tasks, setTasks] = useState<Map<string, TaskProgress>>(new Map());
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  const subscribe = useCallback((taskId: string) => {
    if (unsubscribeRefs.current.has(taskId)) {
      return; // 已经订阅
    }

    const client = getWebSocketClient();
    const unsubscribe = client.subscribeToTask(taskId, (progress) => {
      setTasks((prev) => {
        const next = new Map(prev);
        next.set(taskId, progress);
        return next;
      });
    });

    unsubscribeRefs.current.set(taskId, unsubscribe);
  }, []);

  const unsubscribe = useCallback((taskId: string) => {
    const unsub = unsubscribeRefs.current.get(taskId);
    if (unsub) {
      unsub();
      unsubscribeRefs.current.delete(taskId);
    }
    setTasks((prev) => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => {
      const next = new Map<string, TaskProgress>();
      prev.forEach((progress, taskId) => {
        if (progress.status !== 'success' && progress.status !== 'failed') {
          next.set(taskId, progress);
        } else {
          // 取消订阅已完成的任务
          const unsub = unsubscribeRefs.current.get(taskId);
          if (unsub) {
            unsub();
            unsubscribeRefs.current.delete(taskId);
          }
        }
      });
      return next;
    });
  }, []);

  // 清理所有订阅
  useEffect(() => {
    return () => {
      unsubscribeRefs.current.forEach((unsub) => unsub());
      unsubscribeRefs.current.clear();
    };
  }, []);

  const runningCount = Array.from(tasks.values()).filter(
    (t) => t.status === 'running' || t.status === 'queued'
  ).length;
  const completedCount = Array.from(tasks.values()).filter((t) => t.status === 'success').length;
  const failedCount = Array.from(tasks.values()).filter((t) => t.status === 'failed').length;

  return {
    tasks,
    runningCount,
    completedCount,
    failedCount,
    subscribe,
    unsubscribe,
    clearCompleted,
  };
}

// ============ 全局进度监听 Hook ============

interface UseGlobalTaskProgressResult {
  latestProgress: TaskProgress | null;
  allProgress: TaskProgress[];
}

/**
 * 监听所有任务进度（全局）
 */
export function useGlobalTaskProgress(maxHistory = 50): UseGlobalTaskProgressResult {
  const [progressHistory, setProgressHistory] = useState<TaskProgress[]>([]);

  useEffect(() => {
    const client = getWebSocketClient();
    const unsubscribe = client.onProgress((progress) => {
      setProgressHistory((prev) => {
        const next = [progress, ...prev];
        // 保留最近的 N 条记录
        return next.slice(0, maxHistory);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [maxHistory]);

  return {
    latestProgress: progressHistory[0] ?? null,
    allProgress: progressHistory,
  };
}
