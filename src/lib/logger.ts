/**
 * Logger utility that respects environment settings.
 * In production, debug logs are suppressed while warnings and errors remain.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Only show debug logs in development
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function createLogger(context: string): Logger {
  const prefix = `[${context}]`;

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.debug(prefix, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog('info')) {
        console.info(prefix, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(prefix, ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(prefix, ...args);
      }
    },
  };
}

// Pre-configured loggers for different modules
export const loggers = {
  vision: createLogger('VisionService'),
  audio: createLogger('AudioService'),
  dialogue: createLogger('DialogueService'),
  orchestrator: createLogger('DialogueOrchestrator'),
  avatar: createLogger('DigitalHumanEngine'),
  chat: createLogger('ChatStream'),
  transport: createLogger('ChatTransport'),
  ws: createLogger('WSClient'),
  app: createLogger('App'),
} as const;

export default createLogger;
