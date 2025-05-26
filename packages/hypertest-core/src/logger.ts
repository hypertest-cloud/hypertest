import winston from 'winston';

export const initializeLogger = (
  config: winston.LoggerOptions,
): winston.Logger =>
  winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
    ...config,
  });
