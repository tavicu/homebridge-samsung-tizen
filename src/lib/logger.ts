import { LogLevel, Logging } from 'homebridge';

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
