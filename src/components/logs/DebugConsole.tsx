import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface LogEntry {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: string;
}

interface DebugConsoleProps {
  logs: string[];
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({ logs }) => {
  const parseLogType = (log: string): LogEntry => {
    const timestamp = new Date().toISOString();
    if (log.toLowerCase().includes('error')) {
      return { message: log, type: 'error', timestamp };
    } else if (log.toLowerCase().includes('warning')) {
      return { message: log, type: 'warning', timestamp };
    } else if (log.toLowerCase().includes('success')) {
      return { message: log, type: 'success', timestamp };
    }
    return { message: log, type: 'info', timestamp };
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-dashboard-error" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-dashboard-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-dashboard-success" />;
      default:
        return <Info className="h-4 w-4 text-dashboard-info" />;
    }
  };

  const getLogStyle = (type: LogEntry['type']) => {
    const baseStyle = "p-2 rounded-md mb-2 flex items-start gap-2";
    switch (type) {
      case 'error':
        return `${baseStyle} bg-red-500/10 text-red-200`;
      case 'warning':
        return `${baseStyle} bg-yellow-500/10 text-yellow-200`;
      case 'success':
        return `${baseStyle} bg-green-500/10 text-green-200`;
      default:
        return `${baseStyle} bg-blue-500/10 text-blue-200`;
    }
  };

  const parsedLogs = logs.map(parseLogType);

  return (
    <div className="bg-dashboard-card border border-dashboard-cardBorder rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dashboard-accent1">Debug Console</h2>
        <span className="text-sm text-dashboard-muted">
          {parsedLogs.length} log entries
        </span>
      </div>
      <ScrollArea className="h-[300px] rounded-md">
        <div className="space-y-2">
          {parsedLogs.map((log, index) => (
            <div key={index} className={getLogStyle(log.type)}>
              {getLogIcon(log.type)}
              <div className="flex-1">
                <div className="text-xs text-dashboard-muted mb-1">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                <div className="text-sm font-mono">{log.message}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};