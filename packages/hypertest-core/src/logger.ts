import winston from 'winston';

let loggerInstance: winston.Logger | null = null;

export const initLogger = (config: winston.LoggerOptions): winston.Logger => {
  loggerInstance = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
    ...config,
  });

  return loggerInstance;
};

export const getLogger = (): winston.Logger => {
  if (!loggerInstance) {
    throw new Error(
      'Logger has not been initialized. Function initLogger() has to be triggered first.',
    );
  }

  return loggerInstance;
};
