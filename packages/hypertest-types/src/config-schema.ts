import { z } from 'zod';

const LOCAL_BASE_IMAGE_NAME = 'hypertest/local-base-playwright';

const PluginDefinitionSchema = z.object({
  name: z.string(),
  version: z.string(),
  validate: z.function(),
  getCliDoctorChecks: z.function().optional(),
  handler: z.function(),
});

const WinstonLoggerOptions = z.object({
  levels: z.record(z.number()).optional(),
  silent: z.boolean().optional(),
  format: z.any().optional(),
  level: z
    .union([
      z.literal('error'),
      z.literal('warn'),
      z.literal('info'),
      z.literal('http'),
      z.literal('verbose'),
      z.literal('debug'),
      z.literal('silly'),
    ])
    .optional(),
  exitOnError: z.union([z.function(), z.boolean()]).optional(),
  defaultMeta: z.any().optional(),
  transports: z.union([z.any(), z.array(z.any())]).optional(),
  handleExceptions: z.boolean().optional(),
  handleRejections: z.boolean().optional(),
  exceptionHandlers: z.any().optional(),
  rejectionHandlers: z.any().optional(),
});

export const ConfigSchema = z
  .object({
    imageName: z.string(),
    localImageName: z.string().optional(),
    localBaseImageName: z.string().optional(),
    concurrency: z.number().int().default(1),
    loggerOptions: WinstonLoggerOptions.optional(),
    testRunner: PluginDefinitionSchema,
    cloudFunctionProvider: PluginDefinitionSchema,
  })
  .transform((config) => ({
    ...config,
    localImageName: config.localImageName ?? config.imageName,
    localBaseImageName: config.localBaseImageName ?? LOCAL_BASE_IMAGE_NAME,
  }));
