import { z } from 'zod';

const LOCAL_BASE_IMAGE_NAME = 'hypertest/local-base-playwright';

const PluginDefinitionSchema = z.object({
  name: z.string(),
  version: z.string(),
  validate: z.function(),
  handler: z.function(),
});

export const ConfigSchema = z
  .object({
    imageName: z.string(),
    localImageName: z.string().optional(),
    localBaseImageName: z.string().optional(),
    concurrency: z.number().int().default(1),
    testRunner: PluginDefinitionSchema,
    cloudFunctionProvider: PluginDefinitionSchema,
  })
  .transform((config) => ({
    ...config,
    localImageName: config.localImageName ?? config.imageName,
    localBaseImageName: config.localBaseImageName ?? LOCAL_BASE_IMAGE_NAME,
  }));
