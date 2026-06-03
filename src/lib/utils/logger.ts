// ============================================
// Structured Logger
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.context ? `[${entry.context}]` : ''} ${entry.message}`;
  return entry.data ? `${base} ${JSON.stringify(entry.data)}` : base;
}

function log(level: LogLevel, message: string, data?: unknown, context?: string): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, data?: unknown, context?: string) =>
    log('debug', message, data, context),
  info: (message: string, data?: unknown, context?: string) =>
    log('info', message, data, context),
  warn: (message: string, data?: unknown, context?: string) =>
    log('warn', message, data, context),
  error: (message: string, data?: unknown, context?: string) =>
    log('error', message, data, context),
};
