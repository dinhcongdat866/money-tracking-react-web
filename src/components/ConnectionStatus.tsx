'use client';

/**
 * Connection Status Indicator
 * 
 * Shows real-time WebSocket connection status to user.
 * Provides visual feedback and reconnection option.
 */

import { useWebSocket } from '@/providers/WebSocketProvider';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { status, isConnected } = useWebSocket();

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Leader',
      textColor: 'text-green-700 dark:text-green-400',
      description: 'This tab holds the WebSocket connection and broadcasts updates to other tabs.',
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Becoming leader...',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      description: 'Establishing leadership and WebSocket connection.',
    },
    reconnecting: {
      color: 'bg-orange-500',
      text: 'Reconnecting as leader...',
      textColor: 'text-orange-700 dark:text-orange-400',
      description: 'Attempting to restore leadership connection.',
    },
    disconnected: {
      color: 'bg-slate-400',
      text: 'Follower',
      textColor: 'text-slate-700 dark:text-slate-300',
      description: 'Receiving real-time updates from the leader tab via multi-tab sync.',
    },
  } as const;

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card">
      {/* Status indicator dot with pulse animation */}
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            config.color,
            !isConnected && 'animate-pulse'
          )}
        />
        {isConnected && (
          <div
            className={cn(
              'absolute w-2 h-2 rounded-full animate-ping',
              config.color,
              'opacity-75'
            )}
          />
        )}
      </div>

      {/* Status text */}
      <div className="flex flex-col">
        <span className={cn('text-sm font-medium', config.textColor)}>
          {config.text}
        </span>
        <span className="text-xs text-muted-foreground">
          {config.description}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version for tight spaces
 */
export function ConnectionStatusCompact() {
  const { status, isConnected } = useWebSocket();

  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Leader' },
    connecting: { color: 'bg-yellow-500', text: 'Becoming leader' },
    reconnecting: { color: 'bg-orange-500', text: 'Reconnecting' },
    disconnected: { color: 'bg-slate-400', text: 'Follower' },
  } as const;

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          config.color,
          !isConnected && 'animate-pulse'
        )}
      />
      <span className="text-sm text-muted-foreground">
        {config.text}
      </span>
    </div>
  );
}
