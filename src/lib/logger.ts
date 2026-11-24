import { Logging, LogLevel } from 'homebridge';

const levels = ['info', 'success', 'warn', 'error', 'debug'] as const;

export function createDeviceLogger(log: Logging, name: string): Logging {
  const tag = (message: string) => `[${name}] ${message}`;
  const logger = ((message: string, ...args: unknown[]) => log(tag(message), ...args)) as Logging;

  for (const level of levels) {
    logger[level] = (message, ...args) => log[level](tag(message), ...args);
  }

  logger.log = (level: LogLevel, message, ...args) => log.log(level, tag(message), ...args);
  logger.prefix = name;

  return logger;
}

// Debug build: the Homebridge log only shows seconds, so every trace line carries its own time in milliseconds.
export function trace(log: Logging, scope: string, message: string): void {
  const now = new Date();
  const time = `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;

  log.debug(`[Trace ${time}] [${scope}] ${message}`);
}
