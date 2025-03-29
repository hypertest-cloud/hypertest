import {
  ConfigSchema,
  type ResolvedHypertestConfig,
} from '@hypertest/hypertest-types';
import { z } from 'zod';

export const getConfigFilepath = () => `${process.cwd()}/hypertest.config.js`;
export const loadConfig = async (): Promise<ResolvedHypertestConfig> => {
  const config: unknown = await import(getConfigFilepath());

  const module = await z
    .object({
      default: z.custom<unknown>((value) => value !== undefined, {
        message: 'hypertest.config.js is missing default export',
      }),
    })
    .parseAsync(config);

  const parsedConfig = await ConfigSchema.parseAsync(module.default);

  await parsedConfig.plugins.testPlugin.validate();
  await parsedConfig.plugins.cloudPlugin.validate();

  return parsedConfig;
};
