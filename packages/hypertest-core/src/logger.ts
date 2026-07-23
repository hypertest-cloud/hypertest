import winston from 'winston';

export const initializeLogger = (
  config: winston.LoggerOptions,
): winston.Logger =>
  winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    // Write to stderr so winston output doesn't corrupt ink's stdout rendering.
    transports: [new winston.transports.Console({ stderrLevels: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'] })],
    ...config,
  });
