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
  level: z.union([
    z.literal('error'),
    z.literal('warn'),
    z.literal('info'),
    z.literal('http'),
    z.literal('verbose'),
    z.literal('debug'),
    z.literal('silly'),
  ]),
  format: z.record(z.any()),
  transports: z.record(z.any()).array(),
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
