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
  const { status, isConnected, reconnect } = useWebSocket();

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Live',
      textColor: 'text-green-700 dark:text-green-400',
      description: 'Real-time updates enabled',
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      description: 'Establishing connection',
    },
    reconnecting: {
      color: 'bg-orange-500',
      text: 'Reconnecting...',
      textColor: 'text-orange-700 dark:text-orange-400',
      description: 'Attempting to reconnect',
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'Offline',
      textColor: 'text-red-700 dark:text-red-400',
      description: 'No real-time updates',
    },
  };

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

      {/* Reconnect button (only show when disconnected) */}
      {status === 'disconnected' && (
        <button
          onClick={reconnect}
          className="ml-auto text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for tight spaces
 */
export function ConnectionStatusCompact() {
  const { status, isConnected } = useWebSocket();

  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Live' },
    connecting: { color: 'bg-yellow-500', text: 'Connecting' },
    reconnecting: { color: 'bg-orange-500', text: 'Reconnecting' },
    disconnected: { color: 'bg-red-500', text: 'Offline' },
  };

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
