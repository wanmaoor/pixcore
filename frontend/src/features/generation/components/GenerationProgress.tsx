/**
 * 生成任务进度指示器组件
 */

import { Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { useTaskProgress } from '../../../hooks/useWebSocket';
import { TaskStatus } from '../../../lib/websocket';

interface GenerationProgressProps {
  taskId: string | null;
  showEstimatedTime?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onComplete?: (result: { type: 'image' | 'video'; url: string }) => void;
  onError?: (error: string) => void;
}

/**
 * 单个任务的进度指示器
 */
export function GenerationProgress({
  taskId,
  showEstimatedTime = true,
  size = 'md',
  onComplete,
  onError,
}: GenerationProgressProps) {
  const { progress, status, percentage, message, isCompleted, isFailed, result, error } =
    useTaskProgress(taskId);

  // 完成或失败时触发回调
  if (isCompleted && result && onComplete) {
    onComplete(result);
  }
  if (isFailed && error && onError) {
    onError(error);
  }

  if (!taskId || !progress) {
    return null;
  }

  const sizeClasses = {
    sm: { container: 'p-2', icon: 'w-4 h-4', text: 'text-xs', bar: 'h-1' },
    md: { container: 'p-3', icon: 'w-5 h-5', text: 'text-sm', bar: 'h-1.5' },
    lg: { container: 'p-4', icon: 'w-6 h-6', text: 'text-base', bar: 'h-2' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${classes.container} bg-zinc-900 rounded-lg border border-zinc-800`}>
      <div className="flex items-center gap-3">
        <StatusIcon status={status} className={classes.icon} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`${classes.text} text-zinc-200 truncate`}>
              {getStatusText(status)}
            </span>
            <span className={`${classes.text} text-zinc-400`}>{percentage}%</span>
          </div>

          {/* 进度条 */}
          <div className={`${classes.bar} bg-zinc-800 rounded-full overflow-hidden`}>
            <div
              className={`h-full transition-all duration-300 ${getProgressBarColor(status)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* 消息和预计时间 */}
          {(message || (showEstimatedTime && progress.estimatedTime)) && (
            <div className="flex items-center justify-between mt-1">
              {message && (
                <span className={`${classes.text} text-zinc-500 truncate`}>{message}</span>
              )}
              {showEstimatedTime && progress.estimatedTime && status === 'running' && (
                <span className={`${classes.text} text-zinc-500 flex items-center gap-1`}>
                  <Clock className="w-3 h-3" />
                  约 {formatTime(progress.estimatedTime)}
                </span>
              )}
            </div>
          )}

          {/* 错误信息 */}
          {isFailed && error && (
            <p className={`${classes.text} text-red-400 mt-1 truncate`}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ 迷你进度指示器 ============

interface MiniProgressProps {
  taskId: string | null;
  className?: string;
}

/**
 * 迷你进度指示器（仅图标和百分比）
 */
export function MiniProgress({ taskId, className = '' }: MiniProgressProps) {
  const { status, percentage, isRunning } = useTaskProgress(taskId);

  if (!taskId) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <StatusIcon status={status} className="w-4 h-4" />
      {isRunning && <span className="text-xs text-zinc-400">{percentage}%</span>}
    </div>
  );
}

// ============ 批量进度指示器 ============

interface BatchProgressProps {
  taskIds: string[];
  title?: string;
}

/**
 * 批量任务进度指示器
 */
export function BatchProgress({ taskIds, title = '生成任务' }: BatchProgressProps) {
  const progressData = taskIds.map((id) => useTaskProgress(id));

  const total = taskIds.length;
  const completed = progressData.filter((p) => p.isCompleted).length;
  const failed = progressData.filter((p) => p.isFailed).length;
  const running = progressData.filter((p) => p.isRunning).length;

  const overallPercentage =
    total > 0 ? Math.round(progressData.reduce((sum, p) => sum + p.percentage, 0) / total) : 0;

  if (total === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-200">{title}</span>
        <span className="text-xs text-zinc-400">
          {completed}/{total} 完成
        </span>
      </div>

      {/* 总进度条 */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${overallPercentage}%` }}
        />
      </div>

      {/* 状态统计 */}
      <div className="flex items-center gap-4 text-xs">
        {running > 0 && (
          <div className="flex items-center gap-1 text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{running} 进行中</span>
          </div>
        )}
        {completed > 0 && (
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>{completed} 完成</span>
          </div>
        )}
        {failed > 0 && (
          <div className="flex items-center gap-1 text-red-400">
            <XCircle className="w-3 h-3" />
            <span>{failed} 失败</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 辅助组件 ============

interface StatusIconProps {
  status: TaskStatus | null;
  className?: string;
}

function StatusIcon({ status, className = 'w-5 h-5' }: StatusIconProps) {
  switch (status) {
    case 'queued':
      return <Clock className={`${className} text-zinc-400`} />;
    case 'running':
      return <Loader2 className={`${className} text-blue-400 animate-spin`} />;
    case 'success':
      return <CheckCircle className={`${className} text-green-400`} />;
    case 'failed':
      return <XCircle className={`${className} text-red-400`} />;
    case 'cancelled':
      return <XCircle className={`${className} text-zinc-400`} />;
    default:
      return <Zap className={`${className} text-zinc-400`} />;
  }
}

function getStatusText(status: TaskStatus | null): string {
  switch (status) {
    case 'queued':
      return '排队中...';
    case 'running':
      return '生成中...';
    case 'success':
      return '生成完成';
    case 'failed':
      return '生成失败';
    case 'cancelled':
      return '已取消';
    default:
      return '准备中...';
  }
}

function getProgressBarColor(status: TaskStatus | null): string {
  switch (status) {
    case 'running':
      return 'bg-blue-500';
    case 'success':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-zinc-600';
  }
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}分钟`;
  }
  return `${minutes}分${remainingSeconds}秒`;
}
